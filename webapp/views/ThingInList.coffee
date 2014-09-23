# ThingInList View
templateThingInList = require 'templates/ThingInList'
thingDeleter = require 'thingDeleter'

module.exports = class ThingInListView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateThingInList d

  render: =>
    console.log "render ThingInList #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events: ->
    "click .do-view-file": "view"
    "click .do-edit-file": "edit"
    "click .do-copy-file": "copy"
    "click .do-delete-file": "delete"

  view: (ev) =>
    console.log "view #{@model.attributes._id}"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.getContentType().id}/view/#{encodeURIComponent @model.attributes._id}", trigger:true

  edit: (ev) =>
    console.log "edit #{@model.attributes._id}"
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.getContentType().id}/edit/#{encodeURIComponent @model.attributes._id}", trigger:true

  delete: (ev) =>
    thingDeleter.delete @model
    ev.preventDefault()
    false

  copy: (ev) =>
    console.log "copy #{@model.attributes._id}"
    ev.preventDefault()
    contentType = @model.getContentType()
    if contentType?
      attributes = JSON.parse (JSON.stringify @model.attributes)
      delete attributes._rev
      id = contentType.id+':'+uuid()
      attributes._id = id
      atts = @model.attachments()
      delete attributes._attachments
      # file attachment? _attachments; fileSize, fileType, hasFile
      #delete attributes.fileSize
      #delete attributes.fileType
      delete attributes.hasFile
      # convert to externalurl
      if not attributes.externalurl and atts.indexOf("bytes")>=0 
        #alert "Sorry, still working on copying files..."
        attributes.externalurl = "../../../../#{encodeURIComponent @model.id}/bytes"

      attributes.title = (attributes.title ? '') + ' (Copied '+new Date().toISOString()+')'
      contentType.getModel().addingThings[id] = attributes
      window.router.navigate "#ContentType/#{contentType.id}/add/#{encodeURIComponent id}", trigger:true
    else
      alert 'Sorry, something went wrong copying that item'
      console.log "Error: no ContentType for #{@model.attributes._id}: #{@mode.attributes.type}"

