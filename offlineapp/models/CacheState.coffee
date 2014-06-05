# Appcache status (singleton, no DB)
module.exports = class OfflineState extends Backbone.Model
  defaults:
    state: 0
    message: 'This page is not saved; you will need Internet access to view it again'
    bookmark: true
    alertType: ''
    updateReady: false

