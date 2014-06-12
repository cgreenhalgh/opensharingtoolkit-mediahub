# ThingList View
templateThingList = require 'templates/ThingList'

module.exports = class ThingListView extends Backbone.View

  tagName: 'div'
  className: 'row thing-list top-level-view'

  initialize: ->
    @listenTo @model, 'add', @add
    @listenTo @model, 'remove', @remove

  template: (d) =>
    templateThingList d

  render: =>
    console.log "render ThingList, contentType=#{@model.model.contentType.id}"
    @$el.html @template contentType: @model.model.contentType.attributes
    views = []
    @model.forEach @add
    @

  views: []

  add: (thing) =>
    console.log "ThingListView add #{thing.id}"
    view = @model.model.contentType.getThingView thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  remove: (thing) =>
    console.log "ThingListView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  events:
    "click .do-add-thing": "addThing"

  addThing: (ev) =>
    console.log "addThing"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.model.contentType.id}/add", trigger:true

