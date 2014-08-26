# FormList View
templateFormList = require 'templates/FormList'
FormInListView = require 'views/FormInList'

module.exports = class FormListView extends Backbone.View

  tagName: 'div'
  className: 'row thing-list top-level-view'

  initialize: ->
    @views = []
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem
    @render()

  template: (d) =>
    templateFormList d

  render: =>
    console.log "render FormList"
    @$el.html @template {}
    @model.forEach @addItem
    @

  addItem: (thing) =>
    console.log "FormListView add #{thing.id}"
    view = new FormInListView model: thing
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  removeItem: (thing) =>
    console.log "FormListView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  remove: () =>
    for view in @views
      view.remove()
    super()


