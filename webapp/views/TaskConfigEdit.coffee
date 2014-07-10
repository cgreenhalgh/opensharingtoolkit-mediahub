# ThingEdit View
templateTaskConfigEdit = require 'templates/TaskConfigEdit'
templateTaskConfigEditSubject = require 'templates/TaskConfigEditSubject'
templateTaskConfigEditState = require 'templates/TaskConfigEditState'
allthings = require 'allthings'
taskstates = require 'taskstates'

module.exports = class TaskConfigEditView extends Backbone.View

  constructor:(options)->
    @add = options.add ?= false
    @things = options.things ?= null
    super(options)
      

  tagName: 'div'
  className: 'row thing-edit'
  cancelled: false

  initialize: =>
    if @add and @things?
      # we might actually exist!
      if (@things.get @model.id)?
        console.log "Add TaskConfigEdit -> edit (already exists)"
        window.router.navigate "#ContentType/taskconfig/edit/#{encodeURIComponent @model.id}",
          {trigger:true, replace: true}
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
    #@listenTo @model, 'change', @render
    #@render()

  addThis: (thing) =>
    if thing.id==@model.id
      console.log "Found self in add #{thing.id}"
      window.router.navigate "#ContentType/taskconfig/edit/#{encodeURIComponent @model.id}",
          {trigger:true, replace: true}

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

  renderState: () =>
    console.log "renderState #{@taskstate.id}"
    if @taskstate
      $('.state-holder', @$el).html templateTaskConfigEditState @taskstate.attributes

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
      stateHtml = templateTaskConfigEditState @taskstate.attributes
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
    @model.save()
    if @add
      #window.router.navigate "#ContentType/taskconfig",
      #    {trigger:true, replace: true}
      # test...
      window.router.navigate "#ContentType/taskconfig/edit/#{encodeURIComponent @model.id}",
          {trigger:true, replace: true}

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

