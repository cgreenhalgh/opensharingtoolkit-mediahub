# ThingInList View
templateThingInList = require 'templates/ThingInList'
TagListWidgetView = require 'views/TagListWidget'
tags = require 'tags'
locked = require 'locked'

module.exports = class ThingInListView extends Backbone.View

  tagName: 'div'
  className: 'thing-in-list'

  initialize: ->
    @unlockState = locked.getUnlockState @model
    @listenTo @model, 'change', @render
    @listenTo @unlockState, 'change', @render
    @tagsView = new TagListWidgetView model: tags.getTagsForSubject @model.id
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
        iconurl = window.geticonurl "#{@model.attributes.type}.png"
    @$el.html @template _.extend {}, @model.attributes, { iconurl: iconurl, unlocked: @unlockState.attributes.unlocked } 
    $('.tag-widget-holder', @$el).replaceWith @tagsView.el
    @

  events:
    "click": "view"

  view: (ev) =>
    console.log "view #{@model.attributes._id}"
    ev.preventDefault()
    if @model.attributes.locked? and @model.attributes.locked!=0 and !@unlockState.attributes.unlocked
      console.log "Item #{@model.attributes._id} is locked"
      locked.showLockedAlert(@model)
      return
    id = @model.id
    ix = id.indexOf ':'
    type = if ix>0 then id.substring 0,ix else 'unknown'
    window.router.navigate "#thing/#{encodeURIComponent @model.id}", trigger:true

  remove: () =>
    @tagsView.remove()
    super()

