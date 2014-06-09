# local db
appcache = require 'appcache'
LocaldbState = require 'models/LocaldbState'
LocaldbStateList = require 'models/LocaldbStateList'

dbcache = {}
getdb = (url) ->
  if dbcache[url]?
    dbcache[url]
  else
    dbcache[url] = db = new PouchDB url, 
      adapter: 'websql'
    db

module.exports.getdb = getdb

# waiting on backbone-pouch fix https://github.com/pouchdb/pouchdb/issues/2158
# interrim workaround - force websql (idp-specific failure)
metadb = getdb 'metadata'

module.exports.metadb = metadb

# current 'local' db
db = getdb 'initial'

module.exports.getdb = () -> db

LocaldbState.prototype.sync = BackbonePouch.sync
  db: metadb
localdbStateList = new LocaldbStateList()
localdbStateList.sync = BackbonePouch.sync
  db: metadb

module.exports.init = (cb) ->
  call = () ->
      try 
        cb()
      catch err
        console.log "Error calling localdb.init callback: #{err.message} #{err.stack}"
  localdbStateList.fetch
    success: (collection,response,options)->
      console.log "LocaldbState fetched - calling back"
      call()
    error: (collection,response,options)->
      console.log "LocaldbState fetch failed! - #{response}"
      call()

module.exports.localdbStateList = localdbStateList

module.exports.swapdb = (dburl, config) ->
  # use config._id and config._rev as uniquely defining this client instantiation
  # URIEncoding seems to be undone when used as a document ID
  instanceid = config._id+":"+config._rev
  dbname = encodeURIComponent instanceid
  console.log "swap local db to #{instanceid}"
  if dbchanges?
    dbchanges.cancel()
    dbchanges = null
  db = getdb dbname
  # record?!
  localdbState = localdbStateList.get instanceid
  if not localdbState?
    console.log "Create LocaldbState #{instanceid}"
    localdbState = new LocaldbState {_id:instanceid, remoteurl:dburl}
    try 
      localdbState.save()
    catch err
      console.log "error saving LocaldbState #{instanceid}: #{err.message}"
    localdbStateList.add localdbState
  else if not localdbState.attributes.remoteurl?
    console.log "initialise localdb remoteurl #{dburl}"
    localdbState.set remoteurl: dburl
    try
      localdbState.save()
    catch err
      console.log "error saving LocaldbState (set remoteurl) #{instanceid}: #{err.message}"
  else if localdbState.attributes.remoteurl != dburl
    console.log "WARNING: new dburl does not match localdb remoteurl: #{dburl} vs #{localdbState.attributes.remoteurl}"

  # changes?
  dbchanges = db.changes 
    include_docs: false
    since: 'now'
    live: true
    returnDocs: false
  dbchanges.on 'change', (change) ->
    console.log "change to db #{instanceid} id=#{change.id} seq=#{change.seq}: #{JSON.stringify change}"
    if localdbState.get('hasLocalChanges')==false
      localdbState.set hasLocalChanges: true
      console.log "db #{instanceid} set hasLocalChanges"
      try 
        localdbState.save()
      catch 
        console.log "error saving LocaldbState #{instanceid}: #{err.message}"

