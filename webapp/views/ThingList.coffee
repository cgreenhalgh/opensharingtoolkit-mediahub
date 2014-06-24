# ThingList View
templateThingList = require 'templates/ThingList'

module.exports = class ThingListView extends Backbone.View

  tagName: 'div'
  className: 'row thing-list top-level-view'

  initialize: ->
    @views = []
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem

  template: (d) =>
    templateThingList d

  render: =>
    console.log "render ThingList, contentType=#{@model.model.contentType.id}"
    @$el.html @template contentType: @model.model.contentType.attributes
    @model.forEach @addItem
    @

  addItem: (thing) =>
    console.log "ThingListView add #{thing.id}"
    view = @model.model.contentType.getThingView thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  removeItem: (thing) =>
    console.log "ThingListView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  remove: () =>
    for view in @views
      view.remove()
    super()

  events:
    "click .do-add-thing": "addThing"

  addThing: (ev) =>
    console.log "addThing"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.model.contentType.id}/add", trigger:true

