# utils
console.log "hello utils"
https = require 'https'
http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse

module.exports.get_file_extension = get_file_extension = (url) ->
  ix = url.lastIndexOf '/'
  if ix<0
    ix = 0
  ix2 = url.lastIndexOf '.'
  if ix2<ix or ix2==url.length-1
    null
  else
    url.substring (ix2+1)

module.exports.checkMimetype = checkMimetype = (surl, fn) ->
  url = parse_url surl
  protocol = url.protocol ? 'http'
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'HEAD'
  console.log "head #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      console.log "Error checking file #{surl}, response #{res.statusCode}"
      return fn res.statusCode
    type = res.headers['content-type']
    res.on 'data',(data)->
      # ignore
    res.on 'end',()->
      console.log "mimetype for #{surl} = #{type}"
      ix = type?.indexOf ';'
      if ix>=0
        type = type.substring 0,ix
      fn null, type

  req.on 'error',(e) ->
    console.log "Error checking file #{surl}: #{e}"
    fn e
  req.end()

module.exports.readJson = readJson = (surl,fn) ->
  url = parse_url surl
  protocol = url.protocol ? 'http'
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'GET'
  console.log "get #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      console.log "Error getting file #{surl}, response #{res.statusCode}"
      return fn res.statusCode
    type = res.headers['content-type']
    body = []
    res.on 'data',(data) ->
      body.push data

    res.on 'end',() ->
      try
        body = body.concat()
        json = JSON.parse body
      catch err
        console.log "Error parsing file #{surl}: #{err.message}: #{body}"
        fn err
      fn null, json 

  req.on 'error',(e) ->
    console.log "Error getting file #{surl}: #{e}"
    fn e
  req.end()

module.exports.guessMimetype = guessMimetype = (url, fn) ->
  #console.log "guess mimetype of #{url}"
  ix = url.lastIndexOf '.'
  if ix>=0 and ix>(url.lastIndexOf '/')
    ext = url.substring (ix+1)
    if ext=='jpg' or ext=='jpeg' or ext=='jpe'
      return fn 'image/jpeg'
    if ext=='png'
      return fn 'image/png'
    if ext=='html' or ext=='htm'
      return fn 'text/html'
    if ext=='mp3'
      return fn 'audio/mpeg'
    if ext=='ogg'
      return fn 'audio/ogg'
  console.log "unknown mimetype for #{url} - try head"
  checkMimetype url, (err,type) ->
    if err?
      console.log "Unknown mimetype for #{url}"
      return fn 'application/unknown'
    fn type


