# Thing generic type stuff
plugins = require 'plugins'
ContentType = require 'models/ContentType'

module.exports.createThingType = (attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingEditView) ->
  things = null

  contentType = new ContentType attributes

  ThisThing.contentType = contentType
  ThisThing.prototype.getContentType = () -> contentType

  contentType.getThingView = (thing) ->
    new ThisThingInListView model: thing

  contentType.createView = () ->
    console.log "create #{contentType.id} view"
    things = new ThisThingList()
    thingsView = new ThisThingListView model:things
    thingsView.render()

    things.fetch()

    return thingsView

  contentType.createActionView = (action,id) ->
    if action=='edit'
      thing = things.get id
      if not thing?
        alert "could not find #{contentType.id} #{id}"
        return
      return new ThisThingEditView model: thing
    else if action=='add'
      # work-around backbone-pouchdb attach presumes Math.uuid
      thing = new ThisThing _id: contentType.id+':'+uuid()
      console.log "new id #{thing.id}"
      things.add thing
      return new ThisThingEditView {model: thing, add: true, things: things}
    else
      console.log "unknown #{contentType.id} action #{action} (id #{id})"

  contentType
