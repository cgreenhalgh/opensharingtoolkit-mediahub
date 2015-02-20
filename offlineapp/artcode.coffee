# artcodes...
module.exports.canScan = () ->
  return aestheticodes?

# default experience configuration
ARTCODES_SETTINGS = 
    		"op":"temp",
    		"id": "org.opensharingtoolkit.aestheticodes.dynamic",
    		"version": 1,
    		"name": "Aestheticodes/Wototo",
    		"minRegions": 4,
    		"maxRegions": 10,
    		"maxEmptyRegions": 0,
    		"maxRegionValue": 6,
    		"validationRegions": 0,
    		"validationRegionValue": 1,
    		"checksumModulo": 1,
    		"thresholdBehaviour": "temporalTile",
       	
ARTCODES_EXPERIENCE = JSON.stringify _.extend {}, ARTCODES_SETTINGS,
    		"markers": [
    			{
    				"code": "1:1:1:1:2",
    				"action": "http://www.opensharingtoolkit.org"
    			}
    		]

module.exports.scan = () ->
  if aestheticodes?
    console.log "try aestheticodes scanner..."+ARTCODES_EXPERIENCE
    # alert "scan..."
    aestheticodes.scan( ARTCODES_EXPERIENCE, (result) -> 
      console.log "artcode scan "+result
      router.navigate "#unlock/artcode/#{encodeURIComponent result}", trigger:true
    , (error) ->
      console.log "artcode scan error "+error
    )

items = {}
module.exports.setItems = (i) ->
  items = i

module.exports.getExperienceDataUrl = () ->
  experience = _.extend {}, ARTCODES_SETTINGS
  experience.markers = []
  base = location.href
  if base.indexOf('#')>=0
    base = base.substring 0,base.indexOf('#')
  #for id,item of items
  #  if item.attributes.unlockCodes?
  #    for unlockCode in item.attributes.unlockCodes 
  #      if unlockCode.type=='artcode'
  #        experience.markers.push 
  #          code: unlockCode.code
  #          action: "#{base}#unlock/artcode/#{encodeURIComponent unlockCode.code}"
  experience.defaultAction = "#{base}#unlock/artcode/$marker"
  json = JSON.stringify experience
  b64 = Base64.btoa (Base64.utob json)
  return 'x-artcode-data:'+b64

