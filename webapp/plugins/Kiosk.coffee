# Kiosk ContentType plugin
plugins = require 'plugins'
ThisThing = require 'models/Kiosk'
ThisThingList = require 'models/KioskList'
ThisThingListView = require 'views/ThingList'
ThisThingInListView = require 'views/KioskInList'
ThisThingView = require 'views/Thing' #TODO
ThisThingEditView = require 'views/KioskEdit'

ThingBuilder = require 'plugins/ThingBuilder'

attributes = 
    id: 'kiosk'
    title: 'Kiosk'
    description: 'Configuration for an OpenSharingToolkit kiosk'

contentType = ThingBuilder.createThingType attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView

plugins.registerContentType contentType.id, contentType
  
  
