# BookletEdit View
templateBookletEdit = require 'templates/BookletEdit'
ThingEditView = require 'views/ThingEdit'

window.mediahubCallbacks = {}
window.nextMediahubCallback = 1

module.exports = class BookletEditView extends ThingEditView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateBookletEdit d

  formToModel: () =>
    coverurl = $('.image-select-image', @$el).attr 'src'
    console.log "coverurl = #{coverurl}"
    @model.set coverurl: coverurl
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

