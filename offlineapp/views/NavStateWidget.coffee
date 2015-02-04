# NavStateWidget View
templateNavStateWidget = require 'templates/NavStateWidget'

module.exports = class NavStateWidgetView extends Backbone.View

  tagName: 'div'
  className: 'nav-state-widget'

  initialize: =>
    @render()

  template: (d) =>
    templateNavStateWidget d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @


