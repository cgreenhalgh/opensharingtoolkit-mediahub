# FileInList View
templateFileInList = require 'templates/FileInList'
FileEditView = require 'views/FileEdit'
fileDeleter = require 'fileDeleter'

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
