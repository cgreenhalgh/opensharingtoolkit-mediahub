# ThingEdit View
templateThingEdit = require 'templates/ThingEdit'

module.exports = class ThingEditView extends Backbone.View

  constructor:(options)->
    @add = options.add ?= false
    @things = options.things ?= null
    super(options)

  tagName: 'div'
  className: 'row thing-edit'
  cancelled: false

  initialize: ->
    #@listenTo @model, 'change', @render
    #@render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateThingEdit d

  render: =>
    console.log "render ThingEdit #{@model.attributes._id}: #{ @model.attributes.title }"
    # TODO edit?
    @$el.html @template { data: @model.attributes, add: @add, contentType: @model.getContentType().attributes }
    f = () -> $('input[name="title"]', @$el).focus()
    setTimeout f, 0
    @

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"

  formToModel: () =>
    title = $('input[name="title"]', @$el).val()
    description = $(':input[name="description"]', @$el).val()
    console.log "title=#{title}, description=#{description}"
    @model.set 'title', title
    @model.set 'description', description

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
      @things.remove @model
    @close()

  close: =>
    @remove()
    window.history.back()


