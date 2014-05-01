# bower update

bower_update:
	cd public; bower update

bower_copy:
	mkdir -p public/vendor
	mkdir -p public/vendor/jquery
	cp -puR public/bower_components/jquery/dist public/vendor/jquery
	mkdir -p public/vendor/foundation
	cp -puR public/bower_components/foundation/*/ public/vendor/foundation
	mkdir -p public/vendor/underscore
	cp -puR public/bower_components/underscore/underscore.js public/vendor/underscore
	mkdir -p public/vendor/backbone
	cp -puR public/bower_components/backbone/backbone.js public/vendor/backbone
	mkdir -p public/vendor/pouchdb
	cp -puR public/bower_components/pouchdb/dist public/vendor/pouchdb
	mkdir -p public/vendor/backbone-pouchdb
	cp -puR public/bower_components/backbone-pouchdb/dist public/vendor/backbone-pouchdb
	mkdir -p public/vendor/modernizr
	cp -puR public/bower_components/modernizr/modernizr.js public/vendor/modernizr

css:
	cd public; compass compile

