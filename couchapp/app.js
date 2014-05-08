// couch app source - run/push with couchapp
console.log("Running couchapp app.js");

var couchapp = require('couchapp')
  , path = require('path')
  , fs = require('fs')

ddoc = {
  _id: '_design/app'
, views: {}
, lists: {}
, shows: {} 
}

module.exports = ddoc;

var jsescape = function(s) {
  return s.replace(/[\\]/g,'\\\\').replace(/[\n]/g,' ').replace(/[\"]/g,'\\"').replace(/\s+/g, ' ');
}
var minescape = function(s) {
  return s.replace(/[\\]/g,'\\\\').replace(/[\n]/g,'\\n').replace(/[\"]/g,'\\"').replace(/[\t]/g,'\\t');
}

// Example HTML index page generator with manifest over-ride 
// utf8 is default
var index = fs.readFileSync(path.join(__dirname, 'templates/index.html'));
var showIndex = function(doc, req) {
  var index = "${@index}";
  return {
    headers: {"Content-type": "text/html"},
    body: index.replace("${@id}", doc._id)
  }
};
ddoc.shows.index = showIndex.toString().replace("${@index}", jsescape(index.toString()));

// matching manifest
var manifest = fs.readFileSync(path.join(__dirname, 'templates/manifest.appcache'));
var showManifest = function(doc, req) {
  var manifest = "${@manifest}";
  // too volatile, really...
  manifest = manifest + "\n# version "+(new Date().toUTCString())+"\n";
  return {
    headers: {"Content-type": "text/cache-manifest"},
    body: manifest
  }
};

ddoc.shows.manifest = showManifest.toString().replace("${@manifest}", minescape(manifest.toString()));

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
  function user_is(role) {
    return userCtx.roles.indexOf(role) >= 0;
  }
  if (user_is('hubwriter') && newDoc && newDoc._id && newDoc._id.indexOf('_design/')==0)
    throw({forbidden : "Hubwriter "+userCtx.name+" cannot change design document: " + newDoc._id});
  if (user_is('hubreader'))
    throw({forbidden : "Hubreader "+userCtx.name+" cannot update documents: " + newDoc._id}); 
};

couchapp.loadAttachments(ddoc, path.join(__dirname, '_attachments'));

