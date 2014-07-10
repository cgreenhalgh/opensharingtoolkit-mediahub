# singleton TaskState model -all things
TaskStateList = require 'models/TaskStateList'

singleton = null

module.exports.get = () ->
  if not singleton?
    console.log "initialising TaskStateList for taskstates"
    singleton = new TaskStateList()
    singleton.fetch()
  singleton

