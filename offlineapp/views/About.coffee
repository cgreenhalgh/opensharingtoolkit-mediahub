# About (offline) View

templateAbout = require 'templates/About'

module.exports = class AboutView extends Backbone.View

  title: 'About'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateAbout d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

