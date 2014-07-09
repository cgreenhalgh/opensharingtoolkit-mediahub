# node task runner for mediahub
PouchDB = require 'pouchdb'

log = (msg) -> 
  # compatible with couchdb external processes
  console.log JSON.stringify ["log", msg]

dburl = 'http://127.0.0.1:5984/mediahub'
log "connect to #{dburl}"
db = new PouchDB dburl

db.changes(
  include_docs: true
  #	live: true
  filter: 'app/typeTaskstate'
).on 'change', (change)->
  log "state: #{JSON.stringify change.doc}"
.on 'complete', ()->
  log "state complete - getting tasks..."
  startTasks()
.on 'error', (err)->
  log "state error #{err}"

tasks = {} 

startTasks = () ->
  db.changes
    include_docs: true
    live: true
    filter: 'app/typeTaskconfig'
  .on 'change', (change)->
    #log "config: #{JSON.stringify change.doc}"
    updateConfig change.doc
  .on 'complete', ()->
    log "config complete"
  .on 'error', (err)->
    log "config error #{err}"
    process.exit -1

# couchdb config
stdin = process.openStdin()
stdin.on 'data', (d) ->
  log "config data: #{d}"

updateConfig = (config) ->
  id = config._id
  ix = id.indexOf ':'
  if ix>=0 then id = id.substring ix+1
  task = tasks[id]
  if not task?
    tasks[id] = task = {}
  log "#{if task.config? then 'update' else 'add'} task #{id} config #{JSON.stringify config}"
  task.config = config
  # TODO

