# Location (offline) View

templateLocation = require 'templates/Location'
location = require 'location'

module.exports = class UserView extends Backbone.View

  title: 'Location'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateLocation d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  events: 
    "change input": "onChange"
    "click input[name=refresh]": "refresh"

  onChange: (ev) =>
    console.log "Location settings changed"
    @model.set
      continuous: $('input[name=continuous]', @$el).prop 'checked'
      highAccuracy: $('input[name=highAccuracy]', @$el).prop 'checked'
      requestRecent: $('input[name=requestRecent]', @$el).prop 'checked'
      showOnMap: $('input[name=showOnMap]', @$el).prop 'checked'
      debug: $('input[name=debug]', @$el).prop 'checked'

  refresh: (ev) =>
    location.refresh()
