# Localdb status (persisted locally only, ID should be local pouchdb name)
module.exports = class LocaldbState extends Backbone.Model
  defaults:
    hasLocalChanges: false
    type: 'LocaldbState'
    isCurrent: false
    lastSeq: 0
    maxSeq: 0
    syncedSeq: 0

  idAttribute: '_id'


