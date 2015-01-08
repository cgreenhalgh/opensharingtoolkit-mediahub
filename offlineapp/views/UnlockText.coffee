# UnlockText (offline) View

templateUnlockText = require 'templates/UnlockText'

module.exports = class UnlockTextView extends Backbone.View

  title: 'Enter Code'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateUnlockText d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  events: 
    'submit': 'onSubmit' 

  onSubmit: (ev) =>
    code = $('input[name=unlock_code]', @$el).val()
    console.log "UnlockCode #{code}"
    ev.preventDefault()
    $('input[name=unlock_code]', @$el).val('')
    if code?
      window.router.navigate "#unlock/#{@model.attributes.type}/#{encodeURIComponent code}", trigger:true

