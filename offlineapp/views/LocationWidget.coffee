# Location state widget for use in top bar

templateLocationWidget = require 'templates/LocationWidget'
location = require 'location'

module.exports = class LocationWidgetView extends Backbone.View

  tagName: 'div'
  className: 'topbar-widget'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateLocationWidget d

  render: =>
    #console.log "render Location #{JSON.stringify @model.attributes}" 
    @$el.html @template @model.attributes
    @$el.toggleClass 'hide', not @model.attributes.showLocation
    @

  events: 
    "click": "showLocation"

  showLocation: (ev) =>
    ev.preventDefault()
    location.touchWidget()

