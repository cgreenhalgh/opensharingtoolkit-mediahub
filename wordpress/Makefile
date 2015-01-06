default: wototo.zip

wototo.zip: 
	-mkdir wototo
	cp -r plugins/wototo/* wototo/
	cp -r ../public/vendor wototo/
	cp -r ../public/stylesheets wototo/
	cp -r ../public/icons wototo/
	-mkdir wototo/js
	cp ../public/js/offlineapp.js wototo/js/
	cp ../couchapp/_attachments/clientid.js wototo/
	-rm wototo.zip
	zip -r wototo.zip wototo/

.PHONY: wototo.zip

