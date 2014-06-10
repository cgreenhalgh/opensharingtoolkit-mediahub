# TrackReviewList View
TrackReview = require 'models/TrackReview'
TrackReviewInListView = require 'views/TrackReviewInList'
#templateLocaldbStateList = require 'templates/LocaldbStateList'

module.exports = class TrackReviewListView extends Backbone.View

  tagName: 'div'
  className: 'track-review-list column large-12 small-12'

  initialize: ->
    @listenTo @model, 'add', @add
    @listenTo @model, 'remove', @remove
    @render()

  template: (d) =>
    #templateLocaldbStateList d

  render: =>
    #@$el.html @template @model.attributes
    @$el.append '<h2>All Reviews</h2>'
    views = []
    @model.forEach @add
    @

  views: []

  add: (item) =>
    console.log "TrackReviewListView add #{item.id}"
    view = new TrackReviewInListView model: item
    # TODO add in order / filter
    @$el.append view.$el
    @views.push view
    
  remove: (item) =>
    console.log "TrackReviewListView remove #{item.id}"
    for view, i in @views when view.model.id == item.id
      console.log "remove view" 
      view.remove()
      @views.splice i,1
      return
    
