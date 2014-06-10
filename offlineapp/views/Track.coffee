# Track (offline) View

templateTrack = require 'templates/Track'
TrackReviewView = require 'views/TrackReview'
TrackReviewListView = require 'views/TrackReviewList'

module.exports = class TrackView extends Backbone.View

  tagName: 'div'
  className: 'row'

  initialize: ->
    @listenTo @model, 'change', @render
    # track review
    @trackReviewView = new TrackReviewView model:@model.trackReview
    @trackReviewListView = new TrackReviewListView model:@model.trackReviewList
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateTrack d

  render: =>
    @$el.html @template @model.attributes
    @$el.append @trackReviewView.el
    @$el.append @trackReviewListView.el
    @

  remove: ()->
    @trackReviewView.remove()
    @trackReviewListView.remove()
    super()
    
