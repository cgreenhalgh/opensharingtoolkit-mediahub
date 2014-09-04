# TagListWidget View
TagWidgetView = require 'views/TagWidget'

module.exports = class TagListWidgetView extends Backbone.View

  tagName: 'div'
  className: 'thing-in-list-buttons'

  initialize: ->
    @views = []
    @listenTo @model, 'add', @addItem
    @render()

  render: =>
    @model.forEach @addItem
    @

  addItem: (thing) =>
    view = new TagWidgetView model: thing
    @$el.append view.$el
    @views.push view
    
  remove: () =>
    for view in @views
      view.remove()
    super()

