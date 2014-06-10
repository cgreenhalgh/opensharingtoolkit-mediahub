# Track Review (offline) View

templateTrackReviewInList = require 'templates/TrackReviewInList'

module.exports = class TrackReviewInListView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateTrackReviewInList d

  render: =>
    @$el.html @template @model.attributes
    @

