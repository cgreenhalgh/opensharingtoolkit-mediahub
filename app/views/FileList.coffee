# FileList View
File = require 'models/File'
FileInListView = require 'views/FileInList'
FileEditView = require 'views/FileEdit'
templateFileList = require 'templates/FileList'

module.exports = class FileListView extends Backbone.View

  tagName: 'div'
  className: 'file-list'

  initialize: ->
    @listenTo @model, 'add', @add
    @listenTo @model, 'remove', @remove

  template: (d) =>
    templateFileList d

  render: =>
    console.log "render FileList with template"
    @$el.html @template @model.attributes
    views = []
    @model.forEach @add
    @

  views: []

  add: (file) =>
    console.log "FileListView add #{file.attributes._id}"
    view = new FileInListView model: file
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  remove: (file) =>
    console.log "FileListView remove #{file.attributes._id}"
    for view, i in @views when view.model.id == file.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  events:
    "click .do-add-file": "addFile"

  addFile: (ev) =>
    console.log "addFile"
    ev.preventDefault()
    @$el.hide()
    # work-around backbone-pouchdb attach presumes Math.uuid
    file = new File _id: uuid()
    console.log "new id #{file.id}"
    addView = new FileEditView {model: file, add: true}
    $('body').append addView.$el
    false

