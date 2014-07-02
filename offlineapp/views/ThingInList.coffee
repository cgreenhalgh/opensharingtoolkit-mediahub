# ThingInList View
templateThingInList = require 'templates/ThingInList'

module.exports = class ThingInListView extends Backbone.View

  tagName: 'div'
  className: 'thing-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateThingInList d

  render: =>
    console.log "render ThingInList #{@model.attributes._id}: #{ @model.attributes.title }"
    iconurl = @model.attributes.iconurl
    if not iconurl? or iconurl==''
      iconurl = @model.attributes.coverurl
    if not iconurl? or iconurl==''
      # defaults
      ix = @model.id.indexOf ':'
      if ix>0
        iconurl = "../../icons/#{@model.id.substring 0, ix}.png"
    @$el.html @template _.extend { iconurl: iconurl }, @model.attributes
    @

  events:
    "click": "view"

  view: (ev) =>
    console.log "view #{@model.attributes._id}"
    ev.preventDefault()
    id = @model.id
    ix = id.indexOf ':'
    type = if ix>0 then id.substring 0,ix else 'unknown'
    window.router.navigate "##{type}/#{encodeURIComponent @model.id}", trigger:true

