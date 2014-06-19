# Booklet "cover" (i.e. "external") (offline) View

templateBookletCover = require 'templates/BookletCover'

module.exports = class BookletCoverView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateBookletCover d

  render: =>
    @$el.html @template @model.attributes
    @

  events:
    'click .do-open': 'open'

  open: (ev) =>
    console.log "open booklet #{@model.id}"
    ev.preventDefault()
    window.router.navigate '#booklet/'+encodeURIComponent(@model.id), trigger:true
    
