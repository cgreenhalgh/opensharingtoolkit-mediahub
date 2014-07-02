# cache monitor logic
CacheState = require 'models/CacheState'

state = new CacheState()

module.exports.state = state

onUpdate = []

module.exports.onUpdate = (cb)->
  onUpdate.push cb
  check_for_update()

appCache = window.applicationCache
lastState = -1

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
      message: 'A new version has been downloaded; reload this page to use it'
      updateReady: true
    when appCache.CHECKING 
      alertType: 'info'
      message: 'Checking for a new version'
    when appCache.DOWNLOADING 
      alertType: 'info'
      message: 'Downloading a new version'
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
  #console.log 'AppCache status = '+appCache.status+" (was #{lastState})"
  if appCache.status==lastState
    return false
  lastState = appCache.status
  console.log 'AppCache status = '+appCache.status
  updateState()  
  check_for_update()

check_for_update = () ->
  if onUpdate.length>0 and appCache.status==appCache.UPDATEREADY 
    try 
      appCache.swapCache()
      console.log "Swapped cache!"
      updateState()
      for cb in onUpdate
        try
          cb()
        catch err
          console.log "error calling cache onUpdate fn: #{err.message} #{err.stack}"
    catch err 
      console.log "cache swap error: #{err.message}"

#'' 
for event in "cached downloading checking error noupdate obsolete progress updateready".split(' ')
  appCache.addEventListener event, on_cache_event, false
on_cache_event()

