# Home (offline) View

templateUser = require 'templates/User'

module.exports = class UserView extends Backbone.View

  title: 'User'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateUser d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  events: () ->
    "click input[name=_save]": "doSave"
    "click input[name=_reset]": "doReset"
    "change input": "onChange"
    "paste input": "onChange"
    "keyup input": "onChange"

  onChange: (ev) =>
    $('input[name=_save]', @$el).prop 'disabled', false
    $('input[name=_reset]', @$el).prop 'disabled', false

  doReset: (ev) =>
    ev.preventDefault()
    @render()

  doSave: (ev) =>
    ev.preventDefault()
    username = $('input[name=username]').val()
    console.log "Save user #{username}"
    @model.set username: username

