# A Place
Thing = require 'models/Thing'

module.exports = class App extends Thing
  defaults:
    title: ''
    description: ''
    type: 'app'
    thingIds: []    

  idAttribute: '_id'


