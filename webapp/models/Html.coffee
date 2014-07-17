# A HTML Fragment
Thing = require 'models/Thing'

module.exports = class Html extends Thing
  defaults:
    title: ''
    description: ''
    type: 'html'
    #html

  idAttribute: '_id'


