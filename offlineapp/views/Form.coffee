# Form (offline) View
templateForm = require 'templates/Form'
formdb = require 'formdb'
working = require 'working'
FormInstanceView = require 'views/FormInstance'
ThingView = require 'views/Thing'

# TODO find/use formdata from formdb

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
        @setInstance @instances.at @instances.length-1
      else if @model.attributes.cardinality!='*'
        @newInstance()
    super()

  template: (d) =>
    templateForm d

  render: () =>
    console.log "render Form"
    super()

  events: () ->
      "click .form-newinstance": "newInstance"

  setInstance: (instance) => 
    console.log "Form #{@model.id} setInstance #{instance.id}"
    if @instanceView
      @stopListening @instanceView
      @instanceView.remove()
    @instanceView = new FormInstanceView model: instance
    @listenTo instance, 'destroy', @instanceDestroyed
    $('.form-instance-holder', @$el).append @instanceView.el
    if not instance.metadata?.saved or not instance.metadata?.finalized or @instanceView.changed
      $('.form-newinstance', @$el).prop 'disabled', true

  newInstance: (ev) =>
    if ev
      ev.preventDefault()
    console.log "Form #{@model.id} newInstance"
    instance = formdb.getNewFormInstance @model
    @setInstance instance

  instanceDestroyed: () =>
    console.log "instanceDestroyed"
    @instanceView = null

  remove: () =>
    if @instanceView
      @instanceView.remove()    
    super()

  back: =>
    console.log "back"
    window.history.back()


