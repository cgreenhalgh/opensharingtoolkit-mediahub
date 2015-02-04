# PlaceInList view

ThingInListView = require 'views/ThingInList'
templatePlaceInList = require 'templates/PlaceInList'
NavStateWidgetView = require 'views/NavStateWidget'
location = require 'location'

module.exports = class PlaceInListView extends ThingInListView

  initialize: =>
    @navState = location.getNavState @model
    @navStateWidgetView = new NavStateWidgetView model: @navState
    super()

  template: (d) =>
    templatePlaceInList d

  render: =>
    super()
    $('.nav-widget-holder', @$el).replaceWith @navStateWidgetView.el

  remove: =>
    @navStateWidgetView.remove()
    super()

