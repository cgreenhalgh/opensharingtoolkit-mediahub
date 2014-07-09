# list of TaskConfig
TaskConfig = require('models/TaskConfig')

module.exports = class TaskConfigList extends Backbone.Collection

  model: TaskConfig

  pouch: 
    fetch: 'query' 
    listen: true
    options:
      query: 
        include_docs: true
        fun: 'app/type'
        startkey: 'taskconfig'
        endkey: 'taskconfig'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeTaskconfig'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

