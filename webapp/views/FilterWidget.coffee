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
    @updateDisabled()
    $('a.do-filter', @$el).addClass 'disabled'
    @

  refresh: =>
    $('input[name=query]', @$el).val @model.attributes.query
    @updateDisabled()

  updateDisabled: =>
    $('a.do-clear-filter', @$el).toggleClass 'disabled', ($('input[name=query]', @$el).val()=='')

  events: ->
    "click .do-filter": "doFilter"
    "click .do-clear-filter": "doClearFilter"
    "change input": "doFilter"
    "input input": "onInput"

  doFilter: (ev) =>
    if ev?
      ev.preventDefault()
    query = $('input[name=query]', @$el).val()
    console.log "Filter = #{query}"
    @model.set query: query
    @updateDisabled()
    $('a.do-filter', @$el).addClass 'disabled'
    #setTimeout (()=>$('input[name=query]',@$el).focus()), 100

  doClearFilter: (ev) =>
    if ev?
      ev.preventDefault()
    console.log "Filter clear"
    @model.set query: ''
    $('a.do-filter', @$el).addClass 'disabled'
    @refresh()

  onInput: (ev) =>
    console.log "Filter input..."
    if @timer?
      clearTimeout @timer
    @updateDisabled()
    $('a.do-filter', @$el).removeClass 'disabled'
    setTimeout (() => @doFilter()), INPUT_TIMEOUT
    
  remove: () =>
    if @timer?
      clearTimeout @timer

