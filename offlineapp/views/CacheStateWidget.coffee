# CacheState general widget

templateCacheStateWidget = require 'templates/CacheStateWidget'

module.exports = class CacheStateWidget extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateCacheStateWidget d

  render: =>
    console.log "render CacheStateWidget #{@model.attributes}"
    @$el.html @template @model.attributes
    @

  events:
    'click .updateReady': "doUpdate"

  doUpdate: (ev) =>
    console.log "Update!"
    ev.preventDefault()
    # NB default is from cache
    location.reload()
    false


