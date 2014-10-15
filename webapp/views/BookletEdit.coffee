# BookletEdit View
templateBookletEditTab = require 'templates/BookletEditTab'
ThingEditView = require 'views/ThingEdit'
filter = require 'filter'

module.exports = class BookletEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'Booklet', template: templateBookletEditTab } ]

  contentToHtml: (content) ->
    if content?
      content
    else
      ''

  htmlToContent: (html) ->
    html

  # syntax ok?? or (x...) -> 
  template: (d) =>
    super _.extend { content: @contentToHtml @model.attributes.content }, d

  render: =>
    super()
    replace = () -> 
      console.log "Set up CKEditor 'htmlcontent'..."
      ckconfig = {}
      ckconfig.customConfig = '../../ckeditor_config_booklet.js'
      query = '&q='+encodeURIComponent(filter.getModel().attributes.query)
      ckconfig.filebrowserBrowseUrl = 'filebrowse.html'+query
      ckconfig.filebrowserImageBrowseUrl = 'filebrowse.html?type=image%2F'+query
      ckconfig.filebrowserAudioBrowseMpegUrl = 'filebrowse.html?type=audio%2Fmpeg'+query
      ckconfig.filebrowserAudioBrowseOggUrl = 'filebrowse.html?type=audio%2Fogg'+query
      #ckconfig.extraPlugins = 'widget,mediahubcolumn'
      CKEDITOR.replace 'htmlcontent', ckconfig
    setTimeout replace,0

  formToModel: () =>
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

