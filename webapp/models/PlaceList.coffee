# list of Place
Place = require('models/Place')

module.exports = class PlaceList extends Backbone.Collection

  model: Place

  pouch: 
    fetch: 'query' 
    listen: true
    options:
      query:
        include_docs: true
        startkey: 'place'
        endkey: 'place'
        fun: 'app/type'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typePlace'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

