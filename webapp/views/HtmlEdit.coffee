# HtmlEdit View
templateHtmlEditTab = require 'templates/HtmlEditTab'
ThingEditView = require 'views/ThingEdit'

module.exports = class HtmlEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'HTML', template: templateHtmlEditTab } ]

  render: =>
    super()
    replace = () -> 
      console.log "Set up CKEditor..."
      ckconfig = {}
      ckconfig.filebrowserBrowseUrl = 'filebrowse.html'
      ckconfig.filebrowserImageBrowseUrl = 'filebrowse.html?type=image%2F'
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

