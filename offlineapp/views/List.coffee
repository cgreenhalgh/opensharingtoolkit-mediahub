# Thing (offline) View
templateList = require 'templates/List'
ThingListView = require 'views/ThingList'
ThingView = require 'views/Thing'

module.exports = class ListView extends ThingView

  template: (d) =>
    templateList d
 
  render: =>
    @$el.html @template @model.attributes
    if @listView?
      @listView.render()
    else if @model.things?
      console.log "render ListView adding ThingListView"
      @listView = new ThingListView model: @model.things
      @listView.render()
      @$el.append @listView.el
    else if @model.attributes.thingIds?
      console.log "error: render ListView without @things (thingsIds=#{@model.attributes.thingIds})"
    @

  remove: =>
    if @listView
      @listView.remove()
    super()

