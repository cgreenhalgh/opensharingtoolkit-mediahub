# FileInList View
templateContentTypeInList = require 'templates/ContentTypeInList'

module.exports = class ContentTypeInListView extends Backbone.View

  tagName: 'div'
  className: 'columns small-12 large-12 content-type-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateContentTypeInList d

  render: =>
    console.log "render ContentTypeInList #{@model.id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @

  events:
    "click .select-content-type": "select"

  select: (ev) =>
    console.log "select ContentType #{@model.id}"
    ev.preventDefault()
    # TODO
    router.navigate "#ContentType/#{@model.id}", trigger:true


