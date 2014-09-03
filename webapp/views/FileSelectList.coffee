# ThingList View
templateFileSelectList = require 'templates/FileSelectList'
ThingListView = require 'views/ThingList'
FileSelectView = require 'views/FileSelect'

module.exports = class FileSelectListView extends ThingListView

  template: (d) =>
    templateFileSelectList d

  addItem: (thing) =>
    console.log "FileSelectListView add #{thing.id}"
    view = new FileSelectView model: thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  events:
    "click .do-cancel": "closeWindow"

  closeWindow: ->
    console.log "Cancel = close"
    window.close()

