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
    @model.forEach @addItem
    @

  addItem: (thing) =>
    console.log "ThingListView add #{thing.id}"
    for view,i in @views when view.model.id == thing.id
      return console.log "skip addItem for known #{thing.id}"
    view = new ThingInListView model: thing
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
    
  reset: () =>
    for view in @views
      view.remove()
    @views = []

  remove: () =>
    for view in @views
      view.remove()
    super()

