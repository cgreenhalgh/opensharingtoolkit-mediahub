# bower update
COUCHDB=http://admin:admin@127.0.0.1:5984/mediahub

default:
	# css - compile scss -> css
	# compile - compile coffeescript -> javascript
	# couchapplocal - upload files to COUCHDB
	# ...

bower_update:
	cd bower update

bower_copy:
	mkdir -p public/vendor
	mkdir -p public/vendor/jquery
	cp -puR bower_components/jquery/dist public/vendor/jquery
	mkdir -p public/vendor/foundation
	cp -puR bower_components/foundation/scss public/vendor/foundation
	cp -puR bower_components/foundation/css public/vendor/foundation
	mkdir -p public/vendor/foundation/js
	cp -puR bower_components/foundation/js/foundation* public/vendor/foundation/js
	mkdir -p public/vendor/underscore
	cp -puR bower_components/underscore/underscore.js public/vendor/underscore
	mkdir -p public/vendor/backbone
	cp -puR bower_components/backbone/backbone.js public/vendor/backbone
	mkdir -p public/vendor/pouchdb/dist
	cp -pu bower_components/pouchdb/dist/pouchdb-nightly.js public/vendor/pouchdb/dist
	cp -pu bower_components/pouchdb/dist/pouchdb-nightly.min.js public/vendor/pouchdb/dist
	mkdir -p public/vendor/backbone-pouchdb
	cp -puR bower_components/backbone-pouchdb/dist public/vendor/backbone-pouchdb
	mkdir -p public/vendor/modernizr
	cp -puR bower_components/modernizr/modernizr.js public/vendor/modernizr

css:
	compass compile

coffee:
	coffee build.coffee

.PHONY: fixcouchapp 

# there is a problem with couchapp 0.11.0 and request 2.41+ which this works around
# https://github.com/mikeal/node.couchapp.js/issues/101
fixcouchapp: 
	sed -i 's/headers:h/headers:copy(h)/g' node_modules/couchapp/main.js

couchapplocal: fixcouchapp
	`npm bin`/couchapp push couchapp/app.js ${COUCHDB}

serverapplocal:
	`npm bin`/couchapp push server/couchapp/server.js ${COUCHDB}

