# ThingInMultiselect View
templateThingInMultiselect = require 'templates/ThingInMultiselect'

module.exports = class ThingInMultiselectView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-in-list'

  initialize: ->
    #@listenTo @model, 'change', @render

  # syntax ok?? or (x...) -> 
  template: (d) =>
    id = @model.id
    ix = id.indexOf ':'
    typeName = if ix>0 then id.substring(0,ix) else 'unknown' 
    templateThingInMultiselect _.extend { typeName: typeName }, d

  render: =>
    console.log "render ThingInMultiselectView #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events:
    "click .do-preview-thing": "preview"

  preview: (ev) =>
    console.log "preview #{@model.attributes._id}"
    ev.preventDefault()
    # TODO

