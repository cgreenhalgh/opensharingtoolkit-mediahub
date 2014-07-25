# Place (offline) View
templatePlace = require 'templates/Place'

myIcon = L.icon
    iconUrl: '../../vendor/leaflet/images/my-icon.png'
    iconRetinaUrl: '../../vendor/leaflet/images/my-icon-2x.png'
    iconSize:    [25, 41]
    iconAnchor:  [12, 41]
    popupAnchor: [1, -34]
    shadowSize:  [41, 41]
    shadowUrl: '../../vendor/leaflet/images/marker-shadow.png'
    #shadowRetinaUrl: 'my-icon-shadow@2x.png'
    #shadowAnchor: [22, 94]

# TODO align with webapp/models/AppEdit
maxZoom = 19
maxZoomIn = 2
maxZoomOut = 5

module.exports = class PlaceView extends Backbone.View

  tagName: 'div'

  initialize: ->
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
      @map.on 'zoomend', () =>
        @map.setView [@model.attributes.lat, @model.attributes.lon]
        
      console.log "(hopefully) created map" 
      re = () => 
        if @map?
          console.log "invalidateSize"
          @map.invalidateSize()
      setTimeout re,1000
  
    if @map
      try
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    setTimeout f,0
    @

  remove: () =>
    if @map
      try
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    super()

