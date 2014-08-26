# server app
server = require 'server'
db = require 'serverdb'

FormList = require 'models/FormList'
FormListView = require 'views/FormList'

forms = new FormList()
formsView = null

class Router extends Backbone.Router
  routes: 
    "" : "forms"

  forms: () ->
    console.log "Router: forms"
    if not formsView
      formsView = new FormListView model: forms
      $('body').append formsView.el
    formsView.$el.removeClass 'hide'

App = 
  init: ->
    console.log "Server app starting..."
    server.working 'starting up'

    Backbone.sync =  BackbonePouch.sync
      db: db
      error: (err)->
          console.log "ERROR (sync): #{err}"
      options:
        error: (err)->
          console.log "ERROR (sync/options): #{err}"

    Backbone.Model.prototype.idAttribute = '_id'
    _.extend Backbone.Model.prototype, BackbonePouch.attachments()

    server.success null,null,{}
    server.working 'fetch Forms'  

    forms.fetch
      success: () ->
        server.success()
        Backbone.history.start()
      error: (model,resp,options) ->
        server.error model, resp, options

    # in-app virtual pages
    router = new Router
    window.router = router
 
module.exports = App

