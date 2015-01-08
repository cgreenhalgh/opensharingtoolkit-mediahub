# UnlockNumber (offline) View

templateUnlockNumber = require 'templates/UnlockNumber'
locked = require 'locked'

module.exports = class UnlockNumberView extends Backbone.View

  title: 'Enter Code'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateUnlockNumber d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  events: 
    'submit': 'onSubmit' 

  onSubmit: (ev) =>
    code = $('input[name=unlock_number]', @$el).val()
    console.log "UnlockNumber #{code}"
    ev.preventDefault()
    $('input[name=unlock_number]', @$el).val('')
    if code?
      window.router.navigate "#unlock/number/#{encodeURIComponent code}", trigger:true

