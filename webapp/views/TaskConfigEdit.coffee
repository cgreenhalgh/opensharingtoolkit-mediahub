# ThingEdit View
templateTaskConfigEdit = require 'templates/TaskConfigEdit'
templateTaskConfigEditSubject = require 'templates/TaskConfigEditSubject'
templateTaskConfigEditState = require 'templates/TaskConfigEditState'
allthings = require 'allthings'
taskstates = require 'taskstates'
server = require 'server'

module.exports = class TaskConfigEditView extends Backbone.View

  constructor:(options)->
    @add = options.add ?= false
    @things = options.things ?= null
    super(options)
      

  tagName: 'div'
  className: 'row thing-edit'
  cancelled: false

  initialize: =>
    super()
    if @add and not @model.attributes.taskType
      console.log "Block TaskConfig add without taskType (i.e. with addingThings data)"
      setTimeout @remove, 0
      alert "Sorry, there is not enough information to add a new task"
      return
    if @add and @things?
      # we might actually exist!
      if (thing=(@things.get @model.id))?
        console.log "Add TaskConfigEdit -> edit (already exists)"
        @addToEdit(thing)
        return
      console.log "Add TaskConfigEdit - listening in case exist"
      @listenTo @things,'add', @addThis
    else
      console.log "TaskConfigEdit - Edit or real add? add=#{@add}, things=#{@things}"

    @allthings = allthings.get()
    if @model.attributes.subjectId
      @subject = @allthings.get @model.attributes.subjectId
      if not @subject?
        console.log "Could not find subject #{@model.attributes.subjectId} on start-up; listening..."
        @listenTo @allthings, 'add', @addThing
      else
        console.log "taskconfig subject = #{@subject}"
    @taskstates = taskstates.get()
    ix = @model.id.indexOf ':'
    @taskstateid = 'taskstate:'+@model.id.substring(ix+1)
    @taskstate = @taskstates.get @taskstateid
    if not @taskstate?
      console.log "Could not find taskstate #{@taskstateid} on start-up; listening..."
      @listenTo @taskstates, 'add', @addState
    else
      console.log "taskconfig state = #{@taskstate}"
      @listenTo @taskstate, 'change', @renderState
    #@listenTo @model, 'change', @render
    #@render()

  addThis: (thing) =>
    if thing.id==@model.id
      console.log "Found self in add #{thing.id}"
      @addToEdit(thing)

  addToEdit: (thing) =>
    setTimeout @remove,0
    window.router.navigate "#ContentType/taskconfig/edit/#{encodeURIComponent @model.id}",
          {trigger:true, replace: true}
    if thing.attributes.taskType!=@model.attributes.taskType or thing.attributes.subjectId!=@model.attributes.subjectId
      alert "Sorry, that path is already assigned to this task"

  addThing: (thing) =>
    if not @subject? and thing.id==@model.attributes.subjectId
      console.log "Found subject #{thing.id}"
      @subject = thing
      $('.subject-holder', @$el).html templateTaskConfigEditSubject @subject.attributes
      @stopListening @allthings

  addState: (state) =>
    if not @taskstate? and state.id==@taskstateid
      console.log "Found state #{state.id}"
      @taskstate = state
      @stopListening @taskstates
      @listenTo @taskstate, 'change', @renderState
      @renderState()
    else
      console.log "Igore new state #{state.id} (@taskstatid=#{@taskstateid}, @taskstate=#{@taskstate})"

  renderState: () =>
    console.log "renderState #{@taskstate.id}"
    if @taskstate
      $('.state-holder', @$el).html @templateState @taskstate.attributes

  templateState: (d) =>
    templateTaskConfigEditState _.extend { lastChanged: @model.attributes.lastChanged }, d

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateTaskConfigEdit d

  render: =>
    console.log "render TaskConfigEdit #{@model.attributes._id}"
    subjectHtml = null
    if @subject?
      subjectHtml = templateTaskConfigEditSubject @subject.attributes
    stateHtml = null
    if @taskstate?
      stateHtml = @templateState @taskstate.attributes
    @$el.html @template _.extend { add: @add, subjectHtml: subjectHtml, stateHtml: stateHtml }, @model.attributes

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
    if @things
      @stopListening @things
    ev.preventDefault()
    @formToModel() 
    server.working 'save TaskConfigEdit'
    if false==@model.save null, {
        success: server.success
        error: server.error
      }
      server.error @model,'Save validation error (TaskConfigEdit)',{}
    if @add
      if @things
        @things.add @model
      allthings.get().add @model
      setTimeout ()=>
          window.router.navigate "#ContentType/taskconfig/edit/#{encodeURIComponent @model.id}",
            {trigger:true, replace: true}
        ,0
    else
      @render()
    #  window.router.navigate "#ContentType/taskconfig",
    #    {trigger:true, replace: true}
    # test...

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

