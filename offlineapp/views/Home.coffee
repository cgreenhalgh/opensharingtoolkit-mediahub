# Home (offline) View

templateHome = require 'templates/Home'

module.exports = class HomeView extends Backbone.View

  tagName: 'div'

  initialize: ->
    @render()

  template: (d) =>
    templateHome d

  render: =>
    @$el.html @template @model
    @


