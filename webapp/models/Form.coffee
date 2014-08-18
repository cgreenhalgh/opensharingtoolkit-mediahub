# A Form
Thing = require 'models/Thing'

module.exports = class Form extends Thing
  defaults:
    title: ''
    description: ''
    type: 'form'
    # TODO

  idAttribute: '_id'


