# form db (local), i.e. part/completed form information and upload metadata
# 
# Form db should include documents like:
#   _id: unique ID
#   _rev: local rev ID
#   formdef: mediahub form attributes: _id, survey (name, type, display:text), cardinality
#   formdata: as (survey item) name: value
#   draftdata: like formdata but for 'unsaved' current entry values, plus _finalized:bool
#   metadata:
#     createdtime: unixtime
#     saved: bool - no outstanding draft and not new
#     savedtime: unixtime
#     finalized: bool
#     submitted: bool
#     submittedtime: unixtime
#     submittedrev: string
#     submissionattempts: 
#       time: unixtime
#       error: string
#   versions: array of copies of metadata of finalized versions subsequently edited
FormInstance = require 'models/FormInstance'
FormInstanceList = require 'models/FormInstanceList'

dbname = 'formdata'

if false # window.openDatabase? 
  console.log "WARNING: forcing websql for formdb"  
  db = new PouchDB dbname, 
    adapter: 'websql'
else
  console.log "NOTE: using default pouchdb persistence for formdb"  
  db = new PouchDB dbname

module.exports.db = db

module.exports.getNewFormInstance = (form) ->
  id = 'forminstance:'+uuid()
  now = new Date().getTime()
  instance = new FormInstance 
    _id: id
    formdef: JSON.parse (JSON.stringify form.attributes)
    formdata: {}
    draftdata: null
    metadata:
      createdtime: now
      saved: false
      finalized: false
      submitted: false
  instance.sync = BackbonePouch.sync
    db: db
  try
    if false == instance.save {
        success: () -> 
          console.log "Saved new FormInstance #{id}"
        error: (model,res,options) ->
          console.log "Error saving new FormInstance #{id}: (error) #{res}"
      }
      console.log "Error saving new FormInstance #{id}: (validation)"
  catch err
    console.log "Error saving new FormInstance #{id}: (exception) #{err.message}"
  instance

module.exports.getInstancesForForm = (form, cb) ->
  console.log "Get instances for form #{form.id}"
  instances = new FormInstanceList()
  try
    map = (doc, emit) ->
      if doc.formdef?._id == form.id
        emit doc.metadata?.createdtime
    db.query {map:map}, {include_docs:true, reduce:false}, (err, response) ->
       if err?
         console.log "Error getting instances: #{err}"
         return cb err
       console.log "Query result: #{JSON.stringify response}"
       for res in response.rows
         console.log "Found instance #{res.doc._id} key #{res.key} for form #{res.doc.formdef._id}"
         instance = new FormInstance res.doc
         instance.sync = BackbonePouch.sync
           db: db
         instances.add instance 
       cb null, instances
  catch err
    console.log "Error doing getInstancesForForm: #{err.message} at #{err.stack}"
  instances

