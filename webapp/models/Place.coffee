# A Place
module.exports = class Place extends Backbone.Model
  defaults:
    title: ''
    description: ''
    type: 'place'
    imageurl: ''
    iconurl: ''
    lat: 0
    lon: 0
    address: ''
    zoom: 0 # assuming single tile for now, i.e. 256x256
    
