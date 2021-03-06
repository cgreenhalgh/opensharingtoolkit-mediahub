# File (initial) ContentType plugin
plugins = require 'plugins'
File = require 'models/File'
FileList = require 'models/FileList'
FileListView = require 'views/FileList'
FileInListView = require 'views/FileInList'
ThingView = require 'views/Thing'
FileEditView = require 'views/FileEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes =  
    id: 'file'
    title: 'File'
    description: 'A file to download/use, e.g. image, video, audio, PDF'

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

contentType = ThingBuilder.createThingType attributes, File, FileList, FileListView, FileInListView, ThingView, FileEditView

superCreateView = contentType.createView
contentType.createView = () ->
  thingsView = superCreateView()

  thingsView.model.ratings = {}
  # ratings, too
  $.ajax window.mediahubconfig.dburl+'/_design/app/_view/rating?group=true',
      success: (ratings) -> updateRatings thingsView.model, ratings
      dataType: "text"
      error: (xhr,status,err) ->
        console.log "get ratings error "+xhr.status+": "+err.message

  thingsView

plugins.registerContentType contentType.id, contentType

  
