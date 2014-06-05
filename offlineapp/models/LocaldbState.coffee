# Localdb status (persisted locally only, ID should be local pouchdb name)
module.exports = class LocaldbState extends Backbone.Model
  defaults:
    hasLocalChanges: false
    type: 'LocaldbState'
    isCurrent: false

  idAttribute: '_id'


