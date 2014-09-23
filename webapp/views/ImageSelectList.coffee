# ThingList View
templateImageSelectList = require 'templates/ImageSelectList'
ThingListView = require 'views/ThingList'
ImageSelectView = require 'views/ImageSelect'
File = require 'models/File'
FileEditSelectView = require 'views/FileEditSelect'

module.exports = class ImageSelectListView extends ThingListView

  template: (d) =>
    templateImageSelectList d

  addItem: (thing) =>
    console.log "ImageSelectListView add #{thing.id}"
    view = new ImageSelectView model: thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
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

