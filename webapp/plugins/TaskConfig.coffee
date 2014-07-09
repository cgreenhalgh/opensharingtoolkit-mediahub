# TaskConfig ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/TaskConfig'
ThisThingList = require 'models/TaskConfigList'
ThisThingListView = require 'views/TaskConfigList'
ThisThingInListView = require 'views/ThingInList'
ThisThingView = require 'views/Thing'
ThisThingEditView = require 'views/ThingEdit' # TODO

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'taskconfig'
    title: 'Background Task'
    description: 'A background task on the server, e.g. exporting content'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
