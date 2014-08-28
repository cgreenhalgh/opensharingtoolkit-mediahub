# server app
server = require 'server'
db = require 'serverdb'

HomeView = require 'views/Home'
MakeFilterView = require 'views/MakeFilter'
DataTableView = require 'views/DataTable'

currentView = null

class Router extends Backbone.Router
  routes: 
    "" : "home"
    "makefilter" : "makefilter"
    "datatable/:view/" : "datatable"
    "datatable/:view/:key1" : "datatable"
    "datatable/:view/:key1/:key2" : "datatable"
    "datatable/:view/:key1/:key2/:key3" : "datatable"

  clear: () ->
    if currentView
      currentView.remove()
      currentView = null

  setCurrentView: (view) ->
    @clear()
    currentView = view
    if not view.el?
      view.render()
    $('body').append view.el

  home: () ->
    console.log "Router: home"
    @setCurrentView new HomeView model: (new Backbone.Model {})

  makefilter: () ->
    console.log "Router: makefilter"
    @setCurrentView new MakeFilterView model: (new Backbone.Model {})

  datatable: (view, key1, key2, key3) ->
    console.log "Router: datatable #{view} [ #{key1} #{key2} #{key3} ]"
    key = [].concat (if key1 then [key1] else []), (if key2 then [key2] else []), (if key3 then [key3] else [])
    @setCurrentView new DataTableView model: (new Backbone.Model { view: view, key: key })

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

    # in-app virtual pages
    router = new Router
    window.router = router
    Backbone.history.start()

module.exports = App

