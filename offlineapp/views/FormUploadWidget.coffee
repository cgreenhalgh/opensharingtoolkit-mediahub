# FormUpload state widget for use in top bar

templateFormUploadWidget = require 'templates/FormUploadWidget'

module.exports = class FormUploadWidgetView extends Backbone.View

  tagName: 'div'
  className: 'topbar-widget'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateFormUploadWidget d

  render: =>
    console.log "render FormUploadWidget #{JSON.stringify @model.attributes}" 
    @$el.html @template @model.attributes
    $(@$el).toggleClass 'hide', not @model.attributes.serverId
    @

  events: 
    "click": "showUpload"

  showUpload: (ev) =>
    ev.preventDefault()
    window.router.navigate "#upload", trigger:true

