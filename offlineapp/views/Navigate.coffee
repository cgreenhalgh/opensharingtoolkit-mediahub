ThingView = require 'views/Thing'
templateNavigate = require 'templates/Navigate'
location = require 'location'
LocationAlertWidgetView = require 'views/LocationAlertWidget'
NavStateWidgetView = require 'views/NavStateWidget'

module.exports = class NavigateView extends ThingView
  title: "Navigate"

  template: (d) =>
    templateNavigate d

  initialize: ->
    @navState = location.getNavState @model
    @navStateWidgetView = new NavStateWidgetView model: @navState
    @locationAlertWidgetView = new LocationAlertWidgetView model: location.getLocation()
    super()

  render: =>
    super()
    $('.nav-widget-holder', @$el).replaceWith @navStateWidgetView.el
    $('.location-alert-holder', @$el).replaceWith @locationAlertWidgetView.el 
    @

  remove: ->
    @navStateWidgetView.remove()
    @locationAlertWidgetView.remove()
    super()

