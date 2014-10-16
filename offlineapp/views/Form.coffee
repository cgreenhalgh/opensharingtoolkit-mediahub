# Form (offline) View
templateForm = require 'templates/Form'
formdb = require 'formdb'
working = require 'working'
FormInstanceView = require 'views/FormInstance'
FormUploadStatusView = require 'views/FormUploadStatus'
ThingView = require 'views/Thing'

module.exports = class FormView extends ThingView

  initialize: ->
    @deleting = false
    # instances of this form?
    working.working 'get form instances'
    @instances = formdb.getInstancesForForm @model, () =>
      console.log "getInstancesForForm done with #{@instances.length} instances"
      working.done()
      #@render()
      if @instances.length>0
        # last should be newest
        instance = @instances.at @instances.length-1
        if @model.attributes.cardinality=='*' && instance.attributes.metadata.finalized
          @newInstance()
        else
          @setInstance instance
      else 
        @newInstance()
    super()

  template: (d) =>
    templateForm d

  render: () =>
    console.log "render Form"
    @$el.html @template @model.attributes
    if not @uploadStatus?
      @uploadStatus = new FormUploadStatusView model: formdb.getFormUploadState()
    $('.form-upload-status-holder', @$el).replaceWith @uploadStatus.el

  events: () ->
      "click .form-newinstance": "newInstance"

  setInstance: (instance) => 
    console.log "Form #{@model.id} setInstance #{instance.id}"
    if @instanceView
      @stopListening @instanceView.model
      @instanceView.remove()
    @instanceView = new FormInstanceView model: instance
    @listenTo instance, 'destroy', @instanceDestroyed
    if @model.attributes.cardinality=='*'
      @listenTo instance, 'change:metadata', @instanceMetadataChanged
    $('.form-instance-holder', @$el).append @instanceView.el
    if not instance.attributes.metadata?.saved or not instance.attributes.metadata?.finalized or @instanceView.changed
      $('.form-newinstance', @$el).prop 'disabled', true
    else
      $('.form-newinstance', @$el).prop 'disabled', false

  newInstance: (ev) =>
    if ev
      ev.preventDefault()
    console.log "Form #{@model.id} newInstance"
    instance = formdb.getNewFormInstance @model
    @setInstance instance
    if @instances
      @instances.add instance

  instanceDestroyed: () =>
    console.log "instanceDestroyed"
    @instanceView = null

  instanceMetadataChanged: (model, metadata) =>
    console.log "instanceChanged, finalized=#{metadata?.finalized}"
    if @model.attributes.cardinality=='*' && metadata.finalized
      console.log "*-ary form instance finalized -> new instance"
      @newInstance()

  remove: () =>
    if @instanceView
      @instanceView.remove()    
    if @instances
      formdb.releaseFormInstances @instances
    if @uploadStatus?
      @uploadStatus.remove()    
    super()

  back: =>
    console.log "back"
    window.history.back()


