# ThingEdit View
templateThingEdit = require 'templates/ThingEdit'
templateThingEditTab = require 'templates/ThingEditTab'
server = require 'server'
allthings = require 'allthings'

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

  tabs: ->
    [ { title: 'Overview', template: templateThingEditTab } ]

  render: =>
    console.log "render ThingEdit #{@model.attributes._id}: #{ @model.attributes.title }"
    # TODO edit?
    @$el.html @template 
      data: @model.attributes
      add: @add
      contentType: @model.getContentType().attributes
      tabs: @tabs()
    f = () -> 
      $('input[name="title"]', @$el).focus()
      console.log "Set up CKEditor 'description'..."
      ckconfig = {}
      ckconfig.customConfig = '../../ckeditor_config_description.js'
      CKEDITOR.replace 'description', ckconfig
    setTimeout f, 0
    @

  events: ->
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"
    "click .do-select-image": "selectThingImage"
    "click .do-select-icon": "selectIcon"
    "click .tab-title > a": "showTab"

  formToModel: () =>
    title = $('input[name="title"]', @$el).val()
    description = $(':input[name="description"]', @$el).val()
    comment = $(':input[name="comment"]', @$el).val()
    imageurl = $('.image-image', @$el).attr 'src'
    iconurl = $('.image-icon', @$el).attr 'src'
    console.log "title=#{title}, description=#{description}, imageurl=#{imageurl}, iconurl=#{iconurl}"
    @model.set 
      title: title
      description: description
      comment: comment
      imageurl: imageurl
      iconurl: iconurl

  showTab: (ev) =>
    console.log "show tab #{ev.target.href}"
    ev.preventDefault()
    tab = ev.target.href
    if (ix = tab.indexOf('#')) >= 0
      tab = tab.substring (ix+1)
    $('.tab-title', @$el).removeClass 'active'
    $(ev.target).parent().addClass 'active'
    $('.tabs-content > .content', @$el).removeClass 'active'
    $(".thing-tab-#{tab}", @$el).addClass 'active'

  submit: (ev)=>
    console.log "submit..."
    ev.preventDefault()
    @formToModel()  
    # debug failing saves...
    if !@model.isValid()
      console.log "submit not valid: #{@model.validationError}"

    server.working 'save Thing'  
    if false==@model.save null, {
        success: server.success
        error: server.error
      }
      server.error @model,'Save validation error (save Thing)'
    if @add
      if @things
        @things.add @model
      allthings.get().add @model
    @close()


  selectThingImage: (ev) =>
    @selectImage ev,'.image-image'

  selectIcon: (ev) =>
    @selectImage ev,'.image-icon'


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

