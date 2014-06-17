# list of files
File = require('models/File')

module.exports = class FileList extends Backbone.Collection

  model: File

  # see https://github.com/jo/backbone-pouch
  # we get ids starting 'file:' or (hopefully equivalently) with type = 'file'
  pouch: 
    fetch: 'query' 
    error: (err)->
          console.log "ERROR(FileList) (sync): #{err}"
    listen: true
    options:
      error: (err)->
          console.log "ERROR(FileList/options) (sync): #{err}"
      query: 
        include_docs: true
        fun: 'app/type'
        startkey: 'file'
        endkey: 'file'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/typeFile'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

