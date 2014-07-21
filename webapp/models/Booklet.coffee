# A Booklet
Thing = require 'models/Thing'

module.exports = class Booklet extends Thing
  defaults:
    title: ''
    description: ''
    type: 'booklet'
    content: ''
    #coverurl: '' -> image?!

  idAttribute: '_id'


