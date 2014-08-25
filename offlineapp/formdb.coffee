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
FormUpload = require 'models/FormUpload'

dbname = 'formdata'
app = undefined

if false # window.openDatabase? 
  console.log "WARNING: forcing websql for formdb"  
  db = new PouchDB dbname, 
    adapter: 'websql'
else
  console.log "NOTE: using default pouchdb persistence for formdb"  
  db = new PouchDB dbname

module.exports.db = db

module.exports.setApp = (a) ->
  app = a

formUploadState = new FormUpload id: 'formupload:singleton'
init = () ->
  console.log "Get finalized forms to upload"
  try
    map = (doc, emit) ->
      if doc.formdef?._id and doc.formdata? and doc.metadata?.saved and doc.metadata?.finalized and not doc.metadata?.submitted
        emit doc.metadata?.savedtime
    db.query {map:map}, {reduce:false}, (err, response) ->
       if err?
         console.log "Error getting finalized instances: #{err}"
         return cb err
       console.log "Finalized instance query result: #{JSON.stringify response}"
       uploadInstanceIds = []
       for res in response.rows
         console.log "- found finalized instance #{res.id} key #{res.key}"
         uploadInstanceIds.push res.id
       formUploadState.set uploadInstanceIds: uploadInstanceIds
         
  catch err
    console.log "Error doing init finalized forms: #{err.message} at #{err.stack}"
init()

module.exports.getFormUploadState = () -> formUploadState

module.exports.addFinalizedForm = (instance) ->
  console.log "addFinalizedForm #{instance.id}"
  uploadInstanceIds = formUploadState.attributes.uploadInstanceIds.concat [instance.id]
  formUploadState.set uploadInstanceIds: uploadInstanceIds

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
  instanceCache[instance._id] = instance
  instance

instanceCache = {}

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
         instanceCache[instance._id] = instance
       cb null, instances
  catch err
    console.log "Error doing getInstancesForForm: #{err.message} at #{err.stack}"
  instances

removeUploadInstanceId = (instanceId) ->
  ids = for id in (formUploadState.attributes.uploadInstanceIds ? []) when id!=instanceId
    id
  formUploadState.set uploadInstanceIds: ids

uploadFailed = (msg) ->
  formUploadState.failedUploads = formUploadState.failedUploads+1
  console.log "Upload failed for form instance (#{formUploadState.failedUploads}): #{msg}"
  formUploadState.set lastUploadState:'error'
  setTimeout uploadTask,0

uploadTask = () ->
  uploadInstanceIds = formUploadState.attributes.uploadInstanceIds ? []
  failedUploads = formUploadState.failedUploads
  if not (uploadInstanceIds.length>failedUploads)
    console.log "uploadTask with no (more) uploadInstanceIds, failed=#{failedUploads}"
    formUploadState.set uploading:false
    return
  instanceId = uploadInstanceIds[failedUploads]
  console.log "Upload instance #{instanceId}..."
  db.get instanceId, (err, instance) ->
    if err?
      return uploadFailed "Error getting form instance (#{failedUploads}) #{instanceId}: #{err}"
    if not(instance.formdef?._id and instance.formdata? and instance.metadata?.saved and instance.metadata?.finalized and not instance.metadata?.submitted)
      console.log "Form instance no longer ready to submit: #{JSON.stringify instance}"
      removeUploadInstanceId instanceId
      return setTimeout uploadTask,0
    data = JSON.parse (JSON.stringify instance.formdata)
    # standard metadata - cf taskrunner.coffee
    # submission metadata cf https://bitbucket.org/javarosa/javarosa/wiki/OpenRosaMetaDataSchema
    # JSON has no attributes per se (for required form id & optional version) so we will
    # pass in meta section as id & version
    # In meta, instanceID as required to uniquely identify form instance (version), as 'uuid:...'
    # Other defined instance metadata: timeStart, timeEnd, userID (mailto: openid:), 
    #   deviceID (imei: mac: uuid:), 
    #   deprecatedID (superceded instance/version) 
    if not data.meta?
      data.meta = {}
    ix = instanceId.indexOf ':'
    data.meta.instanceID = "uuid:#{ if ix<0 then instanceId else instanceId.substring ix+1}"
    data.meta.id = instance.formdef?._id
    data.meta.version = instance.formdef?.version
    data.meta.timeStart = new Date(instance.metadata.createdtime).toISOString()
    data.meta.timeEnd = new Date(instance.metadata.savedtime).toISOString()
    # find server
    if not app?
      return uploadFailed "app not set"
    if not app.serverId?
      return uploadFailed "app.serverId not set"
    submissionurls = for s in (app.servers ? []) when s.id==app.serverId
      s.submissionurl 
    if submissionurls.length==0
      return uploadFailed "app.servers #{app.serverId} submissionurl not found"
    submissionurl = submissionurls[0]
    console.log "using submission url #{submissionurl}"
    # Ha ha, browser FormData support not available in old browsers => hand roll?!
    # Or use url-encoded...
    postdata = 'json_submission_file='+encodeURIComponent(JSON.stringify data)
    postdata = postdata.replace /%20/g, '+'
    try
      $.ajax
        contentType: 'application/x-www-form-urlencoded' #'multipart/form-data'
        data: postdata
        error: (xhr, textStatus, errorThrown) ->
          console.log "submission err #{textStatus} #{errorThrown}"
          uploadFailed "submission err #{textStatus} #{errorThrown}"
        success: (data, textStatus, xhr) ->
          if xhr.status!=201
            return uploadFailed "submission return code #{xhr.status} - should be 201 (may be a proxy)"
          console.log "submission success code #{xhr.status} for #{instanceId}"
          removeUploadInstanceId instanceId
          # instance cache?
          model = instanceCache[instanceId]
          if not model?
            model = new FormInstance instance
            model.sync =  BackbonePouch.sync
              db: db
          metadata = JSON.parse (JSON.stringify model.attributes.metadata)
          metadata.submitted = true
          # save done - 
          model.set metadata: metadata
          if false == model.save null, {
            success: () ->
              console.log "saved submitted ok"
            error: (model,res,options) ->
              console.log "Save submitted error #{res}"
            }
            console.log "Save submitted error (validation)"
          setTimeout uploadTask, 0
        timeout: 30000
        type: 'POST'
        url: submissionurl
    catch err
      console.log "Error doing submit: #{err.message}"
      uploadFailed "Error doing submit: #{err.message}"

module.exports.startUpload = () ->
  if formUploadState.attributes.uploading
    console.log "start upload when already uploading - ignored"
    return
  console.log "Start upload..."
  formUploadState.failedUploads = 0
  formUploadState.set uploading: true, lastUploadState: 'success'
  setTimeout uploadTask,0

module.exports.releaseFormInstances = (instances) ->
  for instance in instances.models
    if instanceCache[instance._id]
      delete instanceCache[instance._id]
    else
      console.log "Error: did not find instance #{instance._id} in instance cache (release)"

