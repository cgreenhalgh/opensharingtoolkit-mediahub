# FileInList View
templateFileInList = require 'templates/FileInList'

module.exports = class FileInListView extends Backbone.View

  tagName: 'div'
  className: 'file-in-list'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFileInList d

  render: =>
    console.log "render FileInList #{@model.attributes._id}: #{ @model.attributes.title }"
    @$el.html @template @model.attributes
    @


