# server app
server = require 'server'
db = require 'serverdb'

FormList = require 'models/FormList'
FormListView = require 'views/FormList'
FormView = require 'views/Form'

forms = new FormList()
formsView = null
currentView = null

class Router extends Backbone.Router
  routes: 
    "" : "forms"
    "Form/:formid" : "form"

  clear: () ->
    if formsView
      formsView.$el.addClass 'hide'
    if currentView
      currentView.remove()
      currentView = null

  forms: () ->
    console.log "Router: forms"
    @clear()
    if not formsView
      formsView = new FormListView model: forms
      $('body').append formsView.el
    formsView.$el.removeClass 'hide'

  form: (formid) ->
    console.log "Router: form/#{formid}"
    @clear()
    form = forms.get formid
    if not form
      return alert "Could not find form #{formid}"
    currentView = new FormView model: form
    $('body').append currentView.el    

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

