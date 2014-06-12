# HTML fragment ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/Html'
ThisThingList = require 'models/HtmlList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/ThingInList'
ThisThingEditView = require 'views/ThingEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'html'
    title: 'HTML Fragment'
    description: 'A well-formed HTML fragment (actually just a place-holder at the moment!)'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
