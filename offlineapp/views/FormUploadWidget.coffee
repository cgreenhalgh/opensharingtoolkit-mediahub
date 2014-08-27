# FormUpload state widget for use in top bar

templateFormUploadWidget = require 'templates/FormUploadWidget'

module.exports = class FormUploadWidgetView extends Backbone.View

  tagName: 'div'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateFormUploadWidget d

  render: =>
    #console.log "render FormUpload #{JSON.stringify @model.attributes}" 
    @$el.html @template @model.attributes
    @

  events: 
    "click": "showUpload"

  showUpload: (ev) =>
    ev.preventDefault()
    window.router.navigate "#upload", trigger:true

