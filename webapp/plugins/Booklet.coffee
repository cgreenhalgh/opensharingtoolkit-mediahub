# Booklet ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/Booklet'
ThisThingList = require 'models/BookletList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/ThingInList'
ThisThingView = null; #require 'views/Booket'
ThisThingEditView = require 'views/BookletEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'booket'
    title: 'Booklet'
    description: 'A collection of related content for distribution as part of an app'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
