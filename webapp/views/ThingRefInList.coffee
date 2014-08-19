# ThingRefInList View
templateThingRefInList = require 'templates/ThingRefInList'

module.exports = class ThingRefInListView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    id = @model.attributes.thingId
    ix = id.indexOf ':'
    typeName = if ix>0 then id.substring(0,ix) else 'unknown' 
    templateThingRefInList _.extend { typeName: typeName }, d

  render: =>
    console.log "render ThingRefInList #{@model.attributes._id}: #{ @model.attributes.thingId }"
    @$el.html @template @model.attributes
    @

  events:
    "click .do-preview-thing": "preview"
    "click .do-remove-thingref": "removeFromList"

  preview: (ev) =>
    console.log "preview #{@model.attributes._id}"
    ev.preventDefault()
    # TODO

  removeFromList: (ev) =>
    ev.preventDefault()
    # TODO
    console.log "remove #{@model.attributes._id}"
    # thingrefs are not server-backed
    @model.destroy()

