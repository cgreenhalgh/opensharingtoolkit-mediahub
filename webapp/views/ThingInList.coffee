# ThingInList View
templateThingInList = require 'templates/ThingInList'
thingDeleter = require 'thingDeleter'

module.exports = class ThingInListView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateThingInList d

  render: =>
    console.log "render ThingInList #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events: ->
    "click .do-view-file": "view"
    "click .do-edit-file": "edit"
    "click .do-delete-file": "delete"

  view: (ev) =>
    console.log "view #{@model.attributes._id}"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.getContentType().id}/view/#{encodeURIComponent @model.attributes._id}", trigger:true

  edit: (ev) =>
    console.log "edit #{@model.attributes._id}"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.getContentType().id}/edit/#{encodeURIComponent @model.attributes._id}", trigger:true

  delete: (ev) =>
    thingDeleter.delete @model
    ev.preventDefault()
    false


