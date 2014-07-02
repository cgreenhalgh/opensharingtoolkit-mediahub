# Place (offline) View
templatePlace = require 'templates/Place'

module.exports = class PlaceView extends Backbone.View

  tagName: 'div'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templatePlace d
 
  render: =>
    @$el.html @template @model.attributes
    @

