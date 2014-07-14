# A Place
module.exports = class Place extends Backbone.Model
  defaults:
    title: ''
    description: ''
    type: 'list'
    thingsIds: []    

  idAttribute: '_id'


