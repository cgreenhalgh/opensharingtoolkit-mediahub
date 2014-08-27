# FormInstance (offline) View
templateFormInstance = require 'templates/FormInstance'
formdb = require 'formdb'

module.exports = class FormInstanceView extends Backbone.View

  tagName: 'div'

  initialize: ->
    #@listenTo @model, 'change', @render
    @changed = @model.attributes.draftdata? or not @model.attributes.metadata.saved
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
    @changed = changed
    $('input[name=_save]', @$el).prop 'disabled', !changed
    $('input[name=_reset]', @$el).prop 'disabled', !changed
    if changed
      # form add new
      console.log "disable instance add on changed"
      $('.form-newinstance').prop 'disabled', true

  formToData: () =>
    data = {}
    data._finalized = $('input[name=_finalized]', @$el).prop 'checked'
    
    for surveyitem in (@model.attributes.formdef?.survey ? [])
      if surveyitem.name and surveyitem.type
        data[surveyitem.name] = switch surveyitem.type
          when 'note' then null
          when 'text' then $("textarea[name=#{surveyitem.name}]", @$el).val()
          else
            console.log "unhandled survey type #{surveyitem.type}"
            null
    data

  doSave: (ev) =>
    ev.preventDefault()
    now = new Date().getTime()
    data = @formToData()
    console.log "doSave #{@model.id} data = #{JSON.stringify data}"
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
    @saveToDb()
    if metadata.finalized
      formdb.addFinalizedForm @model
    @changed = false
    @render()
    if @model.attributes.metadata.finalized
      # form add new
      console.log "enable instance add on save finalized"
      $('.form-newinstance').prop 'disabled', false


  saveToDb: () =>
    console.log 'saveToDb:'
    console.log @model
    if false == @model.save null, {
        success: () ->
          console.log "saved ok"
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

