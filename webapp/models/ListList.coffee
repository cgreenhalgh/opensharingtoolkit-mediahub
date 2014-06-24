# list of List
List = require('models/List')

module.exports = class ListList extends Backbone.Collection

  model: List

  pouch: 
    fetch: 'query' 
    listen: true
    options:
      query:
        include_docs: true
        startkey: 'list'
        endkey: 'list'
        fun: 'app/type'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeList'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

