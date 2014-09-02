# A Place
Thing = require 'models/Thing'

module.exports = class App extends Thing
  defaults:
    title: ''
    description: ''
    type: 'app'
    thingIds: []
    serverId: ''
    showAbout: true
    aboutText: ''
    version: '1'
    licenseShortName: ''
    licenseVersion: ''
    lastupdatedtime: 0 
    createdtime: 0
    showShare: true
    #showLocation: true
    #defaultPlaceId: ''

  idAttribute: '_id'


