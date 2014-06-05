# list of LocaldbState
LocaldbState = require('models/LocaldbState')

module.exports = class LocaldbStateList extends Backbone.Collection

  model: LocaldbState

  # NB fetch: query requires databse admin privileges. Listen requires query.
  pouch: 
    fetch: 'allDocs' 
    options:
      listen: false
      allDocs:
        include_docs: true

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'

