# list of Thing Refs (ids), e.g. from List thingIds
ThingRef = require 'models/ThingRef'

module.exports = class ThingRefList extends Backbone.Collection

  model: ThingRef

  initialize: (models, options) =>
    @thingTypes = options?.types ? []

  acceptsId: (id) =>
    type = id.substring 0,(id.indexOf ':')
    return (@thingTypes.indexOf type)>=0

  acceptsThing: (thing) =>
    @acceptsId thing.id

  add: (models,options) =>
    if !_.isArray(models)
      if @acceptsId models.attributes.thingId
        super(models, options)
      else
        console.log "ThingRefList ignores unacceptable #{models.attributes.thingId}"
    else
      for model in models
        # iffy?
        @add model,options

