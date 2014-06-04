# local db
appcache = require 'appcache'

# waiting on backbone-pouch fix https://github.com/pouchdb/pouchdb/issues/2158
# interrim workaround - force websql (idp-specific failure)
db = new PouchDB 'offline', 
  adapter: 'websql'

localdb = new PouchDB 'local', 
  adapter: 'websql'

module.exports.getdb = () -> db

getArrayValue = (value, name) ->
  rval = []
  if value
    try 
      rval = JSON.parse value
    catch err
      console.log "Error in localStorage #{name}: #{value} #{err.message}"
    return rval
  console.log "Warning #{name} not initialised"
  return []

localdbs = getArrayValue localStorage.localdbs, 'localdbs'
unsavedLocaldbs = getArrayValue localStorage.unsavedLocaldbs, 'unsavedLocaldbs'
appcache.state.set unsavedLocaldbs: JSON.parse(JSON.stringify(unsavedLocaldbs))

module.exports.swapdb = (config) ->
  # use config._id and config._rev as uniquely defining this client instantiation
  instanceid = encodeURIComponent (config._id+":"+config._rev)
  console.log "swap local db to #{instanceid}"
  if dbchanges?
    dbchanges.cancel()
    dbchanges = null
  db = new PouchDB instanceid, 
    adapter: 'websql'
  # record?!
  if localdbs.indexOf(instanceid) < 0
    localdbs.push instanceid
    localStorage.localdbs = JSON.stringify localdbs
  # changes?
  dbchanges = db.changes 
    include_docs: false
    since: 'now'
    live: true
    returnDocs: false
  dbchanges.on 'change', (change) ->
    console.log "change to db #{instanceid} id=#{change.id} seq=#{change.seq}: #{JSON.stringify change}"
    if unsavedLocaldbs.indexOf(instanceid) < 0
      unsavedLocaldbs.push instanceid
      console.log "db #{instanceid} added to unsavedLocaldbs: #{JSON.stringify unsavedLocaldbs}" 
      localStorage.unsavedLocaldbs = JSON.stringify unsavedLocaldbs
      appcache.state.set unsavedLocaldbs: JSON.parse(JSON.stringify(unsavedLocaldbs))

