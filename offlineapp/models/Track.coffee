# Track (from cache, no DB). Current (as file) has title, description and [mime] type. Attachment bytes probably not here.

module.exports = class Track extends Backbone.Model
  defaults:
    title: ''
    description: ''
    type: 'track'

