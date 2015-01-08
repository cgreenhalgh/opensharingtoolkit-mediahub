# Settings (offline) View

templateSettings = require 'templates/Settings'
locked = require 'locked'

module.exports = class SettingsView extends Backbone.View

  title: 'Enter Code'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateSettings d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  events: 
    'submit': 'onSubmit' 

  onSubmit: (ev) =>
    clearUnlock = $('input[name=clear_unlock]', @$el).prop('checked')
    console.log "Clear unlock? #{clearUnlock}"
    ev.preventDefault()
    if clearUnlock
      locked.clear()
      @model.set 'message',"Done"

