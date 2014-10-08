# list filtering

filterModel = new Backbone.Model query: ''

#filterModel.on 'change:query', (m,value) ->
#  console.log "Filter query changed to #{value}"

module.exports.getModel = () ->
  filterModel

matches = (m) ->
  s = ((m.attributes.title ? '')+' '+(m.attributes.comment ? '')).toLowerCase()
  qs = filterModel.attributes.query.split ' '
  for q in qs when q!=''
    if s.indexOf(q) < 0
      console.log "#{m.id} does not match #{q} (#{s})"
      return false
  console.log "#{m.id} matches #{filterModel.attributes.query} (#{s})"
  true

compareThings = (m1, m2) ->
  s1 = (m1.attributes.title ? '')+' '+(m1.attributes.comment ? '')
  s2 = (m2.attributes.title ? '')+' '+(m2.attributes.comment ? '')
  return s1.localeCompare s2

class FilterCollection extends Backbone.Collection
  constructor: (collection,options) ->
    console.log "new FilterCollection..."
    @collection = collection
    models = _.filter (collection.models ? []), matches
    models.sort compareThings
    super models, (_.extend { comparator: compareThings }, options)

  initialize: () ->
    @listenTo @collection,'add',@filterAdd
    @listenTo @collection,'remove',@filterRemove
    @listenTo @collection,'reset',@filterReset
    @listenTo filterModel, 'change:query', @filter

  filterAdd: (model, coll, options) =>
    if not matches model
      console.log "ignore add due to filter #{model.id}"
      return
    @add model,options

  filterRemove: (model, coll, options) =>
    @remove model,options
  
  filterReset: (coll, options) =>
    models = _.filter (@collection.models ? []), matches
    models.sort compareThings
    @reset models, options
  
  filter: () =>
    console.log "FilterCollection filter #{filterModel.attributes.query}"
    @filterReset @collection

module.exports.newFilterCollection = (col) ->
  fcol = new FilterCollection col
  return fcol

