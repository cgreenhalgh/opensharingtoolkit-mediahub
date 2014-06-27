# list of App
App = require('models/App')

module.exports = class AppList extends Backbone.Collection

  model: App

  pouch: 
    fetch: 'query' 
    listen: true
    options:
      query: 
        include_docs: true
        fun: 'app/type'
        startkey: 'app'
        endkey: 'app'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/appList'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

