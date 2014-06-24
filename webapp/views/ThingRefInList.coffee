# ThingRefInList View
templateThingRefInList = require 'templates/ThingRefInList'

module.exports = class ThingRefInListView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-ref-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateThingRefInList d

  render: =>
    console.log "render ThingRefInList #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events:
    "click .do-preview-thing": "preview"
    "click .do-remove-thingref": "removeFromList"
    "click .do-add-below": "addBelow"
    "click .do-move-below": "moveBelow"

  preview: (ev) =>
    console.log "preview #{@model.attributes._id}"
    ev.preventDefault()
    # TODO

  removeFromList: (ev) =>
    ev.preventDefault()
    # TODO

  addBelow: (ev) =>
    ev.preventDefault()
    # TODO

  moveBelow: (ev) =>
    ev.preventDefault()
    # TODO

