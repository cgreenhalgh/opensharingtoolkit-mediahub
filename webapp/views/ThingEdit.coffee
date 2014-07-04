# ThingEdit View
templateThingEdit = require 'templates/ThingEdit'

# ckeditor image select callback handling
window.mediahubCallbacks = {}
window.nextMediahubCallback = 1


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
    f = () -> 
      $('input[name="title"]', @$el).focus()
      console.log "Set up CKEditor 'description'..."
      ckconfig = {}
      ckconfig.customConfig = '../../ckeditor_config_description.js'
      CKEDITOR.replace 'description', ckconfig
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
      #@things.remove @model
    @close()

  close: =>
    #@remove()
    window.history.back()

  selectImage: (ev, selector) =>
    console.log "selectImage #{selector}..."
    ev.preventDefault()
    @callback = window.nextMediahubCallback++
    self = @
    window.mediahubCallbacks[@callback] = ( url ) ->
      console.log "set image #{url}"
      $(selector, self.$el).attr 'src', url

    window.open "filebrowse.html?type=image%2F&mediahubCallback=#{@callback}", '_blank', "width=#{0.8*screen.width}, height=#{0.7*screen.height}, menubar=no, location=no, status=no, toolbar=no"


  remove: () =>
    if @callback?
      delete window.mediahubCallbacks[@callback]
    editor = CKEDITOR.instances['description']
    if editor 
      console.log "destroy ckeditor 'description'"
      editor.destroy(true)
    super()

