# Nearby (offline) View

templateNearby = require 'templates/Nearby'
location = require 'location'

module.exports = class NearbyView extends Backbone.View

  title: 'Nearby'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateNearby d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

