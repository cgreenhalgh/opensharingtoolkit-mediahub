# FileSelect View
templateFileSelect = require 'templates/FileSelect'
getParams = require 'getParams'

module.exports = class FileSelectView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-in-list'

  initialize: ->
    config = window.mediahubconfig
    # NB relative URL
    @fileUrl = "../../../../#{encodeURIComponent( @model.id )}/bytes"
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFileSelect d

  render: =>
    console.log "render FileSelect #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template _.extend( {}, @model.attributes, {imageurl: @fileUrl} )
    @

  events:
    "click .do-select-file": "select"
    "click .do-preview-file": "preview"

  preview: (ev) =>
    console.log "preview #{@model.attributes._id}"
    ev.preventDefault()
    # TODO

  select: (ev) =>
    console.log "select #{@model.attributes._id}"
    ev.preventDefault()

    # see http://docs.ckeditor.com/#!/guide/dev_file_browser_api
    params = getParams()
    mediahubCallback = params[ 'mediahubCallback' ]
    funcNum = params[ 'CKEditorFuncNum' ]
    if mediahubCallback?
      console.log "- mediahubCallback #{mediahubCallback} fileUrl = #{@fileUrl}"
      try
        window.opener.mediahubCallbacks[mediahubCallback]( @fileUrl )
      catch err
        console.log "error calling mediahubCallback: #{err.message}"
      window.close()
    else if funcNum?
      console.log "- ckeditor fileUrl = #{@fileUrl}"
      window.opener.CKEDITOR.tools.callFunction( funcNum, @fileUrl )
      window.close()
    else
      alert "Error: could not find parameter CKEditorFuncNum or mediahubCallback"

