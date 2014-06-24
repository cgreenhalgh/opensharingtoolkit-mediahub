# list of Thing Refs (ids), e.g. from List thingIds
ThingRef = require 'models/ThingRef'

module.exports = class ThingRefList extends Backbone.Collection

  model: ThingRef


