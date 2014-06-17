# ThingList View
templateImageSelectList = require 'templates/ImageSelectList'
ThingListView = require 'views/ThingList'
ImageSelectView = require 'views/ImageSelect'

module.exports = class ImageSelectListView extends ThingListView

  template: (d) =>
    templateImageSelectList d

  add: (thing) =>
    console.log "ImageSelectListView add #{thing.id}"
    view = new ImageSelectView model: thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  events:
    "click .do-cancel": "closeWindow"

  closeWindow: ->
    console.log "Cancel = close"
    window.close()

