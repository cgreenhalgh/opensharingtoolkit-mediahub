# Track Review (local DB, initially). Needs trackid, clientid

localdb = require 'localdb'

module.exports = class TrackReview extends Backbone.Model
  defaults:
    rating: 0
    comment: ''
    editing: true

  idAttribute: '_id'

  sync: BackbonePouch.sync
    db: localdb.db
  
