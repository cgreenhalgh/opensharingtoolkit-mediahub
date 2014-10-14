# ThingList View
ThingInListView = require 'views/ThingInList'

module.exports = class ThingListView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @views = []
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem
    @listenTo @model, 'reset', @reset
    @render()

  render: =>
    @reset()
    @model.forEach (thing) => @addItem thing, @model
    @

  addItem: (thing, coll, options) =>
    console.log "ThingListView add #{thing.id}"
    for view,i in @views when view.model.id == thing.id
      return console.log "skip addItem for known #{thing.id}"
    view = new ThingInListView model: thing
    ix = coll.indexOf thing
    if ix>=0 and ix<@$el.children().length and ix<@views.length
      @$el.children().eq(ix).before view.el
      @views.splice ix,0,view
    else
      @$el.append view.el
      @views.push view
    
  removeItem: (thing, coll, options) =>
    console.log "ThingListView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  reset: () =>
    for view in @views
      view.remove()
    @views = []

  remove: () =>
    for view in @views
      view.remove()
    super()

