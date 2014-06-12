# main internal url router

ContentTypeList = require 'models/ContentTypeList'
ContentTypeListView = require 'views/ContentTypeList'
db = require 'mydb'
plugins = require 'plugins'

# for registration of plugins
require 'plugins/Track'

config = window.mediahubconfig

tempViews = []

class Router extends Backbone.Router
  routes: 
    "" : "entries"
    "ContentType/:type" : "contentType"
    "ContentType/:type/:action/:id" : "contentTypeAction"

  entries: ->
    console.log "router: entries"
    @removeTempViews()
    $('body .top-level-view').hide()
    $('body .content-type-list').show()

  removeTempViews: () ->
    console.log "removeTempViews (#{tempViews.length})"
    while tempViews.length>0
      view = tempViews.splice(0,1)[0]
      view.remove()

  contentType: (type) ->
    contentType = plugins.getContentType type
    if not contentType?
      console.log "Error: could not find ContentType #{type}"
      return
    console.log "show ContentType #{type}..."
    $('body .top-level-view').hide()
    @removeTempViews()
    if not contentType.view?
      contentType.view = contentType.createView()
      $('body').append contentType.view.el
    else
      $('body').append contentType.view.$el.show()
          
  contentTypeAction: (type,action,id) ->
    console.log 
    contentType = plugins.getContentType type
    if not contentType?
      console.log "Error: could not find ContentType #{type}"
      return
    console.log "consoleTypeAction #{type} #{action} #{id}"

    # bootstrap??
    @contentType(type)

    $('body .top-level-view').hide()
    @removeTempViews()
    view = contentType.createActionView(action,id)
    if view?
      view.render()
      $('body').append view.el
      tempViews.push view

# debug
$( document ).ajaxError ( event, jqxhr, settings, exception ) ->
  console.log "ajaxError #{exception}"

App = 
  init: ->
    console.log "App starting..."

    # backbonetest - based on 
    # http://adamjspooner.github.io/coffeescript-meet-backbonejs/05/docs/script.html

    # this does produce an error callback, but I don't seem to get anything from BackbonePouch
    #db.info (err, info) ->
    #  if err?
    #    console.log "database error #{err}"
    #  else
    #    console.log "database info #{info}"

    # Having problems (401 on http://127.0.0.1:5984/mydb/_temp_view?include_docs=true)
    # when using non-admin user. 
    Backbone.sync =  BackbonePouch.sync
      db: db
      error: (err)->
          console.log "ERROR (sync): #{err}"
      options:
        error: (err)->
          console.log "ERROR (sync/options): #{err}"

    Backbone.Model.prototype.idAttribute = '_id'
    _.extend Backbone.Model.prototype, BackbonePouch.attachments()

    contentTypes = new ContentTypeList()
    plugins.forEachContentType (ct,name) ->
      contentTypes.add ct
    contentTypesView = new ContentTypeListView model:contentTypes
    contentTypesView.render()
    $('body').append contentTypesView.el

    # in-app virtual pages
    router = new Router
    window.router = router
    
    Backbone.history.start()

module.exports = App
