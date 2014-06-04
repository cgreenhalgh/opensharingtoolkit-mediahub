# cache monitor logic
CacheState = require 'models/CacheState'

state = new CacheState()

module.exports.state = state

onUpdate = []

module.exports.onUpdate = (cb)->
  onUpdate.push cb

appCache = window.applicationCache

updateState = ()->
  newState = switch appCache.status
    when appCache.UNCACHED  
      alertType: 'warning'
      message: 'This page is not saved; you will need Internet access to view it again'
    when appCache.IDLE
      alertType: 'success'
      bookmark: true
      message: 'Saved for off-Internet use'
    when appCache.UPDATEREADY 
      alertType: 'info'
      bookmark: true
      message: 'A new version has been downloaded'
      updateReady: true
    when appCache.CHECKING, appCache.DOWNLOADING 
      alertType: 'info'
      message: 'Checking for a new version'
    when appCache.OBSOLETE 
      alertType: 'warning'
      message: 'obsolete'
    else 
      alertType: 'warning'
      message: 'State unknown ('+appCache.status+')'
  newState = _.extend {bookmark:false, alertType:'', updateReady:false, state:appCache.status}, newState 
  console.log "update appcache state: #{JSON.stringify newState}"
  state.set newState

on_cache_event = (ev) ->
  console.log 'AppCache status = '+appCache.status
  updateState()  
  if appCache.status==appCache.UPDATEREADY 
    try 
      appCache.swapCache()
      console.log "Swapped cache!"
      updateState()
      for cb in onUpdate
        try
          cb()
        catch err
          console.log "error calling cache onUpdate fn: #{err.message}"
    catch err 
      console.log "cache swap error: #{err.message}"

$(appCache).bind "cached checking downloading error noupdate obsolete progress updateready", on_cache_event
on_cache_event()

