# UnlockText (offline) View

templateUnlockText = require 'templates/UnlockText'
artcode = require 'artcode'

module.exports = class UnlockTextView extends Backbone.View

  title: 'Enter Code'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateUnlockText d

  render: =>
    data = _.extend {}, @model.attributes
    if data.type=='artcode'
      data.artcodeDataUrl = artcode.getExperienceDataUrl()
    @$el.html @template  data
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

