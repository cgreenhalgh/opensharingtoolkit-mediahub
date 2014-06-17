# A Booklet
module.exports = class Booklet extends Backbone.Model
  defaults:
    title: ''
    description: ''
    type: 'booklet'
    coverurl: ''
    columns: []
