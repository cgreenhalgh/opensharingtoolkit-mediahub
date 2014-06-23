# PlaceEdit View
templatePlaceEdit = require 'templates/PlaceEdit'
ThingEditView = require 'views/ThingEdit'

module.exports = class PlaceEditView extends ThingEditView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templatePlaceEdit d

  render: =>
    super()
    f = () =>
      mapEl = $('.map',@$el).get 0
      @map = L.map(mapEl).setView [@model.attributes.lat, @model.attributes.lon], @model.attributes.zoom
      # E.g. OSM
      layer = L.tileLayer 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',  
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        maxZoom: 17
        keyboard: false # buggy release focus?!
      layer.addTo @map
      @marker = L.marker [@model.attributes.lat, @model.attributes.lon]
      @marker.addTo @map

      @map.on 'mousedown', ()=>
        console.log "try to focus map"
        $(mapEl).focus()

      @map.on 'click', (ev) =>
        console.log "clicked the map at " + String(ev.latlng.lat) + "," + String(ev.latlng.lng)
        @marker.setLatLng ev.latlng
        $('input[name=lat]', @$el).val Number(ev.latlng.lat).toFixed(6)
        $('input[name=lon]', @$el).val Number(ev.latlng.lng).toFixed(6)
        $('input[name=zoom]', @$el).val String(@map.getZoom())

      console.log "(hopefully) created map" 
    # TODO update map?
    if @map
      try
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    setTimeout f,0

  formToModel: () =>
    imageurl = $('.image-image', @$el).attr 'src'
    iconurl = $('.image-icon', @$el).attr 'src'
    address = $('input[name=address]', @$el).val()
    lat = $('input[name=lat]', @$el).val()
    try 
      lat = Number(lat)
    catch err
      console.log "Error in lat as Number: #{lat} #{err.message}"
    lon = $('input[name=lon]', @$el).val()
    try 
      lon = Number(lon)
    catch err
      console.log "Error in lon as Number: #{lon} #{err.message}"
    console.log "imageurl = #{imageurl}, iconurl = #{iconurl}, address=#{address}, lat=#{lat}, lon=#{lon}"
    @model.set 
      imageurl: imageurl
      iconurl: iconurl
      address: address
      lat: lat
      lon: lon
    if @map?
      zoom = @map.getZoom()
      if zoom?
        console.log "zoom = #{zoom}"
        @model.set zoom: zoom
    super()

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-save": "save"
    "click .do-select-image": "selectPlaceImage"
    "click .do-select-icon": "selectIcon"
    "click .do-lookup-address": "lookupAddress"
    "click .do-show-latlon": "showLatlon"

  selectPlaceImage: (ev) =>
    selectImage ev,'.image-image'

  selectIcon: (ev) =>
    selectImage ev,'.image-icon'

  lookupAddress: (ev) =>
    ev.preventDefault()
    # TODO

  showLatlon: (ev) =>
    ev.preventDefault()
    lat = $('input[name=lat]', @$el).val()
    try 
      lat = Number(lat)
    catch err
      console.log "Error in lat as Number: #{lat} #{err.message}"
    lon = $('input[name=lon]', @$el).val()
    try 
      lon = Number(lon)
    catch err
      console.log "Error in lon as Number: #{lon} #{err.message}"
    zoom = $('input[name=zoom]', @$el).val()
    try 
      zoom = Number(zoom)
    catch err
      console.log "Error in zoom as Number: #{zoom} #{err.message}"
    if @map?
      @map.setView [lat, lon], zoom

  remove: () =>
    if @map
      try
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    super()

