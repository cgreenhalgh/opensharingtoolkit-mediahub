# utils
#console.log "hello utils"
https = require 'https'
http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse
spawn = (require 'child_process').spawn

log1 = (msg) -> 
  # default
  console.log msg

# allow taskrunner override
module.exports.log = log1
log = (msg) -> module.exports.log msg

couchurl = null

module.exports.setCouchurl = (url) -> 
  couchurl = url

module.exports.get_file_extension = get_file_extension = (url) ->
  #iq = url.indexOf '?'
  #if iq>=0
  #  # not a real extension?
  #  return null
  ix = url.lastIndexOf '/' #, iq
  if ix<0
    ix = 0
  ix2 = url.lastIndexOf '.' #, iq
  if ix2<ix or ix2==url.length-1
    null
  else
    url.substring ix2+1 #, iq

module.exports.checkMimetype = checkMimetype = (surl, fn) ->
  url = parse_url surl
  protocol = url.protocol ? 'http'
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'HEAD'
  log "head #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      log "Error checking file #{surl}, response #{res.statusCode}"
      return fn res.statusCode
    type = res.headers['content-type']
    res.on 'data',(data)->
      # ignore
    res.on 'end',()->
      log "mimetype for #{surl} = #{type}"
      ix = type?.indexOf ';'
      if ix>=0
        type = type.substring 0,ix
      fn null, type

  req.on 'error',(e) ->
    log "Error checking file #{surl}: #{e}"
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
  log "get #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      log "Error getting file #{surl}, response #{res.statusCode}"
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
        log "Error parsing file #{surl}: #{err.message}: #{body}"
        fn err
      fn null, json 

  req.on 'error',(e) ->
    log "Error getting file #{surl}: #{e}"
    fn e
  req.end()

module.exports.doHttp = doHttp = (surl,method,body,fn) ->
  url = parse_url surl
  protocol = url.protocol ? 'http'
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: method
    headers: 
      'content-type': 'application/json'

  log "#{method} #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200 && res.statusCode != 201
      log "Error on #{method} #{surl}, response #{res.statusCode}"
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
        log "Error parsing #{method} #{surl}: #{err.message}: #{body}"
        fn err
      fn null, json 

  req.on 'error',(e) ->
    log "Error on #{method} #{surl}: #{e}"
    fn e
  req.end(body, 'utf8')


module.exports.mimetypeFromExtension = mimetypeFromExtension = (url) ->
  ix = url.lastIndexOf '.'
  if ix>=0 and ix>(url.lastIndexOf '/')
    ext = url.substring (ix+1)
    if ext=='jpg' or ext=='jpeg' or ext=='jpe'
      return 'image/jpeg'
    if ext=='png'
      return 'image/png'
    if ext=='html' or ext=='htm'
      return 'text/html'
    if ext=='mp3'
      return 'audio/mpeg'
    if ext=='ogg'
      return 'audio/ogg'
    if ext=='pdf'
      return 'application/pdf'
  return null

module.exports.guessMimetype = guessMimetype = (url, fn) ->
  type =  mimetypeFromExtension url
  if type
    return fn type
  log "unknown mimetype for #{url} - try head"
  checkMimetype url, (err,type) ->
    if err?
      log "Unknown mimetype for #{url}"
      return fn 'application/unknown'
    fn type

get_path_for_component = (h) ->
  if h=='' 
    return '_'
  return encodeURIComponent h

module.exports.get_safe_path = get_safe_path = (path) ->
  ps = if path? then path.split '/' else []
  # leading /?
  if ps.length>1 and ps[0]==''
    ps.shift()
  # make safe filenames
  ps = for p in ps
    p = encodeURIComponent decodeURIComponent p 
    get_path_for_component p
  path = ps.join '/'
  return path

module.exports.cachePaths = cachePaths = {}
module.exports.cacheUrls = cacheUrls = {}

# get local cache path for an URL - like java cacheing,
# maps domain name elements and path elements to folders
module.exports.get_cache_path = get_cache_path = (url) ->
  url = parse_url url
  # host, port, pathname, hash, search
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
  ps = []
  if url.pathname?
    ps = url.pathname.split '/'
  ps = for p in ps
    encodeURIComponent decodeURIComponent p
  if url.hash or url.search
    if ps.length==0
      ps.push ''
    fname = ps[ps.length-1]
    if url.hash 
      fname = fname+encodeURIComponent url.hash
    if url.search 
      fname = fname+encodeURIComponent url.search
    ps[ps.length-1] = fname 
  # leading /?
  if ps.length>1 and ps[0]==''
    ps.shift()
  hs = ["appcache"].concat hs,ps
  # make safe filenames
  hs = for h in hs
    get_path_for_component h
  path = hs.join '/'
  return path

# undo one level of URL encoding of path elements
get_filesystem_path = (path) ->
  ps = path.split '/'
  ps = for p in ps
    decodeURIComponent p
  ps.join '/'
  
module.exports.filesEqual = filesEqual = (path1, path2) ->
  if !fs.existsSync path1
    log "compare #{path1} #{path2} - file 1 does not exist"
    return false
  stats1 = null
  try
     stats1 = fs.statSync path1
  catch err
    log "compare #{path1} #{path2} - cannot state file 1: #{err.message}"
    return false
  if !stats1.isFile()
    log "compare #{path1} #{path2} - file 1 is not a file"
    return false
  if !fs.existsSync path2
    log "compare #{path1} #{path2} - file 2 does not exist"
    return false
  stats2 = null
  try
    stats2 = fs.statSync path2
  catch err
    log "compare #{path1} #{path2} - cannot state file 2: #{err.message}"
    return false
  if !stats2.isFile()
    log "compare #{path1} #{path2} - file 2 is not a file"
    return false
  if stats1.size!=stats2.size
    log "compare #{path1} #{path2} - lengths differ #{stats1.size} vs #{stats2.size}"
    return false
  # TODO: compare in blocks
  buf1 = null
  try
    buf1 = fs.readFileSync path1
  catch err
    log "compare #{path1} #{path2} - cannot read file 1: #{err.message}"
    return false
  buf2 = null
  try
    buf2 = fs.readFileSync path2
  catch err
    log "compare #{path1} #{path2} - cannot read file 2: #{err.message}"
    return false
  if buf1.length!=buf2.length
    log "compare #{path1} #{path2} - buffer lengths differ #{buf1.length} vs #{buf2.length}"
    return false
  for i in [0..(buf1.length-1)]
    if buf1[i]!=buf2[i]
      log "compare #{path1} #{path2} - differ at byte #{i}/#{buf1.length}"
      return false
  log "compare #{path1} #{path2} - files are identical"
  return true

module.exports.cacheFile = cacheFile = (surl,fn) ->
  if cacheUrls[surl]?
    return fn null,cacheUrls[surl]

  # fix url - split, decode (like web server), then encode once (for filename) and again (for url)

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
  if ps.length>1 or ps[0].length>0
    log "mkdirs #{dir}"
    for i in [0..(ps.length-1)]
      d = d + (if i>0 then '/' else '') + decodeURIComponent( ps[i] )
      if !fs.existsSync(d)
        log "mkdir #{d}" 
        fs.mkdirSync d

  log "get #{url.host} #{url.port} #{url.path} #{url.auth}"	
  pmodule = if protocol=='https' then https else http   
  req = pmodule.request options,(res) ->
    if res.statusCode != 200
      log "Error getting file #{surl}, response #{res.statusCode}"
      return fn res.statusCode
    # on success remove old file if present and link/rename new file
    lastmod = res.headers['last-modified']
    length = res.headers['content-length']
    type = res.headers['content-type']
    fileextension = get_file_extension url.path
    # TODO file extension
    if (type.indexOf 'image/')==0
      mimeextension = type.substring(6)
    else if (type.indexOf 'audio/mpeg')==0
      # special case mp3 needed by ios/macs
      mimeextension = "mp3"
    else if (type.indexOf 'audio/')==0
      mimeextension = type.substring(6)
    else if (type.indexOf 'text/html')==0
      mimeextension = 'html'
    else if (type.indexOf 'text/cache-manifest')==0
      mimeextension = 'appcache'
    else if (type.indexOf 'application/javascript')==0 
      mimeextension = 'json'
    else if (type.indexOf 'text/plain')==0 and dir=='' 
      # top-level document
      mimeextension = 'json'
    else if (type.indexOf 'application/pdf')==0 
      mimeextension = 'pdf'
    if mimeextension and mimeextension!=fileextension
      path = path+'.'+mimeextension
      log "adding extension #{mimeextension} to #{path}"
    else if not fileextension
      log "no extension found for #{path} / #{type}"

    tmppath = get_filesystem_path (dir + (if dir!='' then '/' else '') + '.cb_download')
    try 
      fd = fs.openSync(tmppath, 'w')
    catch e
      log "Could not create tmpfile #{tmppath}: #{e}"
      return fn e      
        
    count = 0;

    res.on 'data',(data) ->
      if count < 0
        return
      #log "got #{data.length} bytes for #{file.url}"
      try 
        fs.writeSync(fd, data, 0, data.length)
        count += data.length
      catch e
        log "Error writing data chunk to #{tmppath}: #{e}"
        count = -1

    res.on 'end',() ->
      fs.closeSync(fd)
      if count < 0
        return fn 'error reading data'
      if count < length 
        log "Warning: read #{count}/#{length} bytes for #{surl} - discarding"
        try
          fs.unlinkSync tmppath
        catch e
          ; # ignore
        return fn ("read #{count}/#{length}")

      log "OK: read #{count} bytes"
      filepath = get_filesystem_path path
      if filesEqual filepath,tmppath
        log "Unchanged #{surl} -> #{filepath} aka #{path} (#{length} bytes, #{type})"
        try
          # remove old tmp file
          fs.unlinkSync tmppath
        catch e
          ;# ignore
        cachePaths[surl] = filepath
        cacheUrls[surl] = path
        return fn null, path
            
      try
        # remove old old file if present
        fs.unlinkSync filepath
      catch e
        ;# ignore
      try
        fs.renameSync tmppath,filepath
        # done!
      catch e
        log "Error renaming new cache file #{tmppath} to #{filepath}: #{e}"
        return fn 'error renaming new cache file'
      log "Downloaded #{surl} -> #{filepath} aka #{path} (#{length} bytes, #{type})"
      cachePaths[surl] = filepath
      cacheUrls[surl] = path
      fn null, path
  req.on 'error',(e) ->
    log "Error getting file #{surl}: #{e}"
    fn e
  req.end()

module.exports.readCacheTextFile = readCacheTextFile = (surl,fn) ->
  path = cachePaths[surl]
  if path?
    try 
      fn null, fs.readFileSync path,{encoding:'utf8'}
    catch err
      log "error reading #{path}: #{err}"
      fn err
  else 
    cacheFile surl, (err,path) ->
      if err?
        fn err
      try 
        fn null, fs.readFileSync path,{encoding:'utf8'}
      catch err
        log "error reading #{path}: #{err}"
        fn err
 
module.exports.exec = (cmd, args, continuation) ->
  log "exec: #{cmd} #{JSON.stringify args} in #{process.cwd()}"
  try
    child = spawn cmd, args, 
      stdio: 'inherit'
      env: process.env
      cwd: process.cwd()
  catch err
    log "exec: error spawning #{cmd}: #{err.message}"
    return continuation err

  child.on 'error', (err) ->
    log "child process reported error #{err}"
    return continuation err

  child.on 'close', (code) ->
    log "child process exited with code #{code}"
    if code==0
      continuation null
    else
      continuation "Returned error code #{code}"

errors = []
exitCode = 1

module.exports.logError = (msg, code) ->
  log "ERROR: #{msg}"
  errors.push msg
  if code!=0
    exitCode = code

module.exports.exit = () ->
  log "Exit after #{errors.length} errors"
  for error in errors
    log "- #{error}"
  if errors.length==0
    process.exit 0
  if exitCode!=0
    log "exit with code #{exitCode}"
    process.exit exitCode
  log "exit with default code 1"
  process.exit 1

module.exports.copyDirSync = copyDirSync = (fromdir, todir) ->
  log "copy dir #{fromdir} -> #{todir}"
  fromdir = fs.realpathSync fromdir
  todir = fs.realpathSync todir
  if !(fs.existsSync fromdir)
    throw "fromdir #{fromdir} does not exist"
  if !(fs.existsSync todir)
    throw "todir #{todir} does not exist"
  files = fs.readdirSync fromdir
  for file in files
    fromfile = fromdir+"/"+file
    tofile = todir+"/"+file
    stats = fs.statSync fromfile
    if stats.isDirectory()
      if !(fs.existsSync tofile)
        log "Create dir #{tofile}"
        fs.mkdirSync tofile,0o755
      copyDirSync fromfile,tofile
    else if stats.isFile()
      if !(fs.existsSync tofile)
        log "Create file #{tofile}"
        data = fs.readFileSync fromfile,{encoding:null}
        fs.writeFileSync tofile,data,{encoding:null,mode:(stats.mode|0o444)}
      else 
        # compare modified
        try
          tostats = fs.statSync tofile
          if stats.mtime.getTime() > tostats.mtime.getTime()
            log "Update changed file #{tofile}"
            data = fs.readFileSync fromfile,{encoding:null}
            fs.writeFileSync tofile,data,{encoding:null,mode:(stats.mode|0o444)}
        catch err
          log "Error doing stat on #{tofile}: #{err.message}"
    else
      if !(fs.existsSync tofile)
        log "Ignore non-file/dir #{fromfile}"

module.exports.rmSync = rmSync = (fromdir) ->
  fromdir = fs.realpathSync fromdir
  if !(fs.existsSync fromdir)
    return log "rmdir #{fromdir} does not exist"
  stats = fs.statSync fromdir
  if not stats.isDirectory()
    try
      return fs.unlinkSync fromdir
    catch err
      return log "error unlinking #{fromdir}: #{err.message}"
  log "rm dir #{fromdir}"
  files = fs.readdirSync fromdir
  for file in files
    fromfile = fromdir+"/"+file
    rmSync fromfile
  try
    fs.rmdirSync fromdir
  catch err
    log "error rmdir #{fromdir}: #{err.message}"

module.exports.cleanSync = (fromdir) ->
  fromdir = fs.realpathSync fromdir
  if !(fs.existsSync fromdir)
    return log "clean #{fromdir} does not exist"
  stats = fs.statSync fromdir
  if not stats.isDirectory()
    return log "clean non-directory #{fromdir}"
  log "clean #{fromdir}"
  files = fs.readdirSync fromdir
  for file in files
    fromfile = fromdir+"/"+file
    rmSync fromfile

