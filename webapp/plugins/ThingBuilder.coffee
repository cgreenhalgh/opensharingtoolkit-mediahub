# Thing generic type stuff
plugins = require 'plugins'
ContentType = require 'models/ContentType'
#server = require 'server'
allthings = require 'allthings'

module.exports.createThingType = (attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView) ->
  things = null

  contentType = new ContentType attributes

  ThisThing.contentType = contentType
  ThisThing.prototype.getContentType = () -> contentType
  ThisThing.addingThings = {}

  # special case for generic ThingListView
  contentType.getThingView = (thing) ->
    new ThisThingInListView model: thing

  things = new ThisThingList()

  contentType.init = () ->
    ats = allthings.get()
    addThing = (thing,coll,options) ->
      if thing.attributes.type!=contentType.id
        return
      if  not things.get thing.id
        console.log "clone #{thing.id} from allthings to #{contentType.id} List"
        tt = new ThisThing thing.attributes
        things.add tt
        setTimeout (()->coll.remove thing; coll.add tt), 0
    ats.listenTo ats,'add', addThing
    for thing in ats
      addThing thing

    #server.working "fetch #{contentType.id}"
    #things.fetch
    #  success: server.success
    #  error: server.error

  contentType.getThings = () -> things

  # Router entry point
  contentType.createView = () ->
    console.log "create #{contentType.id} view"
    thingsView = new ThisThingListView model:things
    thingsView.render()

    return thingsView

  # Router entry point
  contentType.createActionView = (action,id) ->
    if action=='edit' 
      if not ThisThingEditView?
        alert "Sorry, cannot #{action} this kind of thing"
        return
      thing = things.get id
      if not thing?
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
      if not id?
        # work-around backbone-pouchdb attach presumes Math.uuid
        id = contentType.id+':'+uuid()

      if ThisThing.addingThings? 
        adding = ThisThing.addingThings[id]
        if adding?
          adding._id = id
          console.log "add using addingThing #{adding}"
          thing = new ThisThing adding
        else
          thing = new ThisThing _id: id
      console.log "new id #{thing.id}"
      #things.add thing
      return new ThisThingEditView {model: thing, add: true, things: things}
    else
      console.log "unknown #{contentType.id} action #{action} (id #{id})"

  contentType

