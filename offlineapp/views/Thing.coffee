# Thing (offline) View
templateThing = require 'templates/Thing'

module.exports = class ThingView extends Backbone.View

  tagName: 'div'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateThing d
 
  render: =>
    @$el.html @template @model.attributes
    @

  back: =>
    console.log "back"
    window.history.back()

