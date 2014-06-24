# ThingRefList View
templateThingRefList = require 'templates/ThingRefList'
ThingRefInListView = require 'views/ThingRefInList'
ThingMultiselectModalView = require 'views/ThingMultiselectModal'
ThingList = require 'models/ThingList'

module.exports = class ThingRefListView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem

  template: (d) =>
    templateThingRefList d

  render: =>
    console.log "render ThingRefList"
    @$el.html @template {}
    views = []
    @model.forEach @addItem
    @

  views: []

  remove: () =>
    for view in @views
      view.remove()
    super()


  addItem: (thing) =>
    console.log "ThingRefListView add #{thing.id}"
    view = new ThingRefInListView thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  removeItem: (thing) =>
    console.log "ThingRefListView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  events:
    "click .do-remove-thingrefs": "removeSelected"
    "click .do-add-below": "addBelow"
    "click .do-move-below": "moveBelow"

  removeSelected: (ev) =>
    ev.preventDefault()
    # TODO

  addBelow: (ev) =>
    ev.preventDefault()
    console.log "addBelow..."
    # TODO
    if not @multiseletModal?
      thingList = new ThingList()
      @multiselectModal = new ThingMultiselectModalView model: thingList
      @multiselectModal.render()
      @$el.append @multiselectModal.el
      # no change while visible!
      thingList.fetch()
    @multiselectModal.show()

  moveBelow: (ev) =>
    ev.preventDefault()
    # TODO

