# FormInList View
templateFormInList = require 'templates/FormInList'

module.exports = class FormInListView extends Backbone.View

  tagName: 'div'
  className: 'columns thing-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateFormInList d

  render: =>
    #console.log "render FormInList #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events: ->
    "click": "view"

  view: (ev) =>
    console.log "view Form #{@model.attributes._id}"
    ev.preventDefault()
    window.router.navigate "#Form/#{encodeURIComponent @model.id}", trigger:true

