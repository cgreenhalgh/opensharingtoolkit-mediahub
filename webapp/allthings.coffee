# singleton ThingList model -all things
ThingList = require 'models/ThingList'

singleton = null

module.exports.get = () ->
  if not singleton?
    console.log "initialising ThingList for allthings"
    singleton = new ThingList()
    singleton.fetch()
  singleton

