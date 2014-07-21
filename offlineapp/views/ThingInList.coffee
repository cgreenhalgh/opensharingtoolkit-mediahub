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
      iconurl = @model.attributes.imageurl
    if not iconurl? or iconurl==''
      if @model.attributes.type?
        iconurl = "../../icons/#{@model.attributes.type}.png"
    @$el.html @template _.extend {}, @model.attributes, { iconurl: iconurl } 
    @

  events:
    "click": "view"

  view: (ev) =>
    console.log "view #{@model.attributes._id}"
    ev.preventDefault()
    id = @model.id
    ix = id.indexOf ':'
    type = if ix>0 then id.substring 0,ix else 'unknown'
    window.router.navigate "#thing/#{encodeURIComponent @model.id}", trigger:true

