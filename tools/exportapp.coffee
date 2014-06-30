# exportapp.coffee
https = require 'https'
http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse

if process.argv.length!=3 
  console.log 'usage: coffee exportapp.coffee <APP-URL>'
  process.exit -1

appurl = process.argv[2]

ix = appurl.indexOf '/_design/'
if ix<0
  console.log "Could not /_design/ in appurl #{appurl}"
  process.exit -1
couchurl = appurl.substring 0,(ix+1)
console.log "couchdb = #{couchurl}"

console.log 'exportapp '+appurl

get_file_extension = (url) ->
  ix = url.lastIndexOf '/'
  if ix<0
    ix = 0
  ix = url.lastIndexOf '.', ix
  if ix<0 or ix==url.length-1
    null
  else
    url.substring (ix+1)

get_filename_for_component = (h) ->
  if h=='' 
    return '_'
  h = encodeURIComponent h
  return h.replace("~","_")
  # is that enough??

# get local cache path for an URL - like java cacheing,
# maps domain name elements and path elements to folders
get_cache_path = (url) ->
  url = parse_url url
  # host, port, path (includes query), hash
  hs = if url.hostname? then url.hostname.split '.' else []
  # reverse non-IP order
  number = /^[0-9]+$/
  ns = 0
  for h in hs when number.test h
    ns++
  if ns != hs.length
    hs.reverse
  # normalise domain name to lower case
  hs = for h in hs
    String(h).toLowerCase()
  # ignore port for now!
  ps = if url.path? then url.path.split '/' else []
  # leading /?
  if ps.length>1 and ps[0]==''
    ps.shift()
  hs = ["cache"].concat hs,ps
  # make safe filenames
  hs = for h in hs
    get_filename_for_component h
  path = hs.join '/'
  return path

get_safe_path = (path) ->
  ps = if path? then path.split '/' else []
  # leading /?
  if ps.length>1 and ps[0]==''
    ps.shift()
  # make safe filenames
  ps = for p in ps
    get_filename_for_component p
  path = ps.join '/'
  return path

cacheFile = (surl,fn) ->
  path = surl
  if (path.indexOf couchurl)==0
    path = get_safe_path( path.substring couchurl.length )
  else
    path = get_cache_path surl

  url = parse_url surl
  protocol = url.protocol ? 'http'
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'GET'
  dir = path
  ix = dir.lastIndexOf '/'
  if ix>=0
    dir = dir.substring 0,ix
  else
    dir = ''
  ps = dir.split '/'
  d = ''
  if ps.length>1
    for i in [0..(ps.length-1)]
      d = d + (if i>0 then '/' else '') + ps[i]
      if !fs.existsSync(d)
        console.log "mkdir #{d}" 
        fs.mkdirSync d

  console.log "get #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      console.log "Error getting file #{surl}, response #{res.statusCode}"
      return fn res.statusCode
    # on success remove old file if present and link/rename new file
    lastmod = res.headers['last-modified']
    length = res.headers['content-length']
    type = res.headers['content-type']
    extension = get_file_extension path
    if not extension?
      # TODO file extension
      if (type.indexOf 'image/')==0
        path = path+'.'+type.substring(6)
      else if (type.indexOf 'audio/')==0
        path = path+'.'+type.substring(6)
      else if (type.indexOf 'text/html')==0
        path = path+'.html'
      else if (type.indexOf 'text/cache-manifest')==0
        path = path+'.appcache'
      else if (type.indexOf 'application/javascript')==0
        path = path+'.json'
      else
        console.log "Missing extension for #{path} type #{type}"
    tmppath = dir + (if dir!='' then '/' else '') + '.cb_download'
    try 
      fd = fs.openSync(tmppath, 'w')
    catch e
      console.log "Could not create tmpfile #{tmppath}: #{e}"
      return fn e      
        
    count = 0;

    res.on 'data',(data) ->
      if count < 0
        return
      #console.log "got #{data.length} bytes for #{file.url}"
      try 
        fs.writeSync(fd, data, 0, data.length)
        count += data.length
      catch e
        console.log "Error writing data chunk to #{tmppath}: #{e}"
        count = -1

    res.on 'end',() ->
      fs.closeSync(fd)
      if count < 0
        return fn 'error reading data'
      if count < length 
        console.log "Warning: read #{count}/#{length} bytes for #{surl} - discarding"
        try
          fs.unlinkSync tmppath
        catch e
          ; # ignore
        return fn ("read #{count}/#{length}")

      console.log "OK: read #{count} bytes"
      try
        # remove old old file if present
        fs.unlinkSync path
      catch e
        ;# ignore
      try
        fs.renameSync tmppath,path
        # done!
      catch e
        console.log "Error renaming new cache file #{tmppath} to #{path}: #{e}"
        fn 'error renaming new cache file'
      console.log "Downloaded #{surl} -> #{path} (#{length} bytes, #{type})"
      fn null, path
  req.on 'error',(e) ->
    console.log "Error getting file #{surl}: #{e}"
    fn e
  req.end()

readTextFile = (surl,fn) ->
  url = parse_url surl
  protocol = url.protocol ? 'http'
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'GET'
  #console.log "get #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      console.log 'Error getting '+surl+', response '+res.statusCode
      fn res.statusCode
    body = ''  
    res.on 'data',(data) ->
      body = body+data
    res.on 'end',() ->
      console.log "Read #{surl}, #{body.length} chars"
      fn null,body
  req.on 'error',(e) ->
    console.log 'Error getting '+surl+': '+e
    fn e
  req.end()

fix_relative_url = (url,path) ->
  if path.indexOf( 'http:' ) ==0 or path.indexOf( 'https:' ) == 0 
    return path

  hi = url.indexOf '//'
  if hi>=0  
    pi = url.indexOf '/',hi+2
    if pi<0
      pi = url.length
      url = url+'/'
  else
    pi = 0
    console.log "warning: url without host: #{url}"
    return path

  fi = url.lastIndexOf '/'
  url = url.substring 0,fi+1

  while path.indexOf( '../' ) == 0
    si = url.lastIndexOf '/',url.length-2
    if si>pi
      path = path.substring 3
      url = url.substring 0,si+1
    else
      console.log "warning: relative URL out of scope: #{path} vs #{url}"      

  if path.indexOf( '/' ) == 0
    return url.substring( 0,pi ) + path
  return url+path

addSrcRefs = (file) ->
  if file.text?
    #console.log "check for src in #{file.text}"
    srcs = /<[^>]+src="?([^"\s>]+)"?[^>]*>/g
    ix = 0
    while m = ( srcs.exec file.text ) 
      src = m[1]
      #console.log "src #{src}"
      if src.length>0
        from = file.text.indexOf src, ix
        file.refs.push
          from: from
          to: from+src.length
          src: fix_relative_url file.url, decodeURI(src)
      ix = srcs.lastIndex

files = {}

processFiles = () ->
  for url,file of files when not file.done
    console.log "processFile #{file.url}..."
    for ref in file.refs when not ref.done
      f = files[ref.url]
      console.log "- ref #{JSON.stringify ref}"
      # TODO download to check mime type / add extension
      # TODO download to process
      # TODO download to cache
    
sortRefs = (file) ->
  file.refs.sort (a,b)->return b.from-a.from

cacheFile appurl, (err,path) ->
  if err?
    console.log "error cacheing #{appurl}: #{err}"
    process.exit -1
  console.log "cached #{appurl} as #{path}"

# html index
readTextFile appurl, (err,html) ->
  if err?
    process.exit -1
  file = 
    done: false
    url: appurl
    text: html
    refs: []
  # note: same logic as kiosk cache builder
  hi = html.indexOf '<html '
  hi2 = html.indexOf '>',hi
  mi = html.indexOf ' manifest="', hi
  mi2 = html.indexOf '"', mi+11
  if mi>=0 and mi2>=mi and mi2<hi2
    file.refs.push 
      from: mi+11
      to: mi2
      src: fix_relative_url file.url, decodeURI(html.substring mi+11,mi2)
    #console.log "Found manifest #{manifesturl}"    
  else
    console.log "Could not find manifest reference"
    process.exit -1
  addSrcRefs file
  if not (get_file_extension file.url)?
    file.extension = '.html'

  sortRefs file
  files[file.url] = file
  #processFiles()

