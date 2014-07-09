# ThingEdit View
templateTaskConfigEdit = require 'templates/TaskConfigEdit'
allthings = require 'allthings'

module.exports = class TaskConfigEditView extends Backbone.View

  constructor:(options)->
    super(options)
    @add = options.add ?= false
    @things = options.things ?= null

  tagName: 'div'
  className: 'row thing-edit'
  cancelled: false

  initialize: ->
    @allthings = allthings.get()
    @listenTo @allthings, 'add', @addThing
    if @model.attributes.subjectId
      @subject = allthings.get().get @model.attributes.subjectId
      if not @subject?
        console.log "Could not find subject #{@model.attributes.subjectId}"
      else
        console.log "taskconfig subject = #{@subject}"
    #@listenTo @model, 'change', @render
    #@render()

  addThing: (thing) =>
    if not @subject? and thing.id==@model.attributes.subjectId
      console.log "Found subject #{thing.id}"
      @subject = thing
      @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateTaskConfigEdit d

  render: =>
    console.log "render TaskConfigEdit #{@model.attributes._id}"
    @$el.html @template _.extend { add: @add, subject: if @subject? then @subject.attributes else {} }, @model.attributes

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"

  formToModel: () =>
    enabled = $('input[name=enabled]').prop 'checked'
    time = new Date().getTime()
    @model.set 
      enabled: enabled
      lastChanged: time

  submit: (ev)=>
    console.log "submit..."
    ev.preventDefault()
    @formToModel()    
    @model.save()
    @close()

  cancel: =>
    console.log "cancel"
    @cancelled = true
    if @model.id? and @things?
      console.log "try remove on cancel for #{@model.id}"
      #@things.remove @model
    @close()

  close: =>
    #@remove()
    window.history.back()

  remove: () =>
    super()

