# ContentTypeList View
ContentType = require 'models/ContentType'
ContentTypeInListView = require 'views/ContentTypeInList'
templateContentTypeList = require 'templates/ContentTypeList'

module.exports = class ContentTypeListView extends Backbone.View

  tagName: 'div'
  className: 'row content-type-list top-level-view'

  initialize: ->
    @views = []
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem

  template: (d) =>
    templateContentTypeList d

  render: =>
    console.log "render ContentTypeList with template"
    @$el.html @template @model.attributes
    @model.forEach @addItem
    @

  addItem: (item) =>
    console.log "ContentTypeListView add #{item.id}"
    view = new ContentTypeInListView model: item
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  removeItem: (item) =>
    console.log "ContentTypeListView remove #{item.id}"
    for view, i in @views when view.model.id == item.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  #events:
  #  "click .do-add-file": "addFile"


