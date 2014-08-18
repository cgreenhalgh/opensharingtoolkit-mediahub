# Server ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/Server'
ThisThingList = require 'models/ServerList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/ServerInList'
ThisThingView = require 'views/Thing' #TODO
ThisThingEditView = require 'views/ServerEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'server'
    title: 'Server'
    description: 'A server that apps can communicate with'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
