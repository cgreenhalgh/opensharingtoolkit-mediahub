# list of TaskState, esp singleton

module.exports = class TaskStaListet extends Backbone.Collection

  pouch: 
    fetch: 'query' 
    # NB LIVE!
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
        filter: 'app/changesTaskstate'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'


