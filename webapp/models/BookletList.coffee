# list of Booklet
Booklet = require('models/Booklet')

module.exports = class BookletList extends Backbone.Collection

  model: Booklet

  pouch: 
    fetch: 'query' 
    listen: true
    options:
      query:
        include_docs: true
        startkey: 'booklet'
        endkey: 'booklet'
        fun: 'app/type'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeBooklet'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

