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
, filters: {} 
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

ddoc.filters.clientsync = function(doc, req) {
  if (doc._id.indexOf('trackreview:')!==0) {
    return false;
  }
  // req.query.itemIds = JSON-encoded array of (e.g.) track (file) IDs
  if (doc.trackid && req.query.itemIds) {
    encid = JSON.stringify(doc.trackid);
    return req.query.itemIds.indexOf(encid)>=0;
  }
  return true; // passed!
};

// view of trackreview rating
ddoc.views.rating = {
  map: function(doc) {
    if (doc._id.indexOf('trackreview:')===0 && doc.rating && doc.trackid) {
      emit(doc.trackid, [doc.rating,1]);
    }  
  },
  reduce: function(keys, values, rereduce) {
    var res = [0,0];
    for (var i in values) {
      res[0] += values[i][0];
      res[1] += values[i][1];
    }  
    return res;
  }
};

// view of file by mime type
ddoc.views.fileType = {
  map: function(doc) {
    if (doc._id.indexOf('file:')===0 && doc.fileType) {
      emit(doc.fileType.split('/'), {title:doc.title});
    }  
  }
};

// view of doc by type
ddoc.views.type = {
  map: function(doc) {
    if (doc._id && doc.type) {
      emit(doc.type, null);
    }  
  }
};

// filter type Html
ddoc.filters.typeHtml = function(doc) {
  if (doc.type && doc.type === 'html') {
    return true;
  }
  return false;
};
// filter type File
ddoc.filters.typeFile = function(doc) {
  if (doc.type && doc.type === 'file') {
    return true;
  }
  return false;
};
// filter type TrackReview
ddoc.filters.typeTrackReview = function(doc) {
  if (doc.type && doc.type === 'trackReview') {
    return true;
  }
  return false;
};
// filter type Booklet
ddoc.filters.typeBooklet = function(doc) {
  if (doc.type && doc.type === 'booklet') {
    return true;
  }
  return false;
};
// filter type Place
ddoc.filters.typePlace = function(doc) {
  if (doc.type && doc.type === 'place') {
    return true;
  }
  return false;
};
// filter type List
ddoc.filters.typeList = function(doc) {
  if (doc.type && doc.type === 'list') {
    return true;
  }
  return false;
};
// filter type Thing, i.e. anything for now!
ddoc.filters.typeThing = function(doc) {
  if (doc.type) {
    return true;
  }
  return false;
};

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

