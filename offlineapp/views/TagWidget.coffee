# TagWidget
templateTagWidget = require 'templates/TagWidget'
tags = require 'tags'

module.exports = class TagWidgetView extends Backbone.View

  tagName: 'div'
  className: 'thing-in-list-button'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateTagWidget d
 
  render: =>
    @$el.html @template @model.attributes

  events: 
    "click": "onClick"

  onClick: (ev) =>
    ev.preventDefault()
    ev.stopPropagation()
    console.log "Click TagWidget..."
    tags.showTagDialog @model

