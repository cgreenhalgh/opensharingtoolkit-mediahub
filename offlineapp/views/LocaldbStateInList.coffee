# Track Review (offline) View

templateLocaldbStateInList = require 'templates/LocaldbStateInList'

module.exports = class LocaldbStateInListView extends Backbone.View

  tagName: 'div'
  className: 'columns small-12 large-12'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateLocaldbStateInList d

  render: =>
    @$el.html @template @model.attributes
    @

