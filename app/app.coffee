# main internal url router

File = require 'models/File'
FileList = require 'models/FileList'
FileListView = require 'views/FileList'

config = window.mediahubconfig

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

    # Having problems (401 on http://127.0.0.1:5984/mydb/_temp_view?include_docs=true)
    # when using non-admin user. 
    Backbone.sync =  BackbonePouch.sync
      db: PouchDB(config.dburl) 
      fetch: 'query'
      listen: true
      error: (err)->
        console.log "ERROR (sync): #{err}"

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
