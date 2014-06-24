# list of Thing Refs (ids), e.g. from List thingIds
Thing = require 'models/Thing'

module.exports = class ThingRefList extends Backbone.Collection

  model: Thing

