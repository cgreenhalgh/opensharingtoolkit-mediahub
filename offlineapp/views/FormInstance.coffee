# FormInstance (offline) View
templateFormInstance = require 'templates/FormInstance'
formdb = require 'formdb'

module.exports = class FormInstanceView extends Backbone.View

  tagName: 'div'

  initialize: ->
    #@listenTo @model, 'change', @render
    @listenTo @model, 'change:metadata', (() => @setChanged(@changed))
    @changed = @model.attributes.draftdata? 
    @render()

  template: (d) =>
    templateFormInstance d
 
  render: =>
    console.log "metadata.finalized = #{@model.attributes.metadata.finalized}, draftdata._finalized = #{@model.attributes.draftdata?._finalized}"
    # eco templating adds escape ?!
    @$el.html @template _.extend {}, @model.attributes 
    @setChanged @changed 
    @

  remove: () =>
    data = @formToData()
    console.log "remove FormInstanceView for #{@model.id} changed = #{@changed}, data = #{data}"
    if @changed 
      @model.set draftdata: data
      @saveToDb()
    super()

  events: () ->
      "click input[name=_save]": "doSave"
      "click input[name=_save_finalized]": "doSaveFinalized"
      "click input[name=_send]": "doSend"
      "click input[name=_reset]": "doReset"
      "click input[name=_delete]": "doDelete"
      "change input": "onChange"
      "paste input": "onChange"
      "keyup input": "onChange"
      "change textarea": "onChange"
      "paste textarea": "onChange"
      "keyup textarea": "onChange"
      "change select": "onChange"

  onChange: (ev) =>
    if not @changed
      @setChanged true

  setChanged: (changed) =>
    console.log "setChanged #{changed} metadata #{JSON.stringify @model.attributes.metadata}"
    @changed = changed
    $('input[name=_save]', @$el).prop 'disabled', !(changed or (@model.attributes.metadata.finalized and @model.attributes.metadata.submitted!=true))
    $('input[name=_save_finalized]', @$el).prop 'disabled', !(changed or (@model.attributes.metadata.saved and !@model.attributes.metadata.finalized))
    $('input[name=_send]', @$el).prop 'disabled', !(changed or (@model.attributes.metadata.saved and @model.attributes.metadata.submitted!=true))
    $('input[name=_reset]', @$el).prop 'disabled', !changed
    $('input[name=_delete]', @$el).prop 'disabled', !(changed or @model.attributes.metadata.saved)
    if changed
      # form add new
      console.log "disable instance add on changed"
      $('.form-newinstance').prop 'disabled', true

  formToData: (forceFinalized) =>
    data = {}
    data._finalized = forceFinalized ? ($('input[name=_finalized]', @$el).prop 'checked') 
    
    for surveyitem in (@model.attributes.formdef?.survey ? [])
      if surveyitem.name and surveyitem.type
        data[surveyitem.name] = switch surveyitem.type
          when 'note' then null
          when 'text' then $("textarea[name=#{surveyitem.name}]", @$el).val()
          else
            console.log "unhandled survey type #{surveyitem.type}"
            null
    data

  doSaveFinalized: (ev) =>
    @doSaveInternal(ev, true, false)

  doSave: (ev) =>
    @doSaveInternal(ev, false, false)

  doSend: (ev) =>
    @doSaveInternal(ev, true, true)

  doSaveInternal: (ev, forceFinalized, send) =>
    ev.preventDefault()
    now = new Date().getTime()
    data = @formToData(forceFinalized)
    console.log "doSave forceFinalized=#{forceFinalized} #{@model.id} data = #{JSON.stringify data}"
    metadata = JSON.parse(JSON.stringify @model.attributes.metadata)
    # TODO old metadata versions
    metadata.saved = true
    metadata.savedtime = now
    metadata.finalized = data._finalized
    metadata.submitted = false
    delete data._finalized
    @model.set 
        draftdata: null
        formdata: data
        metadata: metadata  
    # no tags?!
    @saveToDb (()-> if send then formdb.startUpload false)
    if metadata.finalized
      formdb.addFinalizedForm @model
    @changed = false
    @render()
    if @model.attributes.metadata.finalized
      # form add new
      console.log "enable instance add on save finalized"
      $('.form-newinstance').prop 'disabled', false

  saveToDb: (onSuccess) =>
    console.log 'saveToDb:'
    console.log @model
    if false == @model.save null, {
        success: () ->
          console.log "saved ok"
          if onSuccess?
            onSuccess()
        error: (model,res,options) ->
          console.log "Save error #{res}"
      }
      console.log "Save error (validation)"

  doReset: (ev) =>
    ev.preventDefault()
    console.log "doReset #{@model.id}"
    @model.set draftdata: null
    @saveToDb()
    @changed = false
    @render()

  doDelete: (ev) =>
    ev.preventDefault()
    console.log "doDelete #{@model.id}"
    # delete is really clear all data (?!)
    #@deleting = true
    #@remove()
    #if false == @model.destroy {
    #    success: () ->
    #      console.log "destroyed ok"
    #    error: (model,res,options) ->
    #      console.log "destry error #{res}"
    #  }
    #  console.log "Destry isNew"
    now = new Date().getTime()
    @model.set 
        draftdata: null
        formdata: {}
        metadata:
          createdtime: now
          saved: false
          finalized: false
          submitted: false
    @saveToDb()
    @changed = false
    @render()

