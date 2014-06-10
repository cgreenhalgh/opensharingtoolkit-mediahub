# FileInList View
templateFileInList = require 'templates/FileInList'
FileEditView = require 'views/FileEdit'
fileDeleter = require 'fileDeleter'
offline = require 'offline'

module.exports = class FileInListView extends Backbone.View

  tagName: 'div'
  className: 'file-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFileInList d

  render: =>
    console.log "render FileInList #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events:
    "click .do-edit-file": "edit"
    "click .do-delete-file": "delete"
    "click .do-save": "save"
    "click .do-testapp": "testapp"

  edit: (ev) =>
    console.log "edit #{@model.attributes._id}"
    ev.preventDefault()
    $('.file-list').hide()
    editView = new FileEditView model: @model
    $('body').append editView.$el
    false

  delete: (ev) =>
    fileDeleter.delete @model
    ev.preventDefault()
    false

  save: (ev) =>
    @model.download ev

  testapp: (ev) =>
    ev.preventDefault()
    # offline test...
    offline.testFile @model

