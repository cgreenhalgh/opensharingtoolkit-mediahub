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
function addIndex(name) {
  var index = fs.readFileSync(path.join(__dirname, "templates/"+name+".html"));
  var showIndex = function(doc, req) {
    var index = "${@index}";
    return {
      headers: {"Content-type": "text/html"},
      body: index.replace(/[$][{][@]id[}]/g, doc._id)
    }
  };
  ddoc.shows[name] = showIndex.toString().replace("${@index}", minescape(index.toString()));
}
addIndex('index');
addIndex('trackinabox');

// matching manifest
var manifest = fs.readFileSync(path.join(__dirname, 'templates/manifest.appcache'));
var showManifest = function(doc, req) {
  var manifest = "${@manifest}";
  // too volatile, really...
  manifest = manifest + "\n# version "+(new Date().toUTCString())+"\n";
  manifest = manifest + "CACHE:\n";
  manifest = manifest + "../../../../"+doc._id+"\n";
  if (doc && doc.files) {
    for (var i in doc.files) {
      manifest = manifest + "# MEDIAHUB-FILE "+doc.files[i].type+" "+doc.files[i].title+"\n"+doc.files[i].url+"\n";
    }
  } 
  if (doc && doc.items) {
    for (var i in doc.items) {
      manifest = manifest + "# MEDIAHUB-ITEM "+doc.items[i].type+" "+doc.items[i].id+"\n"+doc.items[i].url+"\n";
    }
  } 
  return {
    headers: {"Content-type": "text/cache-manifest"},
    body: manifest
  }
};

// add index src="..." to manifest template
var index = fs.readFileSync(path.join(__dirname, "templates/index.html"));
manifest = manifest + "\nCACHE:\n";
var srcpatt = /src=["][^"]*["]/g;
var src;
while ((src=srcpatt.exec(index))!==null) {
  console.log("Found included file "+src);
  src = String(src);
  manifest = manifest + src.substring(5,src.length-1) + '\n';   
}

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
couchapp.loadAttachments(ddoc, path.join(__dirname, '../public'));

