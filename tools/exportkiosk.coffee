# exportapp.coffee
https = require 'https'
http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse
resolve_url = (require 'url').resolve
eco = require 'eco'
_ = require 'underscore'

utils = require './utils'

templateAtomfile = fs.readFileSync __dirname+"/templates/atomfile.eco", "utf-8"
templateCampaign = fs.readFileSync __dirname+"/templates/campaign.eco", "utf-8"
templateEntry = fs.readFileSync __dirname+"/templates/entry.eco", "utf-8"

if process.argv.length!=4 
  utils.logError 'usage: coffee exportkiosk.coffee <KIOSK-URL> <PUBLIC-DIR-URL>', 2
  utils.exit()

kioskurl = process.argv[2]
publicurl = process.argv[3]

ix = kioskurl.lastIndexOf '/'
if ix<0
  utils.logError "Could not find / in kioskurl #{kioskurl}", 2
  utils.exit()
couchurl = kioskurl.substring 0,(ix+1)
console.log "couchdb = #{couchurl}"
utils.setCouchurl couchurl
pathprefix = ''

console.log 'exportkiosk '+kioskurl+' as '+publicurl

readJson = utils.readJson

guessMimetype = utils.guessMimetype

readJson kioskurl, (err,kiosk) ->
  if err?
    utils.logError "Error reading kiosk config #{kioskurl}: #{err}"
    utils.exit()
  console.log "Read kiosk config #{JSON.stringify kiosk}"
  if not kiosk.atomfilename? or kiosk.atomfilename==''
    kiosk.atomfilename = "default.xml"
  # recursively fetch all things
  thingIds = kiosk.thingIds.concat []
  urls = []
  exports = []
  images = []
  getThings = (things,fn) ->
    if thingIds.length==0
      return fn null,things
    thingId = (thingIds.splice 0,1)[0]
    url = couchurl+thingId
    readJson url,(err,data) ->
      if err?
        console.log "Error reading thing #{url}: #{err}"
        return fn err
      things[thingId] = data
      # URLs -> mimetypes?
      if data.externalurl? and data.externalurl!='' and !data.hasFile and urls.indexOf(data.externalurl)<0
        urls.push data.externalurl
      # local files
      if data.type=='file' and data.hasFile
        exports.push data
      else if data.type=='app' and not data.externalurl
        exports.push data
      if data.imageurl and data.imageurl.indexOf('../../../../')==0
        images.push data
      return getThings things,fn

  guessMimetypes = (mimetypes,fn) ->
    if urls.length==0
      return fn null, mimetypes
    url = (urls.splice 0,1)[0]
    aurl = resolve_url couchurl, url
    if aurl!=url
      console.log "resolve #{url} -> #{aurl}"
    guessMimetype aurl,(type) ->
      mimetypes[url] = type
      guessMimetypes mimetypes,fn

  fixImages = (mimetypes, fn) ->
    if images.length==0
      return fn mimetypes
    thing = (images.splice 0,1)[0]
    if thing.imageurl and thing.imageurl.indexOf('../../../../')==0
      url = "#{couchurl}#{thing.imageurl.substring 12}"
      utils.cacheFile url, (err,path) ->
        if err
          utils.logError "Error cacheing image #{url}: #{err}"
        else
          console.log "Exported image #{url} as #{path}"
          # NB relative to top-level 
          thing.imageurl = path
          type = utils.mimetypeFromExtension path
          if type
            mimetypes[thing.imageurl] = type
        fixImages mimetypes,fn
    else
      fixImages mimetypes,fn

  exportThings = (fn) ->
    if exports.length==0
      return fn null
    thing = (exports.splice 0,1)[0]
    if thing.type=='file'
      url = couchurl+encodeURIComponent( thing._id )+"/bytes"
      utils.cacheFile url, (err,path) ->
        if err
          utils.logError "Error exporting file #{url}: #{err}"
        else
          console.log "Exported file #{url} as #{path}"
          thing.externalurl = path
        exportThings fn
    else if thing.type=='app'
      appurl = "#{couchurl}_design/app/_show/app/#{thing._id}"
      console.log "Export app #{appurl}..."
      utils.exec "/usr/local/bin/coffee", ["#{__dirname}/exportapp.coffee",appurl], (err,res) ->
        if err
          utils.logError "Error exporting app #{appurl}: #{err}"
        else
          thing.externalurl = "_design/app/_show/app/#{thing._id}.html"
          console.log "Exported app #{appurl} as #{thing.externalurl}"
        exportThings fn
    else
      exportThings fn

  writeAtomfile = (things, mimetypes) ->
    if not kiosk.externalurl
      kiosk.externalurl = publicurl
    out = eco.render templateAtomfile, 
      _.extend {}, kiosk, 
        things: things
        templateCampaign: (campaign) -> 
          @safe eco.render templateCampaign, campaign  
        templateEntry: (thing) -> 
          @safe eco.render templateEntry, _.extend thing, guessMimetype: (url)->mimetypes[url]  
    try 
      console.log "Write to #{kiosk.atomfilename}"
      fs.writeFileSync kiosk.atomfilename, out, encoding:'utf8'
    catch err
      utils.logError "Error writing to #{kiosk.atomfilename}: #{err.message}"

  getThings {}, (err,things)->
    if err?
      utils.logError "Error reading kiosk things: #{err}"
    fixImages {}, (mimetypes) ->
      guessMimetypes mimetypes, (err,mimetypes)->
        exportThings () ->
          writeAtomfile things, mimetypes
          utils.exit()

