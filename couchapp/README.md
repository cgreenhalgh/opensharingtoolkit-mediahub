# CouchApp Readme

This directory has the source and related assets for the couchdb design documents, i.e. server-side functionality.

This is installed using `couchapp push app.js COUCHDBURL` or equivalent - see the `../Makefile` target `couchapplocal`.

The aim is to support a number of dynamic HTML5 offline apps with configuration/assets dependent on online session(s) with the mediahub. A `CLIENTID` (stored as a cookie) correlates online activity and offline app specialisation. 

Basically `app.js` evaluates to the design document to be installed in couchdb as `DBNAME/_design/app`. When it is run (by `couchapp`) during the push process it pulls in various template files to set up views, etc:

- `DBNAME/_design/app/_show/index/CLIENTID` - returns a version of `templates/index.html` with mime type `text/html` and with `${@id}` replaced with `CLIENTID` (normally to make the manifest path match)
- `DBNAME/_design/app/_show/manifest/CLIENTID` - returns a version of `templates/manifest.appcache` with mime type `text/cache-manifest`.

Common static files should be included in `_attachments` and should be accessible under `DBNAME/_design/app/`.

