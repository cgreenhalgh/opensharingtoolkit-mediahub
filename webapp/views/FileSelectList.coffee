# ThingList View
templateFileSelectList = require 'templates/FileSelectList'
ThingListView = require 'views/ThingList'
FileSelectView = require 'views/FileSelect'
File = require 'models/File'
FileEditSelectView = require 'views/FileEditSelect'

module.exports = class FileSelectListView extends ThingListView

  template: (d) =>
    templateFileSelectList d

  getNewView: (thing) =>
    new FileSelectView model: thing
   
  events:
    "click .do-cancel": "closeWindow"
    "click .do-upload": "upload"

  closeWindow: ->
    console.log "Cancel = close"
    window.close()

  upload: =>
    console.log "Upload..."
    id = 'file:'+uuid()
    file = new File { _id: id }
    view = new FileEditSelectView {model: file, add: true, listView: @}
    $('body').append view.el
    @$el.hide()

