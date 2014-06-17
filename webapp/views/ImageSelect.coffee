# ImageSelect View
templateImageSelect = require 'templates/ImageSelect'
getParams = require 'getParams'

module.exports = class ImageSelectView extends Backbone.View

  tagName: 'div'
  className: 'columns image-select'

  initialize: ->
    config = window.mediahubconfig
    @fileUrl = config.dburl+'/'+encodeURIComponent( @model.id )+'/bytes'
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateImageSelect d

  render: =>
    console.log "render ImageSelect #{@model.attributes._id}: #{ @model.attributes.title }"
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
    funcNum = getParams()[ 'CKEditorFuncNum' ]
    if not funcNum?
      alert "Error: could not find parameter CKEditorFuncNum"
    else
      console.log "- fileUrl = #{@fileUrl}"
      window.opener.CKEDITOR.tools.callFunction( funcNum, @fileUrl )
      window.close()
