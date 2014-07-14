# A Place
module.exports = class App extends Backbone.Model
  defaults:
    title: ''
    description: ''
    type: 'app'
    thingIds: []    

  idAttribute: '_id'


