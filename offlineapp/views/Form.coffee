# Form (offline) View
templateForm = require 'templates/Form'
formdb = require 'formdb'
working = require 'working'

# TODO find/use formdata from formdb

module.exports = class FormView extends Backbone.View

  tagName: 'div'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateForm d
 
  render: =>
    @$el.html @template { formdef: @model.attributes }
    @

  back: =>
    console.log "back"
    window.history.back()


