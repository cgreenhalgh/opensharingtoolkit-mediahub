# list of files
File = require('models/File')

module.exports = class ImageList extends Backbone.Collection

  model: File

  pouch: 
    fetch: 'query' 
    options:
      listen: false
      query: 
        include_docs: true
        fun: 'app/fileType'
        startkey: ['image','']
        endkey: ['image ','']

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

