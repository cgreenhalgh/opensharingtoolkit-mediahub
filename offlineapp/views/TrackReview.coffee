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

  events:
    'click .rating': 'onClickRating'
    'click .do-save': 'onSave'
    'click .do-edit': 'onEdit'
    'click .do-cancel': 'onCancel'

  onClickRating: (ev) =>
    ev.preventDefault()
    if not @model.attributes.editing
      return false
    rating = 0
    if $(ev.target).hasClass 'rating1'
      rating = 1
    else if $(ev.target).hasClass 'rating2'
      rating = 2
    if $(ev.target).hasClass 'rating3'
      rating = 3
    if $(ev.target).hasClass 'rating4'
      rating = 4
    if $(ev.target).hasClass 'rating5'
      rating = 5
    console.log "rating #{rating}"
    @model.set rating: rating

  onSave: (ev) =>
    comment = $('textarea[name=comment]', @$el).val()
    console.log "save, comment=#{comment}"
    ev.preventDefault()
    @model.set comment: comment, editing: false
    try 
      @model.save()
    catch err
      console.log "error saving review: #{err.message}"

  onEdit: (ev) =>
    console.log 'edit'
    ev.preventDefault()
    @model.set editing:true

  onCancel: (ev) =>
    console.log 'cancel'
    ev.preventDefault()
    try
      @model.fetch()
    catch err
      console.log "error cancelling review edit: #{err.message}"

