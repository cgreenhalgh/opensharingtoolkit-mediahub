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

if process.argv.length!=3 
  console.log 'usage: coffee exportkiosk.coffee <KIOSK-URL>'
  process.exit -1

kioskurl = process.argv[2]

ix = kioskurl.lastIndexOf '/'
if ix<0
  console.log "Could not find / in kioskurl #{kioskurl}"
  process.exit -1
couchurl = kioskurl.substring 0,(ix+1)
console.log "couchdb = #{couchurl}"
pathprefix = ''

console.log 'exportkiosk '+kioskurl

readJson = utils.readJson

guessMimetype = utils.guessMimetype

readJson kioskurl, (err,kiosk) ->
  if err?
    console.log "Error reading kiosk config #{err}"
    process.exit -1
  console.log "Read kiosk config #{JSON.stringify kiosk}"
  if not kiosk.atomfilename? or kiosk.atomfilename==''
    kiosk.atomfilename = "default.xml"
  # recursively fetch all things
  thingIds = kiosk.thingIds.concat []
  urls = []
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
      if data.imageurl? and data.imageurl!=''
        # fix relative?
        if data.imageurl.indexOf('../../../../')==0
          data.imageurl = data.imageurl.substring 12
        if urls.indexOf(data.imageurl)<0
          urls.push data.imageurl
      if data.externalurl? and data.externalurl!='' and !data.hasFile and urls.indexOf(data.externalurl)<0
        urls.push data.externalurl

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

  getThings {}, (err,things)->
    if err?
      console.log "Error reading kiosk things: #{err}"
      process.exit -1
    guessMimetypes {}, (err,mimetypes)->

      # TODO default externalurl
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
        console.log "Error writing to #{kiosk.atomfilename}: #{err.message}"
      process.exit -1

