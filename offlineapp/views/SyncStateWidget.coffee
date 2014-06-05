# SyncState general widget

templateSyncStateWidget = require 'templates/SyncStateWidget'

module.exports = class SyncStateWidget extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateSyncStateWidget d

  render: =>
    console.log "render SyncStateWidget #{@model.attributes}"
    @$el.html @template @model.attributes
    @

  events:
    'click .doSync': "doSync"

  doSync: (ev) =>
    if not @model.attributes.idle
      return false
    console.log "Sync!"
    ev.preventDefault()
    @model.set 
      idle:false
      message:'Attempting to synchronize... (not really)' 
    # ...
    false


