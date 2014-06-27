# App ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/App'
ThisThingList = require 'models/AppList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/AppInList'
ThisThingView = require 'views/Thing' #TODO
ThisThingEditView = require 'views/AppEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'app'
    title: 'App'
    description: 'A downloadable web-app'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
