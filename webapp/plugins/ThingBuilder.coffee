# Thing generic type stuff
plugins = require 'plugins'
ContentType = require 'models/ContentType'

module.exports.createThingType = (attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView) ->
  things = null

  contentType = new ContentType attributes

  ThisThing.contentType = contentType
  ThisThing.prototype.getContentType = () -> contentType

  # special case for generic ThingListView
  contentType.getThingView = (thing) ->
    new ThisThingInListView model: thing

  # Router entry point
  contentType.createView = () ->
    console.log "create #{contentType.id} view"
    things = new ThisThingList()
    thingsView = new ThisThingListView model:things
    thingsView.render()

    things.fetch()

    return thingsView

  # Router entry point
  contentType.createActionView = (action,id) ->
    if action=='edit' or action=='editadd' 
      if not ThisThingEditView?
        alert "Sorry, cannot #{action} this kind of thing"
        return
      thing = things.get id
      if not thing?
        if action=='editadd'
          if not id?
            # work-around backbone-pouchdb attach presumes Math.uuid
            id = contentType.id+':'+uuid()
          thing = new ThisThing _id: id
          console.log "new id #{thing.id}"
          #things.add thing
          return new ThisThingEditView {model: thing, add: true, things: things}
        alert "could not find #{contentType.id} #{id}"
        return
      return new ThisThingEditView model: thing
    else if action=='view'
      if not ThisThingView?
        alert "Sorry, cannot view this kind of thing"
        return
      thing = things.get id
      if not thing?
        alert "could not find #{contentType.id} #{id}"
        return
      return new ThisThingView model: thing
    else if action=='add'
      if not ThisThingEditView?
        alert "Sorry, cannot add this kind of thing"
        return
      # work-around backbone-pouchdb attach presumes Math.uuid
      thing = new ThisThing _id: contentType.id+':'+uuid()
      console.log "new id #{thing.id}"
      #things.add thing
      return new ThisThingEditView {model: thing, add: true, things: things}
    else
      console.log "unknown #{contentType.id} action #{action} (id #{id})"

  contentType

