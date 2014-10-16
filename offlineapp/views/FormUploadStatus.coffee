# FormUpload state widget for use in top bar

templateFormUploadStatus = require 'templates/FormUploadStatus'
formdb = require 'formdb'

module.exports = class FormUploadStatusView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateFormUploadStatus d

  render: =>
    #console.log "render FormUploadWidget #{JSON.stringify @model.attributes}" 
    username = (require 'user').getUserId()
    @$el.html @template _.extend { meta: { userID: username } }, @model.attributes
    @

  events:
    "click .do-send": "doUpload"

  doUpload: (ev) =>
    ev.preventDefault()
    sendTags = formdb.getFormUploadState().attributes?.sendTags
    console.log "doUpload sendTags=#{sendTags}"
    formdb.startUpload sendTags

