# list of Html
Html = require('models/Html')

module.exports = class HtmlList extends Backbone.Collection

  model: Html

  # see https://github.com/jo/backbone-pouch
  # we get ids starting 'file:' or (hopefully equivalently) with type = 'file'
  # NB fetch: query requires databse admin privileges. Listen requires query.
  pouch: 
    fetch: 'allDocs' 
    error: (err)->
          console.log "ERROR(HtmlList) (sync): #{err}"
    options:
      error: (err)->
          console.log "ERROR(HtmlList/options) (sync): #{err}"
      listen: false
      allDocs:
        include_docs: true
        startkey: 'html:'
        endkey: 'html;'
      query: 
        include_docs: true
        fun: 
          map: (doc) ->
            # runs on the server
            if doc.type=='html'
              emit doc.title, null 
      changes: 
        include_docs: true
        continuous: true
        filter: (doc) -> 
          # runs on the server
          doc._deleted || doc.type=='html'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

