# app update for export
plugins = require 'plugins'
server = require 'server'
allthings = require 'allthings'

config = window.mediahubconfig

# TODO align with offlineapp/views/Place
maxZoom = 19 # max on OSM??
defaultZoom = 16
maxZoomIn = 2
maxZoomOut = 5

# http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
# Math.floor...
lon2tile = (lon,zoom) -> 
  (lon+180)/360*Math.pow(2,zoom)
# Math.floor...
lat2tile = (lat,zoom)  -> 
  (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)


addUrl = (files,url,title) ->
    if url? and url!=''
      # mime type? (not actually used, happily)
      file = 
        url: url
        title: title
      files[file.url] = file

addHtml = (files,html) ->
    # images in html
    if html?
      srcs = /<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/g
      while m = ( srcs.exec html ) 
        src = m[1]
        if src.length>0
          src = src.replace /[&]amp[;]/g, '&'
          file = 
            url: src
            title: 'img'
          files[file.url] = file

addFile = (files, thing) ->
     if thing.attributes.fileType?
       # check actual attachment?
       file = 
         url: config.dburl+"/"+thing.id+"/bytes"
         type: thing.get 'fileType'
         title: thing.get 'title'
       files[file.url] = file

addServer = (servers, appserver) ->
  if not servers[appserver.id]
    submissionurl = appserver.attributes.submissionurl
    if not submissionurl
      submissionurl = "#{config.submissionurl}/#{encodeURIComponent appserver.id}"
      console.log "using default submissionurl #{submissionurl} for server #{appserver.id}"
    else
      console.log "using explicit submissionurl #{submissionurl} for server #{appserver.id}"
    servers[appserver.id] = 
      id: appserver.id
      submissionurl: submissionurl

checkThings = (model, thingIds, items, files, servers) ->
    while thingIds.length > 0
      thingId = (thingIds.splice 0,1)[0]
      console.log "update for thing #{thingId}..."
      thing = allthings.get().get thingId
      if not thing? 
        console.log "- could not find #{thingId}"
      else
        item = { type: thing.attributes.type, id: thing.id, url: config.dburl+"/"+encodeURIComponent(thingId) }
        items[item.url] =  item
        console.log "thing: #{JSON.stringify thing.attributes}"
        # files, etc.
        # cover image
        addUrl files, thing.attributes.coverurl, 'cover'
        addUrl files, thing.attributes.iconurl, 'icon'
        addUrl files, thing.attributes.mapiconurl, 'mapicon'
        addUrl files, thing.attributes.imageurl, 'image'
        addHtml files, thing.attributes.content
        addHtml files, thing.attributes.html
        addHtml files, thing.attributes.description
        if thing.attributes.type=='place' and thing.attributes.lat? and thing.attributes.lon?
          addPlace files, thing.attributes.lat, thing.attributes.lon, thing.attributes.zoom
        if thing.attributes.thingIds
          for t in thing.attributes.thingIds
            thingIds.push t
        if thing.attributes.serverId
          console.log "Found serverId #{thing.attributes.serverId}"
          thingIds.push thing.attributes.serverId
          appserver = allthings.get().get thing.attributes.serverId
          if appserver
            addServer servers, appserver
          else
            console.log "Error: could not find server #{thing.attributes.serverId}"
        if thing.attributes.type == 'file'
          addFile files, thing

    items = for url,item of items
      item
    files = for url,file of files
      file
    servers = for id,appserver of servers
      appserver
    console.log "Checked all things, found #{items.length} items, #{files.length} files and #{servers.length} servers"
    model.set { items: items, files: files, servers: servers }
    
  addPlace: (files, lat, lon, zoom) ->
    console.log "add place #{lat},#{lon},#{zoom}"
    if not zoom?
      zoom = defaultZoom
    if zoom>maxZoom
      zoom = maxZoom
    # OSM: http://{s}.tile.osm.org/{z}/{x}/{y}.png
    mapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
    # see https://github.com/Leaflet/Leaflet/blob/master/src/layer/tile/TileLayer.js
    subdomains = ['a','b','c']
    latTile0 = lat2tile lat, 0
    lonTile0 = lon2tile lon, 0
    console.log "-> #{latTile0},#{lonTile0}"
    # delta at zoom, scaled by larger image (up to 400px vs tile 256px)
    # range = 0.5*1/Math.pow(2,zoom)*400/256
    mzoom = zoom+maxZoomIn
    minZoom = zoom-maxZoomOut
    if mzoom > maxZoom
      mzoom = maxZoom
    tileRange = 0.5*400/256
    xmax = 1
    for z in [0..mzoom]
      #tileRange = tileRange/2
      y1 = Math.max 0, (Math.floor latTile0-tileRange)
      y2 = Math.min (xmax-1), (Math.floor latTile0+tileRange)
      x1 = Math.max 0, (Math.floor lonTile0-tileRange)
      x2 = Math.min (xmax-1), (Math.floor lonTile0+tileRange)
      xmax = xmax*2
      latTile0 = latTile0*2
      lonTile0 = lonTile0*2
      console.log "tiles zoom #{z} (0-#{xmax-1}) #{x1}:#{x2}, #{y1}:#{y2}"
      if z>=minZoom
        for x in [x1..x2]
          for y in [y1..y2]
            url = mapUrl.replace( '{s}', s ).replace( '{z}', z ).replace( '{x}',x ).replace( '{y}', y )    
            file = { url: url, title: 'map tile' } 
            files[file.url] = file

update = (model) ->
    console.log "Update app #{model.id} for download..."
    items = {}
    files = {}
    servers = {}
    # clone!
    thingIds = [model.id]
    checkThings model, thingIds, items, files, servers    

module.exports.updateApp = updateApp = (id, cb) ->
  model = plugins.getContentType('app')?.getThings()?.get id
  if not model
    console.log "Could not find app #{id}"
    return cb "Could not find app #{id}"
  server.working "updating app #{id}"
  try 
    update model
  catch err
    return server.error model, "Error updating app #{id}: #{err.message}"
  if false==model.save null, {
      success: () -> 
        server.success()
        if cb
          cb()
      error: (model,resp,options) ->
        server.error model,resp,options
        if cb
          cb "Error saving updated model"
    }
    server.error model,"Save validation error (save updated app #{id})"
    cb "Error saving updated model (validation)"

module.exports.updateKiosk = (id, cb) ->
  model = plugins.getContentType('kiosk')?.getThings()?.get id
  if not model
    console.log "Could not find kiosk #{id}"
    return cb "Could not find kiosk #{id}"
  # apps in thingIds ?!
  appIds = []
  for thingId in (model.attributes.thingIds ? [])
    if thingId.indexOf('app:')==0
      appIds.push thingId
  checkApp = () ->
    if appIds.length==0
      if cb
        cb()
    else
      appId = (appIds.splice 0,1)[0]
      updateApp appId, checkApp
  checkApp()

