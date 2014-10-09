# HtmlEdit View
templateHtmlEditTab = require 'templates/HtmlEditTab'
ThingEditView = require 'views/ThingEdit'
filter = require 'filter'

module.exports = class HtmlEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'HTML', template: templateHtmlEditTab } ]

  render: =>
    super()
    replace = () -> 
      console.log "Set up CKEditor..."
      ckconfig = {}
      ckconfig.customConfig = '../../ckeditor_config_html.js'
      query = '&q='+encodeURIComponent(filter.getModel().attributes.query)
      ckconfig.filebrowserBrowseUrl = 'filebrowse.html'+query
      ckconfig.filebrowserImageBrowseUrl = 'filebrowse.html?type=image%2F'+query
      ckconfig.filebrowserAudioBrowseMpegUrl = 'filebrowse.html?type=audio%2Fmpeg'+query
      ckconfig.filebrowserAudioBrowseOggUrl = 'filebrowse.html?type=audio%2Fogg'+query
      #editor = CKEDITOR.instances['htmlfragment']
      #if editor 
      #  editor.destroy(true)
      CKEDITOR.replace 'htmlfragment', ckconfig
    setTimeout replace,0

  formToModel: () =>
    html = $(':input[name="htmlfragment"]', @$el).val()
    console.log "html = #{html}"
    @model.set 'html', html
    super()

  remove: () =>
    editor = CKEDITOR.instances['htmlfragment']
    if editor 
      console.log "destroy ckeditor"
      editor.destroy(true)
    super()

