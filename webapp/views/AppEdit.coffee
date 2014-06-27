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
    files = []
    thingIds = @model.attributes.thingIds
    @checkThings thingIds, items, files    

  checkThings: (thingIds, items, files) =>
    while thingIds.length > 0
      thingId = (thingIds.splice 0,1)[0]
      console.log "update for thing #{thingId}..."
      thing = allthings.get().get thingId
      if not thing? 
        console.log "- could not find #{thingId}"
      else
        item = { type: thing.type, id: thing.id, url: config.dburl+"/"+thingId }
        items.push item
        # TODO... files, etc.
        
    console.log "Checked all things, found #{items.length} items and #{files.length} files"
    @model.set { items: items, files: files }
    
