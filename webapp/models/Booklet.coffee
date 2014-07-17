# A Booklet
Thing = require 'models/Thing'

module.exports = class Booklet extends Thing
  defaults:
    title: ''
    description: ''
    type: 'booklet'
    coverurl: ''
    columns: []

  idAttribute: '_id'


