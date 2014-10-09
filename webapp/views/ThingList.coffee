# ThingList View
templateThingList = require 'templates/ThingList'
FilterWidgetView = require 'views/FilterWidget'
filter = require 'filter'

module.exports = class ThingListView extends Backbone.View

  tagName: 'div'
  className: 'row thing-list top-level-view'

  initialize: ->
    @views = []
    @fmodel = filter.newFilterCollection @model
    @listenTo @fmodel, 'add', @addItem
    @listenTo @fmodel, 'remove', @removeItem
    @listenTo @fmodel, 'reset', @reset

  template: (d) =>
    templateThingList d

  render: =>
    console.log "render ThingList, contentType=#{@model.model.contentType.id}"
    @$el.html @template contentType: @model.model.contentType.attributes
    if @filterView?
      @filterView.remove()
    @filterView = new FilterWidgetView model: filter.getModel()
    $('.filter-widget-holder', @$el).replaceWith @filterView.el
    @fmodel.forEach @addItem
    @

  reset: () =>
    for view in @views
      view.remove()
    @views = []
    @fmodel.forEach @addItem    

  getNewView: (thing) =>
    view = @model.model.contentType.getThingView thing

  addItem: (thing, coll, options) =>
    index = @fmodel.indexOf thing
    console.log "ThingListView add #{thing.id} options #{JSON.stringify options} index #{index}"
    view = @getNewView thing
    if index==0
      $('.list-holder', @$el).prepend view.$el
    else if index < $('.list-holder', @$el).children().length
      $('.list-holder', @$el).children().eq(index-1).after view.$el
    else
      if index<0
        console.log "add thing - not found in collection"
      $('.list-holder', @$el).append view.$el
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
    if @filterView?
      @filterView.remove()
    @fmodel.stopListening()
    super()

  events:
    "click .do-add-thing": "addThing"

  addThing: (ev) =>
    console.log "addThing"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.model.contentType.id}/add", trigger:true

