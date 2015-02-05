# Nearby (offline) View

templateNearby = require 'templates/Nearby'
location = require 'location'
PlaceListView = require 'views/PlaceList'
LocationAlertWidgetView = require 'views/LocationAlertWidget'

module.exports = class NearbyView extends Backbone.View

  title: 'Nearby'

  initialize: ->
    # model is location.getLocation
    @listenTo @model, 'change', @render
    @locationAlertWidgetView = new LocationAlertWidgetView model: @model
    @render()

  template: (d) =>
    templateNearby d

  render: =>
    @$el.html @template @model.attributes
    $('.location-alert-holder', @$el).replaceWith @locationAlertWidgetView.el 
    if @model.attributes.places? and not @listView?
      @listView = new PlaceListView model: @model.attributes.places
      @listView.render()
    if @listView?
      $('.list-holder', @$el).replaceWith @listView.el 
    @

  remove: =>
    @locationAlertWidgetView.remove()
    if @listView
      @listView.remove()
    super()

