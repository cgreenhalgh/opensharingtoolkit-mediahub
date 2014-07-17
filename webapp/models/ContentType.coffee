# A ContentType - internal; not a Thing
module.exports = class ContentType extends Backbone.Model
  defaults:
    title: ''
    description: ''

  createView: ()->
