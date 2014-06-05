# Sync status (singleton, no DB)
module.exports = class SyncState extends Backbone.Model
  defaults:
    idle: true
    message: 'idle'

