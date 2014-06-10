# offline app

appcache = require 'appcache'
CacheStateWidgetView = require 'views/CacheStateWidget'
Track = require 'models/Track'
TrackView = require 'views/Track'
TrackReview = require 'models/TrackReview'
TrackReviewList = require 'models/TrackReviewList'
LocaldbStateListView = require 'views/LocaldbStateList'
SyncState = require 'models/SyncState'
SyncStateWidgetView = require 'views/SyncStateWidget'

localdb = require 'localdb'

#config = window.mediahubconfig

itemViews = []
dburl = null
clientid = null
syncState = new SyncState()

class Router extends Backbone.Router
  routes: 
    "" : "entries"

  entries: ->
    console.log "router: entries"

checkTrack = (instanceid, data) ->
  if instanceid isnt localdb.currentInstanceid()
    console.log "Ignore track on load; old instanceid #{instanceid} vs #{localdb.currentInstanceid()}"
    return
  console.log "track: #{data}"
  try 
    data = JSON.parse data
    data.url = dburl+"/"+data._id+"/bytes"
    track = new Track data
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
    $('body').append trackView.el
  catch err
    console.log "error parsing track: #{err.message}: #{data}"


loadTrack = (instanceid,item) ->
  console.log "load track #{item.id}"
  $.ajax dburl+"/"+item.id,
    success: (data)->
      checkTrack instanceid, data
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get track error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkTrack instanceid, xhr.responseText

loadItems = (instanceid, data) ->
  for item in data.items
    # id, url, type
    if item.type=='track'
      loadTrack instanceid,item

checkConfig = (data) ->
  console.log  "config: "+data 
  try 
    data = JSON.parse data
    # switch local db
    instanceid = data._id+':'+data._rev
    localdb.swapdb dburl, data
    # wait for localdb sync
    $('body').append '<p id="syncing">synchronizing</p>'
    syncState.doSync (success) ->
      if success
        $('#syncing').remove()
        loadItems instanceid, data
      else
        console.log "Error doing initial synchronization"
        $('body').replace '<p id="syncing">Error doing initial synchronization - try reloading this page</p>'

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
    clientid = $('meta[name="mediahub-clientid"]').attr('content')
    console.log "OfflineApp starting... clientid=#{clientid}"
    # presume index is served by couchdb .../_design/app/_show/...
    dburl = location.href
    if dburl.indexOf('/_design/')>=0
      dburl = dburl.substring 0,dburl.indexOf('/_design/')
    appcacheWidget = new CacheStateWidgetView model: appcache.state
    $('body').append appcacheWidget.el

    localdbStateListView = new LocaldbStateListView model: localdb.localdbStateList
    $('body').append localdbStateListView.el

    syncStateWidgetView = new SyncStateWidgetView model: syncState
    $('body').append syncStateWidgetView.el   

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
    #window.router = router
    
    Backbone.history.start()

    # wait for localdb initialisation
    $('body').append '<p id="initialising">initialising</p>'

    localdb.init ()->
      $('#initialising').remove()
      appcache.onUpdate () ->
        refresh dburl,clientid
      refresh dburl,clientid

module.exports = App

