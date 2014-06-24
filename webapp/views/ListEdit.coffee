# List edit View
templateListEdit = require 'templates/ListEdit'
ThingEditView = require 'views/ThingEdit'
ThingRefList = require 'models/ThingRefList'
ThingRefListView = require 'views/ThingRefList'

module.exports = class ListEditView extends ThingEditView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateListEdit d

  render: =>
    super()
    @thingRefList = new ThingRefList()
    @thingRefListView =  new ThingRefListView model: @thingRefList
    @thingRefListView.render()
    $('.thingref-list-holder', @$el).append @thingRefListView.el

  formToModel: () =>
    super()

  remove: () =>
    @thingRefListView.remove()
    super()

