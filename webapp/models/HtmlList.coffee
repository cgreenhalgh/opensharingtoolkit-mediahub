# list of Html
Html = require('models/Html')

module.exports = class HtmlList extends Backbone.Collection

  model: Html

  # see https://github.com/jo/backbone-pouch
  # we get ids starting 'file:' or (hopefully equivalently) with type = 'file'
  pouch: 
    fetch: 'query' 
    error: (err)->
          console.log "ERROR(HtmlList) (sync): #{err}"
    listen: true
    options:
      error: (err)->
          console.log "ERROR(HtmlList/options) (sync): #{err}"
      query: 
        include_docs: true
        fun: 'app/type'
        startkey: 'html'
        endkey: 'html'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeHtml'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

