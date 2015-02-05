# LocationAlert (offline) View

templateLocationAlertWidget = require 'templates/LocationAlertWidget'

module.exports = class LocationAlertWidgetView extends Backbone.View

  initialize: ->
    # model is location.getLocation
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateLocationAlertWidget d

  render: =>
    @$el.html @template @model.attributes
    @


