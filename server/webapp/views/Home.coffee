# Home View
templateHome = require 'templates/Home'

module.exports = class HomeView extends Backbone.View

  tagName: 'div'
  className: 'row thing'

  initialize: ->
    @render()

  template: (d) =>
    templateHome d

  render: =>
    @$el.html @template @model.attributes
    @

