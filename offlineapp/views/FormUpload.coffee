# Home (offline) View

templateFormUpload = require 'templates/FormUpload'
FormUploadWidgetView = require 'views/FormUploadWidget'
formdb = require 'formdb'

module.exports = class FormUploadView extends Backbone.View

  tagName: 'div'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateFormUpload d

  render: =>
    #console.log "render FormUploadView #{JSON.stringify @model.attributes}"
    @$el.html @template @model.attributes
    @

  remove: () =>
    super()

  events:
    "click input[name=do-upload]": "doUpload"

  doUpload: (ev) =>
    console.log "doUpload"
    ev.preventDefault()
    formdb.startUpload()

