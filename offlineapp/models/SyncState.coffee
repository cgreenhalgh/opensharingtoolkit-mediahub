# Sync status (singleton, no DB)
localdb = require 'localdb'

module.exports = class SyncState extends Backbone.Model
  defaults:
    idle: true
    message: 'idle'

  localdbStatesToCheck: []

  doSync: ()->
    if not @get 'idle'
      return false
    @set 
      idle:false
      message:'Attempting to synchronize...' 
    # shallow clone - might filter one day
    @localdbStatesToCheck.push ldb for ldb in localdb.localdbStateList.models when true
    @checkNextLocaldb()

  checkNextLocaldb: () ->
    if @localdbStatesToCheck.length == 0
      console.log "No more localdbs to check"
      @set
        idle: true
        message: 'Idle (all localdbs checked)'
      return
    localdbState = (@localdbStatesToCheck.splice 0,1)[0]
    @set 
      idle:false
      message:"Attempting to synchronize #{localdbState.id}..."
    dbname = encodeURIComponent localdbState.id
    #db = localdb.getdb dbname
    console.log "replicate #{dbname} to #{localdbState.attributes.remoteurl}..."
    recurse = () => @checkNextLocaldb()
    PouchDB.replicate dbname, localdbState.attributes.remoteurl
     .on 'change', (info) ->
       console.log "- change #{JSON.stringify info}"
     .on 'complete', (info) ->
       console.log "- complete #{JSON.stringify info}"
       setTimeout recurse, 0
     .on 'uptodate', (info) ->
       console.log "- uptodate #{JSON.stringify info}"
     .on 'error', (info) ->
       console.log "- error #{JSON.stringify info}"

