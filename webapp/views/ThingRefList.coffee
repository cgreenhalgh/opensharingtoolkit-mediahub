# ThingRefList View
templateThingRefList = require 'templates/ThingRefList'
ThingRefInListView = require 'views/ThingRefInList'
ThingMultiselectModalView = require 'views/ThingMultiselectModal'
ThingRef = require 'models/ThingRef'
allthings = require 'allthings'

module.exports = class ThingRefListView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @views = []
    @allthings = allthings.get()
    @listenTo @model, 'add', @addItem
    @listenTo @model, 'remove', @removeItem
    @listenTo @allthings, 'add', @addThing
    @render()

  template: (d) =>
    templateThingRefList d

  render: =>
    console.log "render ThingRefList"
    @$el.html @template {}
    views = []
    @model.forEach (item) => @addItem item, @model, {}
    @

  remove: () =>
    for view in @views
      view.remove()
    super()

  addThing: (thing) =>
    console.log "found Thing #{thing.id} (#{@model.models.length} models)"
    for tr in @model.models
      if tr.attributes.thingId == thing.id
        console.log "Found thingRef #{tr.id} Thing #{thing.id} on addThing"
        tr.set thing:thing

  addItem: (thing, collection, options) =>
    ix = collection.indexOf thing
    #console.log "ThingRefListView add #{thing.id} at #{ix}"
    if thing.attributes.thingId and not thing.attributes.thing?
      t = @allthings.get thing.attributes.thingId
      if t?
        #console.log "Found thingRef #{thing.id} Thing #{t.id} on addItem"
        thing.set thing:t

    view = new ThingRefInListView model:thing
    if ix>=0 && ix<@views.length
      console.log "add ThingRef #{ view.el } before #{ @views[ix].el } ix #{ix}"
      $(@views[ix].el).before view.el
      @views.splice ix, 0, view
    else 
      console.log "append ThingRef #{ view.el } to #{ @$el }"
      @$el.append view.el
      @views.push view
    
  removeItem: (thing) =>
    console.log "ThingRefListView remove #{thing.id}"
    for view, i in @views when view.model.id == thing.id
      console.log "remove view" 
      view.$el.remove()
      @views.splice i,1
      return
    
  events:
    "click .do-remove-thingrefs": "removeSelected"
    "click .do-add-below": "addBelow"
    "click .do-move-below": "moveBelow"
    'change input[type=checkbox]' : 'checkSelect'
    "click .do-select-all": "selectAll"
    "click .do-select-none": "selectNone"

  selectAll: (ev) =>
    ev.preventDefault()
    $('input[type=checkbox]', @$el).prop 'checked', true

  selectNone: (ev) =>
    ev.preventDefault()
    $('input[type=checkbox]', @$el).prop 'checked', false


  checkSelect: (ev) =>
    console.log "checkSelect..."
    selected = $('input:checked', @$el).length > 0
    if selected
      $('.do-move-below', @$el).removeClass 'disabled'
      $('.do-remove-thingrefs', @$el).removeClass 'disabled'
    else
      $('.do-move-below', @$el).addClass 'disabled'
      $('.do-remove-thingrefs', @$el).addClass 'disabled'

  getSelectedModels: () =>
    models = []
    for el in $('input:checked', @$el)
      id = $(el).attr 'name'
      console.log "selected #{id}"
      tr = @model.get id
      if tr?
        models.push tr
      else
        console.log "Could not find selected thingRef #{id}"
    models

  removeSelected: (ev) =>
    ev.preventDefault()
    for tr in @getSelectedModels()
      console.log "remove selected ThingRef #{tr.id}"
      # ThingRefs are not server-backed
      tr.destroy()

  getIndex: (ev) =>
    ix = 0
    parent = $(ev.target).parent()
    if parent?
      input = $('input[type=checkbox]', parent).get(0)
      if input?
        id = $(input).attr 'name'
        for model, i in @model.models
          if model.id == id
            ix = i+1
        console.log "add/move on #{id} at #{ix}"
      #else
      #  console.log "could not find input child for getIndex #{parent} #{ev.target}"
    #else
    #  console.log "could not find parent for getIndex #{ev.target}"
    return ix

  addBelow: (ev) =>
    ev.preventDefault()
    ix = @getIndex ev
    console.log "addBelow #{ix}..."
    if not @multiseletModal?
      thingList = allthings.get()
      @multiselectModal = new ThingMultiselectModalView model: thingList
      @multiselectModal.render()
      @$el.append @multiselectModal.el
    @multiselectModal.show (thingIds) => @onAddBelow thingIds, ix

  onAddBelow: (thingIds, ix) =>
    console.log "onAddBelow: #{thingIds.length} items at #{ix}"
    for thingId, i in thingIds
      @model.add (new ThingRef thingId: thingId, _id: uuid()), at: (if ix? then ix else 0)+i

  moveBelow: (ev) =>
    ev.preventDefault()
    ix = @getIndex ev
    console.log "moveBelow #{ix}..."
    # are we being deleted?
    models = @getSelectedModels()
    for m in models
      if (@model.indexOf m) < ix
        ix = ix-1
    for m,i in models
      console.log "move ThingRef #{m.id} to #{ix+i}"
      @model.remove m
      @model.add m, at: (ix+i)

