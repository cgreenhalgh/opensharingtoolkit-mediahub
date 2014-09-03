# list of files, by mime-type
File = require('models/File')

module.exports = class ImageList extends Backbone.Collection

  model: File

  initialize: (models, options) ->
    if options.fileType
      key = options.fileType.split '/' 
      console.log "Filter files by fileType #{key}"
      @pouch.options.query.startkey = key
      if key[key.length-1] == ''
        @pouch.options.query.endkey = key.slice(0, key.length-1).concat [ 'ZZZZZ' ]
      else
        @pouch.options.query.endkey = key
    super()

  pouch: 
    fetch: 'query' 
    options:
      listen: false
      query: 
        include_docs: true
        fun: 'app/fileType'
        #startkey: ['image','']
        #endkey: ['image ','']

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

