# Form View
templateForm = require 'templates/Form'

module.exports = class FormView extends Backbone.View

  tagName: 'div'
  className: 'row thing'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateForm d

  render: =>
    #console.log "render Thing #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

