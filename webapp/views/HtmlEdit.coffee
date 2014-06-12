# HtmlEdit View
templateHtmlEdit = require 'templates/HtmlEdit'
ThingEditView = require 'views/ThingEdit'

module.exports = class HtmlEditView extends ThingEditView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateHtmlEdit d

  formToModel: () =>
    html = $(':input[name="html"]', @$el).val()
    console.log "html = #{html}"
    @model.set 'html', html
    super()


