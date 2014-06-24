# List ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/List'
ThisThingList = require 'models/ListList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/ThingInList'
ThisThingView = require 'views/Thing' #TODO
ThisThingEditView = require 'views/ListEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'list'
    title: 'List'
    description: 'A list of things'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
