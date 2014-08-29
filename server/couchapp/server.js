// couch app source - run/push with couchapp
console.log("Running couchapp server.js");

var couchapp = require('couchapp')
  , path = require('path')
  , fs = require('fs')

ddoc = {
  _id: '_design/server'
, views: {}
, lists: {}
, shows: {}
, filters: {} 
}

module.exports = ddoc;

// view type Form
ddoc.views.typeForm = {
  map: function(doc) {
    if (doc._id && doc.type=='form') {
      emit(doc.title, null);
    }  
  }
};
// view formdata by meta.applicationID / meta.id (form) / meta.userID ? meta.deviceID -> _count
ddoc.views.formdataByAppFormUser = {
  map: function(doc) {
    if (doc._id && doc.type=='formdata') {
      if (doc.meta) 
        emit([doc.meta.applicationID ? doc.meta.applicationID : '', 
          doc.meta.id ? doc.meta.id : '', 
          doc.meta.userID ? doc.meta.userID : (doc.meta.deviceID ? doc.meta.deviceID : '')], null);
      else
        emit(['','',''], null);
    }
  },
  reduce: '_count'
};
// list as CSV for use with formdata
// TODO: meta escape
ddoc.lists.csv = function(head, req){
  start({
    'headers': {
      'Content-Type': 'text/csv; encoding=utf-8'
    }
  });
  var docs = [], names = {}, row, doc;
  // headers?
  while (row = getRow()) {
    if (row.doc) {
      doc = {};
      for (var name in row.doc) {
        if (name === 'type') {
          doc['_type'] = row.doc.type;
          names['_type'] = true;
        } else if (name === 'meta') {
          for (var mname in row.doc.meta) {
            doc['_'+mname] = row.doc.meta[mname];
            names['_'+mname] = true;
          }        
        } else {
          doc[name] = row.doc[name];
          names[name] = true;
        }
      }
      docs.push(doc);
    }
  }
  var cnames = [];
  for (var name in names) { 
    cnames.push(name);
  }
  cnames.sort();
  var esc = function(val) {
    if (val === null || val === undefined) 
      ; // no-op
    else if (typeof val === "number" || typeof val === "boolean")
      send(String(val));
    else {
      if (typeof val !== "string")
        val = String(val);
      val = val.replace( /["]/g, '""' );
      val = val.replace( /[\n]/g, '\\n' );
      send('"'+val+'"');
    }
  };
  for (var i in cnames) {
    var name = cnames[i];
    if (i>0)
      send(',');
    esc(name);
  }
  send('\r\n');
  for (var di in docs) {
    doc = docs[di];
    for (var i in cnames) {
      var name = cnames[i];
      if (i>0)
        send(',');
      esc(doc[name]);
    }
    send('\r\n');
  }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
  function user_is(role) {
    return userCtx.roles.indexOf(role) >= 0;
  }
  if (user_is('serverwriter') && newDoc && newDoc._id && newDoc._id.indexOf('_design/')==0)
    throw({forbidden : "serverwriter "+userCtx.name+" cannot change design document: " + newDoc._id});
  if (user_is('serverreader'))
    throw({forbidden : "serverreader "+userCtx.name+" cannot update documents: " + newDoc._id}); 
};

//couchapp.loadAttachments(ddoc, path.join(__dirname, '_attachments'));
couchapp.loadAttachments(ddoc, path.join(__dirname, '../../public'));

