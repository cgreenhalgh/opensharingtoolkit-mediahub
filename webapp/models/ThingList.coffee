# list of Thing
Thing = require('models/Thing')

module.exports = class ThingList extends Backbone.Collection

  model: Thing

  pouch: 
    fetch: 'query' 
    listen: false # NB one-shot
    options:
      query:
        include_docs: true
        fun: 'app/type'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

