# App edit View
ListEditView = require 'views/ListEdit'
templateAppEdit = require 'templates/AppEdit'
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

module.exports = class AppEditView extends ListEditView

  template: (d) =>
    templateAppEdit d

  formToModel: () =>
    super()

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"
    "click .do-update": "update"

  update: (ev) =>
    ev.preventDefault()
    console.log "Update app for download..."
    @formToModel()
    items = []
    # add itself?!
    items.push { type: @model.attributes.type, id: @model.id, url: config.dburl+"/"+encodeURIComponent(@model.id) }
    files = []
    thingIds = @model.attributes.thingIds
    @checkThings thingIds, items, files    

  addUrl: (files,url,title) ->
    if url? and url!=''
      # mime type? (not actually used, happily)
      files.push 
        url: url
        title: title

  addHtml: (files,html) ->
    # images in html
    if html?
      srcs = /<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/g
      while m = ( srcs.exec html ) 
        src = m[1]
        if src.length>0
          files.push {
            url: src
            title: 'img'
          }

  checkThings: (thingIds, items, files) =>
    while thingIds.length > 0
      thingId = (thingIds.splice 0,1)[0]
      console.log "update for thing #{thingId}..."
      thing = allthings.get().get thingId
      if not thing? 
        console.log "- could not find #{thingId}"
      else
        item = { type: thing.attributes.type, id: thing.id, url: config.dburl+"/"+encodeURIComponent(thingId) }
        items.push item
        console.log "thing: #{JSON.stringify thing.attributes}"
        # files, etc.
        # cover image
        @addUrl files, thing.attributes.coverurl, 'cover'
        @addHtml files, thing.attributes.content
        if thing.attributes.type=='place' and thing.attributes.lat? and thing.attributes.lon?
          @addPlace files, thing.attributes.lat, thing.attributes.lon, thing.attributes.zoom
        
    console.log "Checked all things, found #{items.length} items and #{files.length} files"
    @model.set { items: items, files: files }
    
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
            s = subdomains[Math.abs(x + y) % subdomains.length]
            url = mapUrl.replace( '{s}', s ).replace( '{z}', z ).replace( '{x}',x ).replace( '{y}', y )    
            files.push { url: url, title: 'map tile' } 


