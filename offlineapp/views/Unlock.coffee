# Unlock (offline) View

templateUnlock = require 'templates/Unlock'
locked = require 'locked'

module.exports = class UnlockView extends Backbone.View

  title: 'Code'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateUnlock d

  render: =>
    @$el.html @template _.extend {}, @model.attributes 
    @

  isUnlock: true

