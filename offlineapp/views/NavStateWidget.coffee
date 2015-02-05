# NavStateWidget View
templateNavStateWidget = require 'templates/NavStateWidget'

module.exports = class NavStateWidgetView extends Backbone.View

  tagName: 'div'
  className: 'nav-state-widget'

  initialize: =>
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateNavStateWidget d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  events: 
    "click": "onClick"

  onClick: (ev) =>
    ev.preventDefault()
    ev.stopPropagation()
    console.log "Click NavStateWidget #{@model.id}..."
    window.router.navigate "#navigate/#{encodeURIComponent @model.id}", trigger:true

