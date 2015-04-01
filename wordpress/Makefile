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

wototo.tgz: wototo.zip
	tar zcf wototo.tgz wototo/

artcode.zip: 
	-mkdir artcode
	cp -r plugins/artcode/* artcode/
	-rm artcode.zip
	zip -r artcode.zip artcode/

.PHONY: artcode.zip

artcode.tgz: artcode.zip
	tar zcf artcode.tgz artcode/

