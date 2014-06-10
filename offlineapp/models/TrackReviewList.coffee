# set of TrackReview(s)
TrackReview = require('models/TrackReview')

module.exports = class TrackReviewList extends Backbone.Collection

  model: TrackReview

  # NB fetch: query requires databse admin privileges. Listen requires query.
  pouch: 
    fetch: 'query' 
    options:
      listen: false
      allDocs:
        include_docs: true
      query: 
        include_docs: true,
        fun: 
          map: (doc) ->
            if doc._id.indexOf('trackreview:') == 0
              emit doc._id, null
      changes: 
        include_docs: true,
        filter: (doc) ->
          doc._deleted || doc._id.indexOf('trackreview:')==0

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'

