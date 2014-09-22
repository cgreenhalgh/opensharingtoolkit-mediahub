# PlaceEdit View
templatePlaceEditTab = require 'templates/PlaceEditTab'
ThingEditView = require 'views/ThingEdit'

# geocode 
window.lastGeocodeCallback = 0
try
  geocoder = new google.maps.Geocoder()
catch err
  console.log "Warning: could not create geocoder - location lookup will not work!"

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

maxZoom = 19

module.exports = class PlaceEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'Place', template: templatePlaceEditTab } ]

  render: =>
    super()
    f = () =>
      mapEl = $('.map',@$el).get 0
      @map = L.map(mapEl).setView [@model.attributes.lat, @model.attributes.lon], @model.attributes.zoom
      # E.g. OSM
      layer = L.tileLayer 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',  
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        maxZoom: maxZoom
        keyboard: false # buggy release focus?!
      layer.addTo @map
      @marker = L.marker [@model.attributes.lat, @model.attributes.lon], { icon: myIcon }
      @marker.bindPopup "Current Lat/Lon" 
      @marker.addTo @map
      @addressMarkers = []

      #@map.on 'mousedown', ()=>
      #  console.log "try to focus map"
      #  $(mapEl).focus()

      @map.on 'click', (ev) =>
        console.log "clicked the map at " + String(ev.latlng.lat) + "," + String(ev.latlng.lng)
        lat = Number(ev.latlng.lat).toFixed(6)
        lon = Number(ev.latlng.lng).toFixed(6)
        if not @latlonPopup?
          @latlonPopup = L.popup()
        @latlonPopup.setLatLng(ev.latlng).setContent "#{lat},#{lon}<br/><a href='#' class='button tiny do-use-latlon' data-latlon='#{lat},#{lon}' >Use</a>"
        @latlonPopup.openOn(@map)

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
    mapiconurl = $('.image-mapicon', @$el).attr 'src'
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
    console.log "mapiconurl = #{mapiconurl}, address=#{address}, lat=#{lat}, lon=#{lon}"
    @model.set 
      mapiconurl: mapiconurl
      address: address
      lat: lat
      lon: lon
    if @map?
      zoom = @map.getZoom()
      if zoom?
        console.log "zoom = #{zoom}"
        @model.set zoom: zoom
    super()

  events: ->
    _.extend {}, super(),
      "click .do-select-mapicon": "selectMapicon"
      "click .do-lookup-address": "lookupAddress"
      "click .do-clear-map": "clearMap"
      "click .do-show-latlon": "showLatlon"
      "click .do-use-address": "useAddress"
      "click .do-use-latlon": "useLatlon"

  selectMapicon: (ev) =>
    @selectImage ev,'.image-mapicon'

  clearMap: (ev) =>
    console.log "clear map"
    ev.preventDefault()
    $('.do-clear-map', @$el).addClass 'disabled'
    for marker in @addressMarkers
      @map.removeLayer marker
    @addressMarkers = []

  lookupAddress: (ev) =>
    ev.preventDefault()
    address = $('input[name=address]', @$el).val().trim()
    if address.length==0
      console.log "lookupAddress with empty address"
      return

    @clearMap ev
    window.lastGeocodeCallback++
    geocodeCallback = window.lastGeocodeCallback
    console.log "lookupAddress #{address}... (request #{geocodeCallback})"
    $('.do-lookup-address', @$el).addClass 'disabled'
    
    if not geocode?
      return alert "Sorry - cannot look up addresses (may be due to an Internet connection problem; couldn't load geocoder library)"

    geocoder.geocode { 'address': address}, (results, status) =>
      if geocodeCallback != window.lastGeocodeCallback
        console.log "ignore old geocode response #{geocodeCallback}"
        return
      $('.do-lookup-address', @$el).removeClass 'disabled'
      $('.do-clear-map', @$el).removeClass 'disabled'
      console.log "geocode result #{status} #{results}"

      if status == google.maps.GeocoderStatus.OK
        #map.setCenter(results[0].geometry.location);
        #var marker = new google.maps.Marker( results[0].geometry.location
        bounds = null 
        for result, i in results
          try 
            marker = L.marker [result.geometry.location.lat(), result.geometry.location.lng()]
            if bounds?
              bounds.extend marker.getLatLng()
            else
              bounds = L.latLngBounds marker.getLatLng(), marker.getLatLng()
            marker.addTo @map
            console.log "added marker #{marker}"
            marker.bindPopup "#{result.formatted_address}<br/><a href='#' class='button tiny do-use-address' data-address-marker='#{i}' >Use</a>"
            @addressMarkers.push marker
            if i==0
              @useMarkerAddress marker
          catch err
            console.log "error adding marker #{i} for #{JSON.stringify result}: #{err.message}"
        if bounds?
          @map.fitBounds bounds
        $('.map',@$el).focus()
        if results.length == 0
          # TODO zurb alert/dialog
          alert "Sorry, did not get find any matching addresses"

      else 
        console.log "Geocode was not successful for the following reason: #{status}"
        # TODO zurb alert/dialog
        alert "Sorry, did not get find any matching addresses (#{status})"

  useAddress: (ev) =>
    ev.preventDefault()
    console.log "use address #{$(ev.target).attr 'data-address-marker'}"
    i = $(ev.target).attr 'data-address-marker'
    if i?
      i = Number(i)
    marker = @addressMarkers[i]
    if not marker?
      console.log "Could not find address marker #{i} - should have #{@addressMarker.length}"
      return
    marker.closePopup()
    useMarkerAddress marker
    @clearMap ev

  useMarkerAddress: (marker) =>
    latLng = marker.getLatLng()
    @marker.setLatLng latLng
    $('input[name=lat]', @$el).val Number(latLng.lat).toFixed(6)
    $('input[name=lon]', @$el).val Number(latLng.lng).toFixed(6)
    $('input[name=zoom]', @$el).val String(@map.getZoom())

  useLatlon: (ev) =>
    ev.preventDefault()
    console.log "use latlon #{$(ev.target).attr 'data-latlon'}"
    if @latlonPopup?
      @map.closePopup @latlonPopup
    latlon = $(ev.target).attr 'data-latlon'
    ll = latlon.split ','
    @marker.setLatLng [ll[0], ll[1]]
    $('input[name=lat]', @$el).val ll[0]
    $('input[name=lon]', @$el).val ll[1]
    $('input[name=zoom]', @$el).val String(@map.getZoom())
    
  showTab: (ev) =>
    # map is sulky if initially hidden
    super(ev)
    if @map
      f = () =>
        console.log "Map: invalidateSize"
        @map.invalidateSize()
      setTimeout f, 0

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
    # suppress geocode callback
    window.lastGeocodeCallback++
    if @map
      try
        @map.remove()
        @map = null
      catch err
        console.log "error removing place map: #{err.message}"
    super()

