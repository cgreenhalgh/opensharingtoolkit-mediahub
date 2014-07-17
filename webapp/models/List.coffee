# A Place
Thing = require 'models/Thing'

module.exports = class Place extends Thing
  defaults:
    title: ''
    description: ''
    type: 'list'
    thingsIds: []    

  idAttribute: '_id'


