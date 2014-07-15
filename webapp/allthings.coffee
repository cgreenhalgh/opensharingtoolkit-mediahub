# singleton ThingList model -all things
ThingList = require 'models/ThingList'
server = require 'server'

singleton = null

module.exports.get = () ->
  if not singleton?
    console.log "initialising ThingList for allthings"
    singleton = new ThingList()
    server.working 'allthings'
    singleton.fetch {
      success: server.success
      error: server.error
    }
  singleton

