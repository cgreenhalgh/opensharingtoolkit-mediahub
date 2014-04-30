# FileList View
FileInListView = require 'views/FileInList'

module.exports = class FileListView extends Backbone.View

  tagName: 'div'
  className: 'file-list'

  initialize: ->
    @listenTo @model, 'add', @add

  render: =>
    @$el.empty()
    views = []
    @model.forEach @add
    @

  views: []

  add: (file, filelist) =>
    console.log "FileListView add #{file.attributes._id}"
    view = new FileInListView model: file
    @$el.append view.$el
    @views.push view
    
