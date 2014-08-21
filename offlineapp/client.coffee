# offline app - configured by "Client" object/document
# currently for historical / code interest - not working/up-to-date

appcache = require 'appcache'
HomeView = require 'views/Home'
CacheStateWidgetView = require 'views/CacheStateWidget'
Track = require 'models/Track'
TrackView = require 'views/Track'
TrackReview = require 'models/TrackReview'
TrackReviewList = require 'models/TrackReviewList'
LocaldbStateListView = require 'views/LocaldbStateList'
SyncState = require 'models/SyncState'
SyncStateWidgetView = require 'views/SyncStateWidget'

BookletCoverView = require 'views/BookletCover'
BookletView = require 'views/Booklet'

localdb = require 'localdb'

#config = window.mediahubconfig

itemViews = []
dburl = null
clientid = null
syncState = new SyncState()

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

makeTrack = (data) ->
  try
    data.url = dburl+"/"+data._id+"/bytes"
    track = new Track data
    if track.id
      items[track.id] = track

    trackid = if data._id.indexOf(':')>=0 then data._id.substring(data._id.indexOf(':')+1) else data._id
    cid = if clientid.indexOf(':')>=0 then clientid.substring(clientid.indexOf(':')+1) else clientid
    reviewid = 'trackreview:'+trackid+':'+cid
    console.log "add track #{data._id} review #{reviewid}"
    track.trackReview = new TrackReview {_id:reviewid, trackid:data._id, clientid:clientid}
    track.trackReview.sync = BackbonePouch.sync
      db: localdb.currentdb()
    # might be in pouch from before
    try 
      track.trackReview.fetch()
    catch err
      console.log "error fetching review #{reviewid}: #{err.message}"

    # TODO: filter by track
    track.trackReviewList = new TrackReviewList()
    track.trackReviewList.sync = BackbonePouch.sync
      db: localdb.currentdb()
    try 
      track.trackReviewList.fetch()
    catch err
      console.log "error fetching trackreviews: #{err.message}"

    trackView = new TrackView model:track
    itemViews.push trackView
    $('#home').append trackView.el
  catch err
    console.log "error making track: #{err.message}: #{data}"


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

checkItem = (instanceid, item, data) ->
  if instanceid isnt localdb.currentInstanceid()
    console.log "Ignore item on load; old instanceid #{instanceid} vs #{localdb.currentInstanceid()}"
    return
  console.log "#{item.type}: #{data}"
  try 
    data = JSON.parse data
    if item.type=='track'
      makeTrack data
    else if item.type=='booklet'
      makeBooklet data
    else
      console.log "unknown item type #{item.type} - ignored"
  catch err
    console.log "error parsing item: #{err.message}: #{data}"

loadItem = (instanceid,item) ->
  console.log "load track #{item.id}"
  $.ajax dburl+"/"+item.id,
    success: (data)->
      checkItem instanceid, item, data
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get track error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkItem instanceid, item, xhr.responseText

loadItems = (instanceid, data) ->
  for item in data.items
    # id, url, type
    if item.type?
      loadItem instanceid,item

checkConfig = (data) ->
  console.log  "config: "+data 
  try 
    data = JSON.parse data
    # switch local db
    instanceid = data._id+':'+data._rev
    localdb.swapdb dburl, data
    # wait for localdb sync
    $('#home').append '<p id="syncing">synchronizing</p>'
    syncState.doSync (success) ->
      if success
        $('#syncing').remove()
        loadItems instanceid, data
      else
        console.log "Error doing initial synchronization"
        $('#home').replace '<p id="syncing">Error doing initial synchronization - try reloading this page</p>'

  catch err
    console.log "error parsing client config: #{err.message}: #{data} - #{err.stack}"

refresh = ()->
  console.log "refresh #{dburl} #{clientid}"
  oldItemViews = itemViews
  itemViews = []
  for itemView in oldItemViews
    itemView.remove()
  $.ajax dburl+"/"+clientid,
    success: checkConfig
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get client config error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkConfig xhr.responseText

App = 
  init: ->

    home = new HomeView model:{}
    home.el.id = 'home'
    $('body').append home.el

    clientid = $('meta[name="mediahub-clientid"]').attr('content')
    console.log "OfflineApp starting... clientid=#{clientid}"
    # presume index is served by couchdb .../_design/app/_show/...
    dburl = location.href
    if dburl.indexOf('/_design/')>=0
      dburl = dburl.substring 0,dburl.indexOf('/_design/')
    appcacheWidget = new CacheStateWidgetView model: appcache.state
    $('#home').append appcacheWidget.el

    localdbStateListView = new LocaldbStateListView model: localdb.localdbStateList
    $('#home').append localdbStateListView.el

    syncStateWidgetView = new SyncStateWidgetView model: syncState
    $('#home').append syncStateWidgetView.el   

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

    # wait for localdb initialisation
    $('#home').append '<p id="initialising">initialising</p>'

    localdb.init ()->
      $('#initialising').remove()
      appcache.onUpdate () ->
        refresh dburl,clientid
      refresh dburl,clientid

module.exports = App

