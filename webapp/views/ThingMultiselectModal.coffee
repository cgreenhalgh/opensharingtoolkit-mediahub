# Thing multi-select Modal View
templateThingMultiselectModal = require 'templates/ThingMultiselectModal'
ThingInMultiselectView = require 'views/ThingInMultiselect'
FilterWidgetView = require 'views/FilterWidget'
filter = require 'filter'

module.exports = class ThingMultiselectModalView extends Backbone.View

  id: 'ThingMultiselectModalView'
  tagName: 'div'
  className: 'reveal-modal add-thingrefs-modal'
  # NB must provide data-options to work around bug , 'data-options':"close_on_background_click: false;" 
  attributes: { 'data-reveal':'' }

  initialize: ->
    @fmodel = filter.newFilterCollection @model
    @listenTo @fmodel, 'add', @addItem
    @listenTo @fmodel, 'remove', @removeItem
    @listenTo @fmodel, 'reset', @reset

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateThingMultiselectModal d

  render: =>
    @$el.html @template {}
    if @filterView?
      @filterView.remove()
    @filterView = new FilterWidgetView model: filter.getModel()
    $('.filter-widget-holder', @$el).replaceWith @filterView.el
    @views = []
    @fmodel.forEach @addItem
    @

  reset: () =>
    for view in @views
      view.remove()
    @views = []
    @fmodel.forEach @addItem    

  inited: false

  events:
    'click .do-ok': 'doOk'
    'click .do-close': 'doClose'
    'change input[type=checkbox]' : 'checkSelect'

  checkSelect: (ev) =>
    console.log "checkSelect..."
    selected = $('input:checked', @$el).length > 0
    if selected
      $('.do-ok', @$el).removeClass 'disabled'
    else
      $('.do-ok', @$el).addClass 'disabled'

  doOk: (ev) =>
    ev.preventDefault()
    if $(ev.target).hasClass 'disabled'
      console.log "ignore ok - disabled"
      return
    @$el.foundation 'reveal', 'close'
    thingIds = []
    for el in $('input:checked', @$el)
      id = $(el).attr 'name'
      console.log "selected #{id}"
      thingIds.push id
    try 
      @callback thingIds
    catch err
      console.log "error calling ThingMultiselect callback: #{err.message}" 
      console.log "at #{err.stack}"

  doClose: (ev) =>
    ev.preventDefault()
    @$el.foundation 'reveal', 'close'

  addItem: (thing) =>
    console.log "ThingMultiselectModalView add #{thing.id}"
    view = new ThingInMultiselectView model: thing
    view.render()
    # could switch to FilterCollection sorting...
    if thing.getSortValue?
      sortValue = String(thing.getSortValue())
    else
      console.log "ThingMultiselectModalView no getSortValue: #{thing.constructor?.name} #{JSON.stringify thing.attributes}"
      sortValue = thing.id
      thing.getSortValue = () -> sortValue
    ix = @views.length
    for v,i in @views
      sv = v.model.getSortValue()
      #console.log "sort #{sortValue} vs #{sv} = #{sortValue.localeCompare String(sv)}"
      if (sortValue.localeCompare String(sv)) < 0
         #console.log "sort #{sortValue} vs #{sv} < #{sortValue.localeCompare String(sv)} -> #{i}"
         ix = i
         break
    if ix < @views.length
      console.log "insert Thing at #{ix} / #{@views.length} (#{sortValue})"
      @views[ix].$el.before view.$el
      @views.splice ix, 0, view
    else
      $('.thing-list', @$el).append view.$el
      @views.push view
    
  removeItem: (thing) =>
    console.log "ThingMultiselectModalView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return

  remove: () =>
    for view in @views
      view.remove()
    if @filterView?
      @filterView.remove()
    @fmodel.stopListening()
    super()

  show: (cb) =>
    if not @inited
      @inited = true
      try
        @$el.foundation 'reveal', 'init'
      catch err
        console.log "error doing reveal init: #{err.message}"
    $('input[type=checkbox]', @$el).attr 'checked', false
    @callback = cb
    @$el.foundation 'reveal', 'open'


