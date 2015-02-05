# location
Location = require 'models/Location'

location = new Location
  requestRecent: true
  highAccuracy: true
  continuous: true
  showOnMap: true
  #showLocation: false
  #searching: false
  #lastFix: null
  #lastFixTime: 0
  #old: true
  places: new Backbone.Collection()

console.log "localStorage requestRecent=#{window.localStorage?.getItem 'requestRecent'}"

if (window.localStorage?.getItem 'requestRecent')=='false'
  location.set requestRecent: false
if (window.localStorage?.getItem 'highAccuracy')=='false'
  location.set highAccuracy: false
if (window.localStorage?.getItem 'continuous')=='false'
  location.set continuous: false
if (window.localStorage?.getItem 'showOnMap')=='false'
  location.set showOnMap: false

module.exports.getLocation = () ->
  location

timeout = (10*60*1000)
watchId = null
options = {}
SHORT_MAXIMUM_AGE = 5*1000
LONG_MAXIMUM_AGE = (5*60*1000)
oldTimeout = null

clear = () ->
  if watchId?
    navigator.geolocation?.clearWatch watchId
    watchId = null
    location.set searching: false

positionOld = () ->
  console.log "position old"
  location.set old:true
  oldTimeout = null
  updateMarkers()

resetOldTimer = () ->
  if oldTimeout?
    clearTimeout oldTimeout
  maximumAge = if location.attributes.requestRecent then SHORT_MAXIMUM_AGE else LONG_MAXIMUM_AGE
  oldTimeout = setTimeout positionOld, maximumAge+1000

positionSuccess = (position) ->
  fix = 
    latitude: position.coords?.latitude
    longitude: position.coords?.longitude
    altitude: position.coords?.altitude
    accuracy: position.coords?.accuracy
    altitudeAccuracy: position.coords?.altitudeAccuracy
    heading: position.coords?.heading
    speed: position.coords?.speed
    gpstime: position.timestamp
    localtime: new Date().getTime()
  fix.gpsdate = new Date(fix.gpstime).toISOString()
  fix.localdate = new Date(fix.localtime).toISOString()

  console.log "position success: #{JSON.stringify fix}"
  # GPS timestamps??!
  location.set 
    lastFix: fix
    lastFixTime: lastResult: "position success: #{JSON.stringify position}"
    lastFixTime: fix.localtime
    old: false
    lastResult: "position success: #{JSON.stringify fix}"

  updateNavStates fix
  updateMarkers()

  resetOldTimer()
  if not location.attributes.continuous
    clear()

positionError = (error) ->
  console.log "position error: #{error.code} #{error.message}"
  location.set lastResult: "position error: #{error.code} #{error.message}"
  if not location.attributes.continuous
    clear()

update = (oneshot) ->
  resetOldTimer()
  if location.attributes.continuous or watchId or oneshot
    # is or should be...
    maximumAge = if location.attributes.requestRecent then SHORT_MAXIMUM_AGE else LONG_MAXIMUM_AGE
    if watchId && (options.enableHighAccuracy != location.attributes.highAccuracy or options.maximumAge != maximumAge)
      console.log "cancel/restart watch on config change"
      clear()
    if not watchId?
      options = 
        maximumAge: maximumAge
        enableHighAccuracy: location.attributes.highAccuracy
      console.log "start geo watch conintuous=#{location.attributes.continuous}, options=#{JSON.stringify options}"
      watchId = navigator.geolocation?.watchPosition positionSuccess, positionError, options
      if not watchId?
        console.log "Unable to start navigator.geolocation.watchPosition - unsupported?"
      else
        location.set searching: true
  else
    clear()

location.on 'change:showLocation', (model,value) ->
  console.log "showLocation: #{value}"
  update()

persist = (name,value) ->
  try
    window.localStorage.setItem name, (if value then 'true' else 'false')
    console.log "#{name} changed to #{value}"
  catch err
    console.log "Error saving #{name} '#{value}' to localStorage: #{err.message}"

location.on 'change:requestRecent', (model,value) ->
  persist 'requestRecent', value
  update()

location.on 'change:highAccuracy', (model,value) ->
  persist 'highAccuracy', value
  update()

location.on 'change:continuous', (model,value) ->
  persist 'continuous', value
  if value
    # start?
    update()
  else
    clear()

module.exports.refresh = refresh = () ->
  console.log "Location refresh..."
  clear()
  update(true)

module.exports.touchWidget = () ->
  if not location.attributes.continuous and not location.attributes.searching and (not location.attributes.lastFix? or location.attributes.old)
    console.log "touch -> refresh for geo widget"
    refresh()
  else
    console.log "touch (location) -> nearby"
    window.router.navigate "#nearby", trigger:true

# show location on map (leaflet)
currentMap = null
mapMarkers = []

module.exports.clearCurrentMap = clearCurrentMap = () ->
  console.log "clearCurrentMap"
  for m in mapMarkers
    currentMap?.removeLayer m
  mapMarkers = []
  currentMap = null

updateMarkers = () ->
  if currentMap and location.attributes.showOnMap and location.attributes.lastFix
    pos = L.latLng( location.attributes.lastFix.latitude, location.attributes.lastFix.longitude )
    if mapMarkers.length==0
      console.log "add map markers at #{pos}"
      m = L.circle pos, (location.attributes.lastFix.accuracy ? 5),
        color: '#8af'
        opacity: if location.attributes.old then 0.3 else 0.5
        fillOpacity: if location.attributes.old then 0.1 else 0.3
        weight: 3
      m.addTo currentMap
      mapMarkers.push m
      m = L.circleMarker pos, 
        radius: 4
        color: if location.attributes.old then '#02b' else '#03f'
        opacity: 0.4
        fillOpacity: 0.8
        weight: 1
      m.addTo currentMap
      mapMarkers.push m
    else 
      console.log "update map markers"
      for m in mapMarkers
        m.setLatLng pos
      mapMarkers[0].setStyle
        opacity: if location.attributes.old then 0.3 else 0.5
        fillOpacity: if location.attributes.old then 0.1 else 0.3
      mapMarkers[1].setStyle
        color: if location.attributes.old then '#02b' else '#03f'

  else if mapMarkers.length>0
    console.log "remove map markers"
    for m in mapMarkers
      currentMap?.removeLayer m
    mapMarkers = []

module.exports.setCurrentMap = (map) ->
  console.log "setCurrentMap"
  if currentMap?
    clearCurrentMap()
  currentMap = map
  # show?
  updateMarkers()

location.on 'change:showOnMap', (model,value) ->
  persist 'showOnMap', value
  updateMarkers()

# Navigation / Nearby Places

class NavState extends Backbone.Model
  defaults:
    distanceText: '---'
    bearingText: '---'
    #placeId: ''
    #lat:
    #lon:
    #zoom:
    #geojson:

navStates = {}

module.exports.getNavState = ( model ) ->
  if navStates[model.id]?
    return navStates[model.id]
  navState = new NavState 
    id:model.id
    _id:model.id
    placeId: model.id
    lat: model.attributes.lat
    lon: model.attributes.lon
    zoom: model.attributes.zoom
    geojson: model.attributes.geojson
  navStates[model.id] = navState
  if location.attributes.lastFix?
    updateNavState navState, location.attributes.lastFix
  navState

# http://www.movable-type.co.uk/scripts/latlong.html
distance = (lat1, lon1, lat2, lon2) ->
  R = 6371000.0
  r1 = lat1*Math.PI/180.0
  r2 = lat2*Math.PI/180.0
  dr = (lat2-lat1)*Math.PI/180.0
  dl = (lon2-lon1)*Math.PI/180.0
  a = Math.sin(dr/2) * Math.sin(dr/2) + Math.cos(r1) * Math.cos(r2) * Math.sin(dl/2) * Math.sin(dl/2)
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  #console.log('distance '+lat1+','+lon1+' - '+lat2+','+lon2+', R*c='+R*c)
  R * c

initialBearing = (lat1, lon1, lat2, lon2) ->
  r1 = lat1*Math.PI/180.0
  r2 = lat2*Math.PI/180.0
  dl = (lon2-lon1)*Math.PI/180.0
  # see http://mathforum.org/library/drmath/view/55417.html
  y = Math.sin(dl) * Math.cos(r2)
  x = Math.cos(r1)*Math.sin(r2) - Math.sin(r1)*Math.cos(r2)*Math.cos(dl)
  theta = Math.atan2(y, x);
  theta = (theta*180/Math.PI)
  theta - 360*Math.floor(theta/360)

getDistanceText = ( d )->
  suffix = 'm'
  if d>=1000
    d /= 1000
    suffix = 'km'
  Number(d).toPrecision(2)+suffix

bearings = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']

getBearingText = ( b )->
  dir = Math.floor( (b-360*Math.floor(b/360))*16/360 + 0.5) % 16
  bearings[dir]

updateNavStates = ( fix ) ->
  for id,navState of navStates
    updateNavState navState, fix

updateNavState = ( navState, fix ) ->
  if navState.attributes.lat? and navState.attributes.lon? and fix.latitude and fix.longitude
    d = distance fix.latitude, fix.longitude, navState.attributes.lat, navState.attributes.lon
    b = initialBearing fix.latitude, fix.longitude, navState.attributes.lat, navState.attributes.lon
    console.log "Update NavState #{navState.id} distance #{d} (#{getDistanceText d}), bearing #{b} (#{getBearingText b})"
    navState.set
      distance: d
      distanceText: getDistanceText d
      bearing: b
      bearingText: getBearingText b
      hasFix: true

  else 
    console.log "no nav info for #{navState.id} vs fix #{fix}"
    navState.set hasFix: false

