# offline app

appcache = require 'appcache'
CacheStateWidgetView = require 'views/CacheStateWidget'
Track = require 'models/Track'
TrackView = require 'views/Track'
TrackReview = require 'models/TrackReview'

localdb = require 'localdb'

#config = window.mediahubconfig

itemViews = []
dburl = null
clientid = null

class Router extends Backbone.Router
  routes: 
    "" : "entries"

  entries: ->
    console.log "router: entries"

checkTrack = (data) ->
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
      db: localdb.getdb()
    # might be in pouch from before
    try 
      track.trackReview.fetch()
    catch err
      console.log "error fetching review #{reviewid}: #{err.message}"
    trackView = new TrackView model:track
    itemViews.push trackView
    $('body').append trackView.el
  catch err
    console.log "error parsing track: #{err.message}: #{data}"


loadTrack = (item) ->
  console.log "load track #{item.id}"
  $.ajax dburl+"/"+item.id,
    success: checkTrack
    dataType: "text"
    error: (xhr,status,err) ->
      console.log "get track error "+xhr.status+": "+err.message
      # on android (at least) files from cache sometimes have status 0!!
      if xhr.status==0 && xhr.responseText
        checkTrack xhr.responseText

checkConfig = (data) ->
  console.log  "config: "+data 
  try 
    data = JSON.parse data
    # switch local db
    localdb.swapdb data
    for item in data.items
      # id, url, type
      if item.type=='track'
        loadTrack item
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

    appcache.onUpdate () ->
      refresh dburl,clientid
    refresh dburl,clientid

module.exports = App

