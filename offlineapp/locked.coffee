# locked stuff

templateLockedModal = require 'templates/LockedModal'

module.exports.showLockedAlert = (model) ->
  $('#lockedModalHolder').html templateLockedModal {title:'Sorry, this item is currently locked', description:'You may be able to unlock it by scanning or entering a code.' }
  $('#lockedModalHolder').foundation 'reveal', 'open'

#module.exports.unlock = ( type, code ) ->

# using backbone-indexeddb https://github.com/superfeedr/indexeddb-backbonejs-adapter

# id is lockId

database = 
  id: "wototo",
  description: "The Wototo web app database",
  migrations : [
    version: 1
    migrate: (transaction, next) ->
      store = transaction.db.createObjectStore("unlocks")
      # store.createIndex("titleIndex", "title", { unique: true}); 
      next()
  ]

class UnlockState extends Backbone.Model
  database: database
  storeName: 'unlocks'
  defaults:
    unlocked: false

#console.log "create UnlockState test..."
#test = new UnlockState _id: 'test'

unlocks = {}

module.exports.getUnlockState = getUnlockState = ( item ) ->
  if not item.attributes.lockId?
    console.log "cannot get UnlockState for item #{item.id} without lockId"
    return new UnlockState { unlocked: true }
  id = item.attributes.lockId
  unlock = unlocks[id]
  if unlock?
    return unlock
  unlock = new UnlockState _id: id
  unlocks[id] = unlock
  console.log "make UnlockState #{id}..."
  unlock.fetch
    success: (model,resp,options) ->
      console.log "fetched UnlockState #{id}"
    error: (model,resp,options) ->
      console.log "error fetching UnlockState #{id}: #{options.textStatus} #{options.errorThrown}"
  unlock

module.exports.unlock = ( item ) ->
  if not item.attributes.lockId?
    return console.log "cannot unlock item #{item.id} without lockId"
  if item.attributes.locked==2
    return console.log "cannot unlock always locked item #{item.id}"
  unlock = getUnlockState item
  if unlock.attributes.unlocked
    return
  unlock.set 'unlocked', true
  if false==unlock.save null, {
      success: (model,resp,options) ->
        console.log "saved UnlockState #{unlock.id} unlocked"
      error: (model,resp,options) ->
        console.log "error saving UnlockState #{unlock.id} unlocked: #{options.textStatus} #{options.errorThrown}"
    }
    console.log "error (validation) saving UnlockState #{unlock.id} unlocked"

module.exports.clear = () ->
  console.log "clear all unlock records..."
  indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB 
  lastMigrationPathVersion = _.last(database.migrations).version
  dbRequest = indexedDB.open(database.id,lastMigrationPathVersion)
  dbRequest.onsuccess = (e) ->
    console.log "...opened database..."
    # clear cache
    unlocks = {} 
    db = e.target.result
    deleteTransaction = db.transaction(['unlocks'], "readwrite")
    store = deleteTransaction.objectStore('unlocks')
    deleteRequest = store.clear()
    deleteRequest.onsuccess = (event) ->
      console.log "cleared all unlock records"
      db.close()
    deleteRequest.onerror = (event) ->
      console.log "Error clearing unlock records"
      db.close()

