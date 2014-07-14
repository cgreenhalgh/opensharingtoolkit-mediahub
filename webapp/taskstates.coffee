# singleton TaskState model -all things
TaskStateList = require 'models/TaskStateList'
server = require 'server'

singleton = null

module.exports.get = () ->
  if not singleton?
    console.log "initialising TaskStateList for taskstates"
    singleton = new TaskStateList()
    server.working 'taskstates'
    singleton.fetch
      success: server.success
      error: server.error
  singleton

