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
    if @formUploadWidgetView
      @formUploadWidgetView.remove()
    #console.log "render FormUploadView #{JSON.stringify @model.attributes}"
    @$el.html @template @model.attributes
    f = () =>
      @formUploadWidgetView = new FormUploadWidgetView model: formdb.getFormUploadState()
      $('section.top-bar-section > ul.right', @$el).append @formUploadWidgetView.el
      # topbar fix
      $(document).foundation()
    setTimeout f, 0
    @

  remove: () =>
    if @formUploadWidgetView
      @formUploadWidgetView.remove()
    super()

  events:
    "click input[name=do-upload]": "doUpload"

  doUpload: (ev) =>
    console.log "doUpload"
    ev.preventDefault()
    formdb.startUpload()

