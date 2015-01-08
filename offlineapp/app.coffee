# offline app - for App

require 'version'
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
UnlockNumberView = require 'views/UnlockNumber'
UnlockView = require 'views/Unlock'

localdb = require 'localdb'
formdb = require 'formdb'
working = require 'working'
location = require 'location'

#config = window.mediahubconfig

appid = null
exported = 'false'
dburl = null
appconfig = null
loadsInProgress = 0
startLoad = () ->
  loadsInProgress++
endLoad = () ->
  loadsInProgress--
  if loadsInProgress==0
    console.log "loading complete"
    if currentView? and currentView.isUnlock and currentView.model.attributes.loading
      console.log "Re-check code..."
      window.router.unlock currentView.model.attributes.type, currentView.model.attributes.code

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
    "unlockNumber": "unlockNumber"
    "unlockArtcode": "unlockArtcode"
    "unlock/:type/:code": "unlock"

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

  unlockNumber: () ->
    @setCurrentView new UnlockNumberView model: (new Backbone.Model _id: '_unlockNumber')

  unlockArtcode: () ->
    # TODO

  unlock: (type, code) ->
    # check current things
    for id,item of items
      if item.attributes.unlockCodes?
        for unlockCode in item.attributes.unlockCodes 
          if unlockCode.type==type and unlockCode.code==code
            console.log "unlock #{item.id} by #{type} = #{code}"
            # TODO unlock
            return window.router.navigate "#thing/#{item.id}", {trigger: true, replace: true}
          #else
          #  console.log "code mismatch for #{item.id}, #{unlockCode.type} = #{unlockCode.code} vs #{type} = #{code}"
    if loadsInProgress==0
      @setCurrentView new UnlockView model: 
        (new Backbone.Model { _id: type+':'+code, type:type, code:code, message:"Sorry, that code didn't do anything" })
    else
      @setCurrentView new UnlockView model: 
        (new Backbone.Model { _id: type+':'+code, type:type, code:code, loading:true })

makeThing = (data, collection, thingIds) ->
  try
    thing = new Backbone.Model data
    if data.thingIds?
      console.log "create new thing collection for #{thing.id}"
      thing.things = new Backbone.Collection()
      loadThings data,thing.things
    if thing.id
      items[thing.id] = thing
      if currentView? and currentView.isMissing and currentView.model.id == thing.id
        console.log "Loaded missing thing #{thing.id}"
        try
          if currentView.page?
            cpage = currentView.page
            canchor = currentView.anchor
            window.router.thing thing.id        
            window.router.bookletPage thing.id, cpage, canchor
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
      if data.locked? and data.locked!=0 and data.unlockCodes?
        for unlockCode in data.unlockCodes when unlockCode.code? and unlockCode.code!=''
          if unlockCode.type=='number'
            $('#unlockNumber').removeClass 'hide'
          else if unlockCode.type=='artcode'
            $('#unlockArtcode').removeClass 'hide'
          else
            console.log "unknown unlockCode type #{unlockCode.type}"
    else
      console.log "unknown item type #{data.type} - ignored"
  catch err
    console.log "error parsing thing: #{err.message}: #{data}"

loadThing = (thingId,collection,thingIds) ->
  if exported=='true'
    thingId = encodeURIComponent thingId
  console.log "load thing #{thingId}"
  startLoad()
  $.ajax dburl+"/"+encodeURIComponent(thingId),
    success: (data)->
      checkThing data, collection, thingIds
      endLoad()
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get thing error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkThing xhr.responseText, collection, thingIds
      endLoad()

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
    $('#showUser').toggleClass 'hide', appconfig.showUser==false
    formdb.getFormUploadState().set 'requiresUser', appconfig.showUser!=false
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
  $('#unlockNumber').addClass 'hide'
  $('#unlockArtcode').addClass 'hide'
  topLevelThings.reset()
  startLoad()
  $.ajax dburl+"/"+encodeURIComponent(appid),
    success: (data) -> 
      checkConfig(data)
      endLoad()
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get client config error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkConfig xhr.responseText
      else
        working.error 'Sorry, could not load initial information - please try reloading this app'
      endLoad()

App = 
  init: ->

    startLoad()

    $('body').append templateApp {} 
    # (re)init foundation
    setTimeout (()->$(document).foundation()), 0
    # fix for off-screen menu size - https://github.com/zurb/foundation/issues/3800
    $('a.left-off-canvas-toggle').click () ->
      $('.inner-wrap').css('min-height', $(window).height()+'px')

    appid = $('meta[name="mediahub-appid"]').attr('content')
    exported = $('meta[name="mediahub-exported"]').attr('content')
    wordpressfiles = $('meta[name="wototo-wordpress-files"]').attr('content')
    wordpressajax = $('meta[name="wototo-wordpress-ajax"]').attr('content')
    console.log "OfflineApp starting... app.id=#{appid}, exported=#{exported}, wordpressfile=#{wordpressfiles}, wordpressajax=#{wordpressajax}"
    window.geticonurl = ( iconfile ) ->
      if wordpressfiles
        wordpressfiles+'/icons/'+iconfile
      else
        '../../icons/'+iconfile
    window.getasseturl = ( assetfile ) ->
      if wordpressfiles
        wordpressfiles+'/'+assetfile
      else
        '../../'+assetfile

    # presume index is served by couchdb .../_design/app/_show/...
    dburl = window.location.href
    if wordpressajax?
      dburl = wordpressajax+'?action=wototo_get_json&id='
    else if dburl.indexOf('/_design/')>=0
      dburl = dburl.substring 0,dburl.indexOf('/_design/')

    $(document).on 'click', 'a', (ev) ->
      url = $(ev.currentTarget).attr 'href'
      if ev.isDefaultPrevented()
        console.log "Ignore click (default prevented) for url #{url}"
        return
      if $(ev.currentTarget).hasClass 'prevent-default'
        console.log "Ignore click (.prevent-default) for url #{url}"
        ev.preventDefault()
        return
      if not url?
        console.log "Ignore click on undefined url (target url #{$(ev.target).attr 'href'})"
        ev.preventDefault()
        return
      if url.charAt(0)=='#'
        console.log "Local url #{url}"
        router.navigate url, trigger:true
        return
      # links out
      if exported == 'true'
        # redirector - see exportapp
        reurl = dburl+'/re.php?url='
        console.log "using external link redirect #{reurl}"
        if (appmodel.get 'trackLinks')
          if (url.indexOf ':')>=0 or (url.indexOf '//')==0
            url2 = reurl+encodeURIComponent(url)
            console.log "track link out to #{url} -> #{url2}"
            target = $(ev.currentTarget).attr 'target'
            ev.preventDefault()
            window.open url2, (target ? '_self')
          else
            console.log "no track local(?) link #{url}"
        else
          console.log "not tracking - link #{url}"

    if wordpressajax?
      # wordpress ajax - call ajax url with action 'wototo_get_json' and id
      $.ajaxPrefilter ( options ) ->
        if options.url? and options.url.indexOf(dburl)==0
          oldurl = options.url
          six = options.url.lastIndexOf '/'
          id = options.url.substring (six+1)
          options.url = wordpressajax+'?action=wototo_get_json&id='+id
          console.log "rewrite ajax #{oldurl} to #{options.url}"
        else if options.url?
          console.log "unchanged ajax url #{options.url}"
        null

    else if exported == 'true'
     # hack - leaflets map tile load doesn't get picked up here
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

    endLoad()

module.exports = App

