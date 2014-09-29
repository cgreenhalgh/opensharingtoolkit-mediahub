# A Kiosk
Thing = require 'models/Thing'

module.exports = class Kiosk extends Thing
  defaults:
    title: ''
    description: ''
    type: 'kiosk'
    thingIds: []    
    campaigns: []
    atomfilename: ''
    externalurl: ''
    showAttract: false

  idAttribute: '_id'


