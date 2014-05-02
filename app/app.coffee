# main internal url router

File = require 'models/File'
FileList = require 'models/FileList'
FileListView = require 'views/FileList'

class Router extends Backbone.Router
  routes: 
    "" : "entries"

  entries: ->
    console.log "router: entries"

App = 
  init: ->
    console.log "App starting..."

    # backbonetest - based on 
    # http://adamjspooner.github.io/coffeescript-meet-backbonejs/05/docs/script.html

    # backbone-pouch - see 

    Backbone.sync =  BackbonePouch.sync
      db: PouchDB('http://127.0.0.1:5984/mydb')
      fetch: 'query'
      listen: true

    Backbone.Model.prototype.idAttribute = '_id'
    _.extend Backbone.Model.prototype, BackbonePouch.attachments()

    files = new FileList()
    filesView = new FileListView model:files
    filesView.render()
    $('body').append filesView.el

    #files.reset files.to_json 
    files.fetch()

    # in-app virtual pages
    router = new Router
    #window.router = router
    
    Backbone.history.start()

module.exports = App
