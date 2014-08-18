# Form ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/Form'
ThisThingList = require 'models/FormList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/ThingInList'
ThisThingView = require 'views/Thing' #TODO
ThisThingEditView = require 'views/FormEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'form'
    title: 'Form'
    description: 'A form for collection structured information'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
