opensharingtoolkit-mediahub
===========================

web app for sharing files, part of OpenSharingToolkit

Plan: initially try couchdb (pouchdb JS) for persistence.

Status: skeleton

## Install

You'll need npm, node, coffescript, zurb foundation tool(s), e.g. (ubuntu). N.B. you will need a relatively recent version of node and npm (certainly >0.6) so if you are using an older OS version you may need to download/build node and npm directly from their website(s).
```
sudo apt-get install npm
sudo apt-get install nodejs-legacy
sudo apt-get install couchdb

sudo npm install -g coffee-script

sudo apt-get install ruby1.9.1

sudo gem install compass

sudo npm install -g bower 
```
Get dependencies (see package.json):
```
npm install
cd public
bower install
```
Re-generate the CSS from SCSS (if changed, only):
```
cd public
compass compile
```
Export the assembled `public/js/app.js`:
```
coffee build.coffee
```
Set up couchdb CORS: edit (as root) `/etc/couchdb/local.ini` and after `[httpd]` add
```
enable_cors = true
``` 
and add a section (change origins according to app serving arrangements):
```
[cors]
credentials = true
origins = http://127.0.0.1:9294
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin
```
Set up some basic authentication - first an administrator: 
Edit (as root) `/etc/couchdb/local.ini` and after `[couch_httpd_auth]` add
```
require_valid_user = true
```
and after `[httpd]` add/uncomment
```
WWW-Authenticate = Basic realm="administrator"
```
and at the end of the file add (use your own password :-)
```
[admins]
admin = ADMINPASSWORD
```

Then kick the server:
```
sudo service couchdb restart
```
Now we'll two more generic users, a reader and a writer (although the difference in the latter two will have to be defined by us).
```
curl -HContent-Type:application/json -X PUT http://admin:ADMINPASSWORD@127.0.0.1:5984/_users/org.couchdb.user:hubreader --data-binary '{"_id":"org.couchdb.user:hubreader","type":"user","name":"hubreader","password":"HUBREADERPASSWORD","roles":["hubreader"]}'
curl -HContent-Type:application/json -X PUT http://admin:ADMINPASSWORD@127.0.0.1:5984/_users/org.couchdb.user:hubwriter --data-binary '{"_id":"org.couchdb.user:hubreader","type":"user","name":"hubwriter","password":"HUBWRITERPASSWORD","roles":["hubwriter"]}'
```
Create the database and add the `hubreader` and `hubwriter` as admins (!! doesn't work as members, failing with 401 on `_temp_view?include_docs=true`):
```
curl -X PUT http://admin:ADMINPASSWORD@127.0.0.1:5984/mediahub
curl -X PUT http://admin:ADMINPASSWORD@127.0.0.1:5984/mediahub/_security --data-binary '{"admins":{"names":["admin"],"roles":["hubwriter"]},"members":{"names":[],"roles":["hubreader"]}}'
```
You can check out how things are going with futon, [http://127.0.0.1:5984/_utils](http://127.0.0.1:5984/_utils)

Runs as server on port 9294 by default:
```
coffee index.coffee
```
