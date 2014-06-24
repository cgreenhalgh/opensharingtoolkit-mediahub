# List edit View
templateListEdit = require 'templates/ListEdit'
ThingEditView = require 'views/ThingEdit'
ThingRefList = require 'models/ThingRefList'
ThingRef = require 'models/ThingRef'
ThingRefListView = require 'views/ThingRefList'

module.exports = class ListEditView extends ThingEditView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateListEdit d

  render: =>
    super()
    things = []
    if @model.attributes.thingIds?
      for thingId, i in @model.attributes.thingIds
        things.push new ThingRef thingId: thingId, _id: uuid()
    @thingRefList = new ThingRefList things
    @thingRefListView =  new ThingRefListView model: @thingRefList
    $('.thingref-list-holder', @$el).append @thingRefListView.el

  formToModel: () =>
    thingIds = []
    for tr in @thingRefList.models
      if tr.attributes.thingId
        thingIds.push tr.attributes.thingId
      else
        console.log "error: missing thingId in ThingRef #{tr.id}"
    console.log "thingIds = #{thingIds}"
    @model.set thingIds: thingIds
    super()

  remove: () =>
    console.log "remove ListEdit #{@model.id}"
    @thingRefListView.remove()
    super()
