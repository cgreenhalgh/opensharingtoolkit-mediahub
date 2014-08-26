# server app
server = require 'server'

class Router extends Backbone.Router
  routes: 
    "" : "forms"

  forms: () ->
    # TODO

App = 
  init: ->
    console.log "Server app starting..."
    server.working 'starting up'

    Backbone.Model.prototype.idAttribute = '_id'
    _.extend Backbone.Model.prototype, BackbonePouch.attachments()

    # in-app virtual pages
    router = new Router
    window.router = router
    
    Backbone.history.start()
    server.success null,null,{}

module.exports = App

