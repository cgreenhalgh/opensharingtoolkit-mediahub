# Place (offline) View
templatePlace = require 'templates/Place'
location = require 'location'

myIcon = null
init = -> 
  if not myIcon?
   myIcon = L.icon
    iconUrl: window.getasseturl 'vendor/leaflet/images/my-icon.png'
    iconRetinaUrl: window.getasseturl 'vendor/leaflet/images/my-icon-2x.png'
    iconSize:    [25, 41]
    iconAnchor:  [12, 41]
    popupAnchor: [1, -34]
    shadowSize:  [41, 41]
    shadowUrl: window.getasseturl 'vendor/leaflet/images/marker-shadow.png'
    #shadowRetinaUrl: 'my-icon-shadow@2x.png'
    #shadowAnchor: [22, 94]

# NB align with webapp/updateapp.coffee
maxZoom = 19
maxZoomIn = 1
maxZoomOutTiles = 1
maxZoomOut = maxZoomOutTiles+7

# http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
# Math.floor...
lon2tile = (lon,zoom) -> 
  (lon+180)/360*Math.pow(2,zoom)
# Math.floor...
lat2tile = (lat,zoom)  -> 
  (1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)
tile2lon = (x,z) ->
  (x/Math.pow(2,z)*360-180)
tile2lat = (y,z) ->
  n=Math.PI-2*Math.PI*y/Math.pow(2,z)
  (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))))

# get lat/lon bounds for centre point and zoom, assuming 400px map with 256px tiles
getBounds = (lat, lon, zoom) ->
  xtile = lon2tile lon, zoom
  ytile = lat2tile lat, zoom
  mx = Math.pow 2, zoom
  dx = dy = 200/256
  L.latLngBounds [ [ (tile2lat (Math.max 0, ytile-dy), zoom), 
               (tile2lon (Math.max 0, xtile-dx), zoom) ],
             [ (tile2lat (Math.min mx, ytile+dy), zoom),
               (tile2lon (Math.min mx, xtile+dx), zoom) ] ]

module.exports = class PlaceView extends Backbone.View

  tagName: 'div'

  initialize: ->
    init()
    #@listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templatePlace d
 
  render: =>
    @$el.html @template @model.attributes
    f = () =>
      mapEl = $('.place-map',@$el).get 0
      options = 
        fadeAnimation: false
        dragging: false
        touchZoom: false
        tap: false
        keyboard: false # buggy release focus?!
      @map = L.map(mapEl, options).setView [@model.attributes.lat, @model.attributes.lon], @model.attributes.zoom
      # E.g. OSM
      mapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
      exported = $('meta[name="mediahub-exported"]').attr('content')
      if exported=='true'
        mapUrl = "../../../../appcache/{s}/tile/osm/org/{z}/{x}/{y}.png"
        console.log "Using export map url #{mapUrl}"
      layer = L.tileLayer mapUrl,  
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        maxZoom: Math.min(maxZoom, @model.attributes.zoom+maxZoomIn)
        minZoom: Math.max(0, @model.attributes.zoom-maxZoomOut)
      layer.addTo @map
      @marker = L.marker [@model.attributes.lat, @model.attributes.lon], { icon: myIcon }
      #@marker.bindPopup "Current Lat/Lon" 
      @marker.addTo @map
      # scope (zoomed out)
      bs = getBounds @model.attributes.lat, @model.attributes.lon, Math.max(0, @model.attributes.zoom-maxZoomOutTiles)
      console.log "map bounds = #{JSON.stringify bs}"
      bound = L.rectangle bs, { color:'#5f5', fill:false, weight:3 }
      bound.addTo @map
      @map.on 'zoomend', () =>
        @map.setView [@model.attributes.lat, @model.attributes.lon]
        
      console.log "(hopefully) created map" 
      re = () => 
        if @map?
          console.log "invalidateSize"
          @map.invalidateSize()
      setTimeout re,1000
      location.setCurrentMap @map
  
    if @map
      try
        location.clearCurrentMap()
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    setTimeout f,0
    @

  remove: () =>
    if @map
      try
        location.clearCurrentMap()
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    super()

