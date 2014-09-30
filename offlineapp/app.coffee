# offline app - for App

appcache = require 'appcache'
templateApp = require 'templates/App'
HomeView = require 'views/Home'
CacheStateWidgetView = require 'views/CacheStateWidget'
FormUploadWidgetView = require 'views/FormUploadWidget'
LocationWidgetView = require 'views/LocationWidget'

BookletView = require 'views/Booklet'
ThingView = require 'views/Thing'
PlaceView = require 'views/Place'
HtmlView = require 'views/Html'
ListView = require 'views/List'
FormView = require 'views/Form'
UserView = require 'views/User'
MissingView = require 'views/Missing'

ThingListView = require 'views/ThingList'
FormUploadView = require 'views/FormUpload'
AboutView = require 'views/About'
ShareView = require 'views/Share'
LocationView = require 'views/Location'

localdb = require 'localdb'
formdb = require 'formdb'
working = require 'working'
location = require 'location'

#config = window.mediahubconfig

appid = null
exported = 'false'
dburl = null
appconfig = null

appmodel = new Backbone.Model {}

items = {}
currentView = null

topLevelThings = new Backbone.Collection()

class Router extends Backbone.Router
  routes: 
    "" : "entries"
    "#" : "entries"
    "thing/:id": "thing"
    "booklet/:id/:page": "bookletPage"
    "booklet/:id/:page/": "bookletPage"
    "booklet/:id/:page/:anchor": "bookletPage"
    "upload": "upload"
    "user": "user"
    "about": "about"
    "share": "share"
    "location": "location"

  removeCurrentView: ->
    if currentView?
      try 
        currentView.remove()
      catch err
        console.log "error removing current view: #{err.message}"
      currentView = null

  setCurrentView: (view) ->
    @removeCurrentView()
    currentView = view
    $('#page-content-holder').empty()
    if not view.el
      console.log "Error: new current view has no element - trying to render"
      view.render()
    $('#page-content-holder').append view.el
    if view.title
      $('#app-title').html view.title
    else if view.model?.attributes?.title
      $('#app-title').html view.model.attributes.title
    else if HomeView.prototype.isPrototypeOf view
      $('#app-title').html appconfig?.title ? 'Home'
    else
      $('#app-title').html 'Home'

  upload: () ->
    console.log "show upload"
    @setCurrentView new FormUploadView model: formdb.getFormUploadState()
    true

  entries: ->
    console.log "router: entries"
    @setCurrentView new HomeView model: topLevelThings, id: ''
    true

  thing: (id) ->
    console.log "show thing #{id}"
    thing = items[id]
    if not thing?
      console.log "could not find thing #{id}"
      @setCurrentView new MissingView model: (new Backbone.Model _id: id)
      return true
    
    if thing.attributes.type=='booklet'
      view = new BookletView model: thing
    else if thing.attributes.type=='place'
      view = new PlaceView model: thing
    else if thing.attributes.type=='html'
      view = new HtmlView model: thing
    else if thing.attributes.type=='form'
      view = new FormView model: thing
    else if thing.attributes.type=='list'
      view = new ListView model: thing
    else if thing.attributes.type?
      view = new ThingView model: thing
    else
      alert "Sorry, not sure how to display #{id}"
      @navigate '#', { trigger:true, replace:true }
      return false
 
    @setCurrentView view
    true

  bookletPage: (id,page,anchor) ->
    if not currentView? or currentView.model.id != id
      if not @thing id
        return
    currentView.showPage page,anchor

  user: () ->
    @setCurrentView new UserView model: (require 'user').getUser()

  about: () ->
    @setCurrentView new AboutView model: appmodel

  share: () ->
    @setCurrentView new ShareView model: appmodel

  location: () ->
    @setCurrentView new LocationView model: location.getLocation()

makeThing = (data, collection, thingIds) ->
  try
    thing = new Backbone.Model data
    if thing.id
      items[thing.id] = thing
      if currentView? and currentView.isMissing and currentView.model.id == thing.id
        console.log "Loaded missing thing #{thing.id}"
        try
          if currentView.page?
            window.router.bookletPage thing.id, currentView.page, currentView.anchor
          else
            window.router.thing thing.id        
        catch err
          console.log "error setting discovered thing: #{err.message} #{err.stacktrace}"
      # add in order of thingIds
      tix = thingIds.indexOf thing.id
      ix = 0
      for tid,i in thingIds when i<tix and ix<collection.length
        if (collection.at ix).id == tid
          ix++
      collection.add thing, at:ix
    if data.thingIds?
      console.log "create new thing collection for #{thing.id}"
      thing.things = new Backbone.Collection()
      loadThings data,thing.things
  catch err
    console.log "error making thing: #{err.message}: #{data}\n#{err.stack}"

checkThing = (data,collection,thingIds) ->
  #if instanceid isnt localdb.currentInstanceid()
  #  console.log "Ignore item on load; old instanceid #{instanceid} vs #{localdb.currentInstanceid()}"
  #  return
  try 
    data = JSON.parse data
    if data.type?
      makeThing data, collection, thingIds
    else
      console.log "unknown item type #{data.type} - ignored"
  catch err
    console.log "error parsing thing: #{err.message}: #{data}"

loadThing = (thingId,collection,thingIds) ->
  if exported=='true'
    thingId = encodeURIComponent thingId
  console.log "load thing #{thingId}"
  $.ajax dburl+"/"+encodeURIComponent(thingId),
    success: (data)->
      checkThing data, collection, thingIds
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get thing error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkThing xhr.responseText, collection, thingIds

loadThings = (app,collection) ->
  for thingId in app.thingIds
    # id, url, type
    loadThing thingId,collection,app.thingIds
  working.done()

checkConfig = (app) ->
  console.log  "config(app): "+app 
  try 
    appconfig = app = JSON.parse app
  catch err
    console.log "error parsing app config: #{err.message}: #{app} - #{err.stack}"
    working.error 'Sorry, could not load initial information - please try reloading this app'
  try 
    if currentView and HomeView.prototype.isPrototypeOf currentView
      $('#app-title').html (app.title ? 'Home') 
    appmodel.set appconfig
    $('#showUpload').toggleClass 'hide', not appconfig.serverId
    formdb.getFormUploadState().set 'serverId', (appconfig.serverId ? '')
    $('#showAbout').toggleClass 'hide', appconfig.showAbout!=true
    $('#showShare').toggleClass 'hide', appconfig.showShare!=true
    formdb.setApp app
    location.getLocation().set 'showLocation', appconfig.showLocation
    $('#showLocation').toggleClass 'hide', appconfig.showLocation!=true
    loadThings app,topLevelThings
  catch err
    console.log "error initialising app with new config: #{err.message}: #{JSON.stringify appconfig} - #{err.stack}"
    working.error 'Sorry, could not initialise app - please try reloading this app'

refresh = ()->
  console.log "refresh #{dburl} #{appid}"
  working.working 'refresh'
  topLevelThings.reset()
  $.ajax dburl+"/"+encodeURIComponent(appid),
    success: checkConfig
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get client config error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkConfig xhr.responseText
      else
        working.error 'Sorry, could not load initial information - please try reloading this app'

App = 
  init: ->

    $('body').append templateApp {} 
    # (re)init foundation
    setTimeout (()->$(document).foundation()), 0
    # fix for off-screen menu size - https://github.com/zurb/foundation/issues/3800
    $('a.left-off-canvas-toggle').click () ->
      $('.inner-wrap').css('min-height', $(window).height()+'px')

    appid = $('meta[name="mediahub-appid"]').attr('content')
    exported = $('meta[name="mediahub-exported"]').attr('content')
    console.log "OfflineApp starting... app.id=#{appid}, exported=#{exported}"

    # presume index is served by couchdb .../_design/app/_show/...
    dburl = window.location.href
    if dburl.indexOf('/_design/')>=0
      dburl = dburl.substring 0,dburl.indexOf('/_design/')

    # hack - leaflets map tile load doesn't get picked up here
    if exported == 'true'
      appid = encodeURIComponent appid
      console.log "exported: encoding appid -> #{appid}"
      $.ajaxSetup beforeSend: (xhr, options) ->
        # TODO cache redirect?
        if options.url? and options.url.indexOf(dburl)==0
          six = options.url.lastIndexOf '/'
          eix = options.url.lastIndexOf '.'
          if eix<0 or eix<six
            # no extension...
            console.log "exported, beforeSend #{options.type} #{options.url}, try .json"
            options.url = options.url+'.json'
        else if options.url?
          console.log "unchanged ajax url #{options.url}"
          
        true

    appcacheWidget = new CacheStateWidgetView model: appcache.state
    $('#appcache-status-holder').replaceWith appcacheWidget.el

    uploadWidget = new FormUploadWidgetView model: formdb.getFormUploadState()
    $('#upload-status-holder').replaceWith uploadWidget.el

    locationWidget = new LocationWidgetView model: location.getLocation()
    $('#location-status-holder').replaceWith locationWidget.el

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

    $('#loading-alert').hide()  

    #appcache.onUpdate () ->
    #  refresh dburl,appid
    refresh dburl,appid

module.exports = App

