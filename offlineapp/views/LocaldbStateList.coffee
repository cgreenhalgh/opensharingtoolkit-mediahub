# LocaldbState View
LocaldbState = require 'models/LocaldbState'
LocaldbStateInListView = require 'views/LocaldbStateInList'
#templateLocaldbStateList = require 'templates/LocaldbStateList'

module.exports = class LocaldbStateListView extends Backbone.View

  tagName: 'div'
  className: 'localdb-state-list row'

  initialize: ->
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem

  template: (d) =>
    #templateLocaldbStateList d

  render: =>
    #@$el.html @template @model.attributes
    views = []
    @model.forEach @addItem
    @

  views: []

  addItem: (file) =>
    console.log "LocaldbStateListView add #{file.attributes._id}"
    view = new LocaldbStateInListView model: file
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  removeItem: (file) =>
    console.log "LocaldbStateListView remove #{file.attributes._id}"
    for view, i in @views when view.model.id == file.id
      console.log "remove view" 
      view.remove()
      @views.splice i,1
      return
    
