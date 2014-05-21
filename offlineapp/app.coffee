# offline app

appcache = require 'appcache'
CacheStateWidgetView = require 'views/CacheStateWidget'

#db = require 'mydb'

#config = window.mediahubconfig

class Router extends Backbone.Router
  routes: 
    "" : "entries"

  entries: ->
    console.log "router: entries"

App = 
  init: ->
    console.log "OfflineApp starting..."

    appcacheWidget = new CacheStateWidgetView model: appcache.state
    $('body').append appcacheWidget.el

    #Backbone.sync =  BackbonePouch.sync
    #  db: db
    #  error: (err)->
    #      console.log "ERROR (sync): #{err}"
    #  options:
    #    error: (err)->
    #      console.log "ERROR (sync/options): #{err}"

    Backbone.Model.prototype.idAttribute = '_id'
    _.extend Backbone.Model.prototype, BackbonePouch.attachments()

    # in-app virtual pages
    router = new Router
    #window.router = router
    
    Backbone.history.start()

module.exports = App

