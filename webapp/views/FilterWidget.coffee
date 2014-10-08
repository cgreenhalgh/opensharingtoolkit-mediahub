# Filter widget View
templateFilterWidget = require 'templates/FilterWidget'

INPUT_TIMEOUT = 1000

module.exports = class FilterWidgetView extends Backbone.View

  tagName: 'div'
  className: 'filter-widget'

  initialize: ->
    @listenTo @model, 'change', @refresh
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFilterWidget d

  render: =>
    @$el.html @template @model.attributes
    @

  refresh: =>
    $('input[name=query]', @$el).val @model.attributes.query

  events: ->
    "click .do-filter": "doFilter"
    "change input": "doFilter"
    "input input": "onInput"

  doFilter: (ev) =>
    if ev?
      ev.preventDefault()
    query = $('input[name=query]', @$el).val()
    console.log "Filter = #{query}"
    @model.set query: query
    #setTimeout (()=>$('input[name=query]',@$el).focus()), 100

  onInput: (ev) =>
    console.log "Filter input..."
    if @timer?
      clearTimeout @timer
    setTimeout (() => @doFilter()), INPUT_TIMEOUT
    
  remove: () =>
    if @timer?
      clearTimeout @timer

