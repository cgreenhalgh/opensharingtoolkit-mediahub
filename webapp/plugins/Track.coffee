# File/Track (initial) ContentType plugin
plugins = require 'plugins'
ContentType = require 'models/ContentType'
File = require 'models/File'
FileList = require 'models/FileList'
FileListView = require 'views/FileList'
FileEditView = require 'views/FileEdit'

files = null

trackType = new ContentType 
    id: 'Track'
    title: 'File/Track'
    description: 'Initial test/development content type - part file, part audio track'

updateRatings = (files, ratings) ->
  try 
    ratings = JSON.parse ratings
  catch err
    console.log "Error parsing ratings: #{err.message}: #{ratings}"
    return
  #{rows:[{key:"FILEID",value:[SUM,COUNT]}]}
  for row in ratings.rows
    files.ratings[row.key] = row.value
    file = files.get row.key
    if file?
      console.log "Set ratings on load-ratings #{file.id} #{JSON.stringify row.value}"
      file.set 
        ratingSum: row.value[0]
        ratingCount: row.value[1]

trackType.createView = () ->
    console.log "create Track view"
    files = new FileList()
    filesView = new FileListView model:files
    filesView.render()
    #$('body').append filesView.el

    #files.reset files.to_json 
    files.fetch()
    files.ratings = {}
    # ratings, too
    $.ajax window.mediahubconfig.dburl+'/_design/app/_view/rating?group=true',
      success: (ratings) -> updateRatings files, ratings
      dataType: "text"
      error: (xhr,status,err) ->
        console.log "get ratings error "+xhr.status+": "+err.message

    return filesView

trackType.createActionView = (action,id) ->
  if action=='edit'
    file = files.get id
    if not file?
      alert "could not find Track #{id}"
      return
    return new FileEditView model: file
  else
    console.log "unknown Track action #{action} (id #{id})"

plugins.registerContentType 'Track', trackType
  
  
