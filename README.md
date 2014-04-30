opensharingtoolkit-mediahub
===========================

web app for sharing files, part of OpenSharingToolkit

Plan: initially try couchdb (pouchdb JS) for persistence.

Status: skeleton

## Install

You'll need npm, node, coffescript, zurb foundation tool(s), e.g. (ubuntu 10.x)
```
sudo apt-get install npm
sudo apt-get install nodejs-legacy

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
Runs as server on port 9294 by default:
```
coffee index.coffee
```
