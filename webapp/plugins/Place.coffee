# Place ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/Place'
ThisThingList = require 'models/PlaceList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/ThingInList'
ThisThingView = null; #require 'views/Place'
ThisThingEditView = require 'views/PlaceEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'place'
    title: 'Place'
    description: 'A place or location, i.e. somewhere in the world'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
