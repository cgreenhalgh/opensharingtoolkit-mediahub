# Track Review (offline) View

templateTrackReview = require 'templates/TrackReview'

module.exports = class TrackReviewView extends Backbone.View

  tagName: 'div'
  className: 'column small-12 large-12'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateTrackReview d

  render: =>
    @$el.html @template @model.attributes
    @

