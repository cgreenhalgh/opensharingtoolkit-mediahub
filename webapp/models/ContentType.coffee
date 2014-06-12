# A ContentType
module.exports = class ContentType extends Backbone.Model
  defaults:
    title: ''
    description: ''

  createView: ()->
