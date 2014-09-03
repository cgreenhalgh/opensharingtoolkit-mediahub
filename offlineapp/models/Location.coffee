# Location  status (local, non-persistent, singleton)
module.exports = class Location extends Backbone.Model
  defaults:
    showLocation: false
    searching: false
    lastFix: null
    lastFixTime: 0
    old: true
    requestRecent: true
    highAccuracy: true
    continuous: true
    showOnMap: true


