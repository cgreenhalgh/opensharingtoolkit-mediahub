# BookletEdit View
templateBookletEdit = require 'templates/BookletEdit'
ThingEditView = require 'views/ThingEdit'

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
      console.log "Set up CKEditor 'htmlcontent'..."
      ckconfig = {}
      path = window.location.pathname
      ix = path.lastIndexOf '/'
      if ix<0
        console.log "Location path not valid: #{path}"
      else
        path = path.substring 0,(ix+1)
        ckconfig.customConfig = path+'ckeditor_config_booklet.js'
        ckconfig.filebrowserBrowseUrl = path+'filebrowse.html'
        ckconfig.filebrowserImageBrowseUrl = path+'filebrowse.html?type=image%2F'
      #ckconfig.extraPlugins = 'widget,mediahubcolumn'
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
      console.log "destroy ckeditor 'htmlcontent'"
      editor.destroy(true)
    super()

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"
    "click .do-select-cover": "selectCover"

  selectCover: (ev) =>
    @selectImage ev,'.image-select-image'

