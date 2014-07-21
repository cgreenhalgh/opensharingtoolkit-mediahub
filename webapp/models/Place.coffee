# A Place
Thing = require 'models/Thing'

module.exports = class Place extends Thing
  defaults:
    title: ''
    description: ''
    type: 'place'
    imageurl: ''
    iconurl: ''
    mapiconurl: ''
    lat: 0
    lon: 0
    address: ''
    zoom: 0 # assuming single tile for now, i.e. 256x256
    
  idAttribute: '_id'


