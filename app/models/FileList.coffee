# list of files
File = require('models/File')

module.exports = class FileList extends Backbone.Collection

  model: File

  # see https://github.com/jo/backbone-pouch
  # we just get everything at the moment, keyed by title
  pouch: 
    options: 
      query: 
        include_docs: true
        fun: 
          map: (doc) ->
            # runs on the server
            emit doc.title, null 
      changes: 
        include_docs: true
        continuous: true
        filter: (doc) -> 
          # runs on the server
          doc._deleted || true

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

