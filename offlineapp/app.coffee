# offline app - for App

appcache = require 'appcache'
HomeView = require 'views/Home'
CacheStateWidgetView = require 'views/CacheStateWidget'

BookletCoverView = require 'views/BookletCover'
BookletView = require 'views/Booklet'

localdb = require 'localdb'

#config = window.mediahubconfig

appid = null
itemViews = []
dburl = null

items = {}
currentView = null

class Router extends Backbone.Router
  routes: 
    "" : "entries"
    "#" : "entries"
    "booklet/:id": "booklet"
    "booklet/:id/:page": "bookletPage"
    "booklet/:id/:page/": "bookletPage"
    "booklet/:id/:page/:anchor": "bookletPage"

  removeCurrentView: ->
    if currentView?
      try 
        currentView.remove()
      catch err
        console.log "error removing current view: #{err.message}"
      currentView = null

  entries: ->
    console.log "router: entries"
    @removeCurrentView()
    $('#home').show()
    # TODO

  booklet: (id) ->
    console.log "show booklet #{id}"
    @removeCurrentView()
    $('#home').hide()
    booklet = items[id]
    if not booklet?
      alert "Sorry, could not find booklet #{id}"
      @navigate '#', { trigger:true, replace:true }
      return false

    currentView = new BookletView model: booklet
    $('body').append currentView.el
    true

  bookletPage: (id,page,anchor) ->
    if not currentView? or currentView.model.id != id
      if not @booklet id
        return
    currentView.showPage page,anchor

makeBooklet = (data) ->
  try
    booklet = new Backbone.Model data
    if booklet.id
      items[booklet.id] = booklet
    view = new BookletCoverView model:booklet
    itemViews.push view
    $('#home').append view.el
  catch err
    console.log "error making booklet: #{err.message}: #{data}"

checkThing = (app, data) ->
  #if instanceid isnt localdb.currentInstanceid()
  #  console.log "Ignore item on load; old instanceid #{instanceid} vs #{localdb.currentInstanceid()}"
  #  return
  try 
    data = JSON.parse data
    if data.type=='booklet'
      makeBooklet data
    else
      console.log "unknown item type #{data.type} - ignored"
  catch err
    console.log "error parsing thing: #{err.message}: #{data}"

loadThing = (app,thingId) ->
  console.log "load thing #{thingId}"
  $.ajax dburl+"/"+thingId,
    success: (data)->
      checkThing app, data
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get thing error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkThing app, xhr.responseText

loadThings = (app) ->
  for thingId in app.thingIds
    # id, url, type
    loadThing app,thingId

checkConfig = (app) ->
  console.log  "config(app): "+app 
  try 
    app = JSON.parse app
    loadThings app
  catch err
    console.log "error parsing app config: #{err.message}: #{app} - #{err.stack}"

refresh = ()->
  console.log "refresh #{dburl} #{appid}"
  oldItemViews = itemViews
  itemViews = []
  for itemView in oldItemViews
    itemView.remove()
  $.ajax dburl+"/"+appid,
    success: checkConfig
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get client config error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkConfig xhr.responseText

App = 
  init: ->

    $.ajaxSetup beforeSend: (xhr, options) ->
      # TODO cache redirect?
      console.log "beforeSend #{options.type} #{options.url}"
      true

    home = new HomeView model:{}
    home.el.id = 'home'
    $('body').append home.el

    appid = $('meta[name="mediahub-appid"]').attr('content')
    console.log "OfflineApp starting... app.id=#{appid}"
    # presume index is served by couchdb .../_design/app/_show/...
    dburl = location.href
    if dburl.indexOf('/_design/')>=0
      dburl = dburl.substring 0,dburl.indexOf('/_design/')
    appcacheWidget = new CacheStateWidgetView model: appcache.state
    $('#home').append appcacheWidget.el

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
    window.router = router
    
    path = window.location.pathname
    ix = path.lastIndexOf '/'
    if ix>=0
      path = path.substring 0,(ix+1)
    if not Backbone.history.start( root:path )
      console.log "invalid initial route"
      router.navigate '#', trigger:true

    appcache.onUpdate () ->
      refresh dburl,appid
    refresh dburl,appid

module.exports = App

