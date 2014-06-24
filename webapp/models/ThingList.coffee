# list of Thing
Thing = require('models/Thing')

module.exports = class ThingList extends Backbone.Collection

  model: Thing

  pouch: 
    fetch: 'query' 
    listen: true 
    options:
      query:
        include_docs: true
        fun: 'app/type'
     changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeThing'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

