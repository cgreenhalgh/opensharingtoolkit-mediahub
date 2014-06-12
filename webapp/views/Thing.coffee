# Thing View
templateThing = require 'templates/Thing'

module.exports = class ThingView extends Backbone.View

  tagName: 'div'
  className: 'row thing'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateThing d

  render: =>
    console.log "render Thing #{@model.attributes._id}: #{ @model.attributes.title }"
    # TODO edit?
    @$el.html @template { data: @model.attributes, contentType: @model.getContentType().attributes }
    @

  events:
    "click .do-cancel": "cancel"
    "click .do-edit": "edit"

  cancel: (ev) =>
    ev.preventDefault()
    @close()

  close: =>
    @remove()
    window.history.back()

  edit: (ev) =>
    ev.preventDefault()
    window.router.navigate "#ContentType/#{@model.getContentType().id}/edit/#{encodeURIComponent @model.attributes._id}", trigger:true

