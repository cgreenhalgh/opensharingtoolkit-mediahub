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

