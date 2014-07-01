# App edit View
ListEditView = require 'views/ListEdit'
templateAppEdit = require 'templates/AppEdit'
allthings = require 'allthings'

config = window.mediahubconfig

module.exports = class AppEditView extends ListEditView

  template: (d) =>
    templateAppEdit d

  formToModel: () =>
    super()

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"
    "click .do-update": "update"

  update: (ev) =>
    ev.preventDefault()
    console.log "Update app for download..."
    @formToModel()
    items = []
    # add itself?!
    items.push { type: @model.attributes.type, id: @model.id, url: config.dburl+"/"+encodeURIComponent(@model.id) }
    files = []
    thingIds = @model.attributes.thingIds
    @checkThings thingIds, items, files    

  addUrl: (files,url,title) ->
    if url? and url!=''
      # mime type? (not actually used, happily)
      files.push 
        url: url
        title: title

  addHtml: (files,html) ->
    # images in html
    if html?
      srcs = /<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/g
      while m = ( srcs.exec html ) 
        src = m[1]
        if src.length>0
          files.push {
            url: src
            title: 'img'
          }

  checkThings: (thingIds, items, files) =>
    while thingIds.length > 0
      thingId = (thingIds.splice 0,1)[0]
      console.log "update for thing #{thingId}..."
      thing = allthings.get().get thingId
      if not thing? 
        console.log "- could not find #{thingId}"
      else
        item = { type: thing.attributes.type, id: thing.id, url: config.dburl+"/"+encodeURIComponent(thingId) }
        items.push item
        console.log "thing: #{JSON.stringify thing.attributes}"
        # files, etc.
        # cover image
        @addUrl files, thing.attributes.coverurl, 'cover'
        @addHtml files, thing.attributes.content
        
    console.log "Checked all things, found #{items.length} items and #{files.length} files"
    @model.set { items: items, files: files }
    
