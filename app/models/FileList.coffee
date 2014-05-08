# list of files
File = require('models/File')

module.exports = class FileList extends Backbone.Collection

  model: File

  # see https://github.com/jo/backbone-pouch
  # we get ids starting 'file:' or (hopefully equivalently) with type = 'file'
  # NB fetch: query requires databse admin privileges. Listen requires query.
  pouch: 
    fetch: 'allDocs' 
    error: (err)->
          console.log "ERROR(FileList) (sync): #{err}"
    options:
      error: (err)->
          console.log "ERROR(FileList/options) (sync): #{err}"
      listen: false
      allDocs:
        include_docs: true
        startkey: 'file:'
        endkey: 'file;'
      query: 
        include_docs: true
        fun: 
          map: (doc) ->
            # runs on the server
            if doc.type=='file'
              emit doc.title, null 
      changes: 
        include_docs: true
        continuous: true
        filter: (doc) -> 
          # runs on the server
          doc._deleted || doc.type=='file'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

