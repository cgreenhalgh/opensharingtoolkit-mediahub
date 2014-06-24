# A ThingRef
module.exports = class ThingRef extends Backbone.Model
  defaults:
    thingId: ''
    thing: null

  sync: (method, model, options) ->
    console.log "ignore sync for ThingRef" 
