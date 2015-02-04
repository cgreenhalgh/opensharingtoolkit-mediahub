# Settings (offline) View

templateSettings = require 'templates/Settings'
locked = require 'locked'
LocationSettingsView = require 'views/LocationSettings'
location = require 'location'

module.exports = class SettingsView extends Backbone.View

  title: 'Settings'

  initialize: ->
    @listenTo @model, 'change', @update
    @render()

  template: (d) =>
    templateSettings d

  render: =>
    @$el.append "<div></div>"
    @update()
    @locationView = new LocationSettingsView model: location.getLocation()
    @$el.append @locationView.el
    @

  update: =>
    @$el.children('div:first').html @template _.extend {}, @model.attributes 
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

  remove: =>
    if @locationView?
      @locationView.remove()
      @locationView = null

