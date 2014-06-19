# BookletEdit View
templateBookletEdit = require 'templates/BookletEdit'
ThingEditView = require 'views/ThingEdit'

window.mediahubCallbacks = {}
window.nextMediahubCallback = 1

module.exports = class BookletEditView extends ThingEditView

  contentToHtml: (content) ->
    if content?
      content
    else
      ''

  htmlToContent: (html) ->
    html

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateBookletEdit _.extend { content: @contentToHtml @model.attributes.content }, d

  render: =>
    super()
    replace = () -> 
      console.log "Set up CKEditor..."
      path = window.location.pathname
      ix = path.lastIndexOf '/'
      ckconfig = {}
      ckconfig.customConfig = path.substring(0,ix+1)+'ckeditor_config_booklet.js'
      #ckconfig.extraPlugins = 'widget,mediahubcolumn'
      path = window.location.pathname
      ix = path.lastIndexOf '/'
      if ix<0
        console.log "Location path not valid: #{path}"
      else
        path = path.substring 0,(ix+1)
        ckconfig.filebrowserBrowseUrl = path+'filebrowse.html'
        ckconfig.filebrowserImageBrowseUrl = path+'filebrowse.html?type=image%2F'
      CKEDITOR.replace 'htmlcontent', ckconfig
    setTimeout replace,0

  formToModel: () =>
    coverurl = $('.image-select-image', @$el).attr 'src'
    console.log "coverurl = #{coverurl}"
    @model.set coverurl: coverurl
    html = $(':input[name="htmlcontent"]', @$el).val()
    console.log "contenthtml = #{html}"
    @model.set 'content', @htmlToContent html
    super()

  remove: () =>
    editor = CKEDITOR.instances['htmlcontent']
    if editor 
      console.log "destroy ckeditor"
      editor.destroy(true)
    super()

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"
    "click .do-select-cover": "selectCover"

  selectCover: (ev) =>
    console.log "selectCover..."
    ev.preventDefault()
    path = window.location.pathname
    ix = path.lastIndexOf '/'
    if ix < 0
      alert "Error in pathname: #{path}"
      return false
    path = path.substring 0,(ix+1)
    @callback = window.nextMediahubCallback++
    self = @
    window.mediahubCallbacks[@callback] = ( url ) ->
      console.log "set cover #{url}"
      $('.image-select-image', self.$el).attr 'src', url

    window.open path+"filebrowse.html?type=image%2F&mediahubCallback=#{@callback}", '_blank', "width=#{0.8*screen.width}, height=#{0.7*screen.height}, menubar=no, location=no, status=no, toolbar=no"

  remove: () =>
    if @callback?
      delete window.mediahubCallbacks[@callback]
    super()

