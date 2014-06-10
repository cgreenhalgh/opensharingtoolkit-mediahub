# Sync status (singleton, no DB)
localdb = require 'localdb'

module.exports = class SyncState extends Backbone.Model
  defaults:
    idle: true
    message: 'idle'

  localdbStatesToCheck: []
  successfns: []

  doSync: (successfn)->
    if successfn?
      @successfns.push successfn
    # shallow clone - might filter one day
    @localdbStatesToCheck.push ldb for ldb in localdb.localdbStateList.models when true
    if not @get 'idle'
      return false
    @set 
      idle:false
      message:'Attempting to synchronize...' 
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
    @syncIncoming localdbState

  syncOutgoing: (localdbState) -> 
    dbname = encodeURIComponent localdbState.id
    #db = localdb.getdb dbname
    console.log "replicate #{dbname} to #{localdbState.attributes.remoteurl}..."
    recurse = () => @checkNextLocaldb()
    PouchDB.replicate dbname, localdbState.attributes.remoteurl
     .on 'change', (info) ->
       console.log "- change #{JSON.stringify info}"
     .on 'complete', (info) ->
       console.log "- complete #{JSON.stringify info}"
       # ok:bool, last_seq:int, status:'complete'|?, errors:[]
       if info.ok and info.last_seq?
         console.log "update #{dbname} syncedSeq: #{info.last_seq}, lastSeq: #{localdbState.attributes.lastSeq}"
         localdbState.set 
           syncedSeq: info.last_seq
           hasLocalChanges: info.last_seq < localdbState.attributes.lastSeq
         try
           localdbState.save()
         catch err
           console.log "Error saving localdbState #{localdbState.id}: #{err.message}"
       setTimeout recurse, 0
     .on 'uptodate', (info) ->
       console.log "- uptodate #{JSON.stringify info}"
     .on 'error', (info) ->
       console.log "- error #{JSON.stringify info}"

  syncIncoming: (localdbState) -> 
    if localdbState.id != localdb.currentInstanceid()
      return @syncOutgoing localdbState

    dbname = encodeURIComponent localdbState.id
    #db = localdb.getdb dbname
    console.log "replicate #{localdbState.attributes.remoteurl} to #{dbname}..."
    recurse = () => @syncOutgoing(localdbState)
    callfns = @successfns.splice 0, @successfns.length
   
    # send each item[].id
    itemIds = item.id for item in localdb.currentConfig().items
    query_params = itemIds: JSON.stringify itemIds
    console.log "sync using app/clientsync #{JSON.stringify query_params}"
    PouchDB.replicate localdbState.attributes.remoteurl, dbname, {filter:'app/clientsync', query_params: query_params}
     .on 'change', (info) ->
       console.log "- change #{JSON.stringify info}"
     .on 'complete', (info) ->
       console.log "- complete #{JSON.stringify info}"
       # ok:bool, last_seq:int, status:'complete'|?, errors:[]
       for fn in callfns
         try
           fn info.ok 
         catch err
           console.log "Error calling sync success fn: #{err.message}"
       setTimeout recurse, 0
     .on 'uptodate', (info) ->
       console.log "- uptodate #{JSON.stringify info}"
     .on 'error', (info) ->
       console.log "- error #{JSON.stringify info}"

