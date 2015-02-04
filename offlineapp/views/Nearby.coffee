# Nearby (offline) View

templateNearby = require 'templates/Nearby'
location = require 'location'
PlaceListView = require 'views/PlaceList'

module.exports = class NearbyView extends Backbone.View

  title: 'Nearby'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateNearby d

  render: =>
    @$el.html @template @model.attributes
    if @listView?
      @listView.render()
    else if @model.attributes.places?
      @listView = new PlaceListView model: @model.attributes.places
      @listView.render()
      @$el.append @listView.el
    else
      console.log "error: render ListView without @things (thingsIds=#{@model.attributes.thingIds})"
    @

  remove: =>
    if @listView
      @listView.remove()
    super()

