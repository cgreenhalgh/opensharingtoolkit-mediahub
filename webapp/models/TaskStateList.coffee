# list of TaskState, esp singleton

module.exports = class TaskConfigList extends Backbone.Collection

  pouch: 
    fetch: 'query' 
    listen: true
    options:
      query: 
        include_docs: true
        fun: 'app/type'
        startkey: 'taskstate'
        endkey: 'taskstate'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeTaskstate'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'

