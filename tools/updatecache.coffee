# do source part of couchdb replication on given database, 
# creating a new file checkpoint in the target directory

https = require 'https'
http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse
uuid = require 'node-uuid'

if process.argv.length!=3 and process.argv.length!=4
  console.log 'usage: coffee updatecache.coffee <DIR> [<COUCHDB-URL>]'
  process.exit -1

outdir = process.argv[2]
couchurl = if process.argv.length>3 then process.argv[3] else null

if !fs.existsSync(outdir)
  console.log "Error: output directory does not exist: #{outdir}"
  process.exit -1

attachdir = "#{outdir}/attachments"
if !fs.existsSync(attachdir)
  try
    fs.mkdirSync attachdir
  catch err
    console.log "Error: could not create attachment  directory #{attachdir}: #{err.message}"
    process.exit -1

# try to read config
configpath = "#{outdir}/_updatecache.json"
config = null
if !fs.existsSync configpath
  if not couchurl?
    console.log "Error: cannot find config file #{configpath}: therefore you must specify the couchdb url"
    console.log 'usage: coffee exportapp.coffee <DIR> <COUCHDB-URL>'
    process.exit -1
  console.log "Note: creating config file #{configpath}"
  config = { couchurl: couchurl, checkpoints: [] }
else
  console.log "read config #{configpath}"
  try 
    data = fs.readFileSync configpath,{encoding:'utf8'}
    try 
      config = JSON.parse data
    catch err
      console.log "Error: parsing config file #{configpath}: #{err.message}"
      process.exit -1
  catch err
    console.log "Error: reading config file #{configpath}: #{err.message}"
    process.exit -1
  if couchurl? and config.couchurl!=couchurl
    console.log "Error: couchurl in config file #{configpath} differs #{config.couchurl} vs #{couchurl}"
    process.exit -1
  else if not couchurl?
    couchurl = config.couchurl
    console.log "Note: using couchdb #{couchurl} from #{configpath}"

if not config.uuid 
  config.uuid = uuid.v4()

downloadFile = (surl,path,fn) ->

  url = parse_url surl
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'GET'

  tmppath = path+".download"

  req = http.request options,(res) ->
    if res.statusCode != 200
      console.log "Error downloading #{surl}: response #{res.statusCode}"
      return fn res
    lastmod = res.headers['last-modified']
    length = res.headers['content-length']
    type = res.headers['content-type']

    try 
      fd = fs.openSync(tmppath, 'w')
    catch e
      console.log "Could not create tmpfile #{tmppath}: #{e}"
      return fn e      
        
    count = 0;

    res.on 'data',(data) ->
      if count < 0
        return
      #console.log "got #{data.length} bytes for #{surl}"
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
      console.log "Downloaded #{type} #{surl} -> #{path} (#{length} bytes, #{type})"
      fn null, path
  req.on 'error',(e) ->
    console.log "Error getting file #{surl}: #{e}"
    fn e
  req.end()


writeConfig = () ->
  try 
    fs.writeFileSync configpath, (JSON.stringify config)
    console.log "Wrote config #{configpath}"
  catch err
    console.log "Error: writing initial config #{configpath}: #{err.message}"
    process.exit -1

# last checkpoint?
checkpoint = config.checkpoint

oldResults = []
for cp in config.checkpoints
  try
    oldChangesPath = "#{outdir}/checkpoint-#{cp}/_changes.json"
    oldChanges = JSON.parse fs.readFileSync oldChangesPath,encoding:'utf8'
    for res in oldChanges.results
      oldResults.push res
    console.log "Read #{oldChanges.results.length} docs from checkpoint #{oldChangesPath}"
  catch err
    console.log "Warning: could not read #{oldChangesPath} from checkpoint #{cp}: #{err.message}" 

changespath = "/_changes?style=all_docs"
if checkpoint?
  changespath = changespath+"&since="+encodeURIComponent(checkpoint)
console.log "Get changes: #{changespath}"

downloadFile couchurl+changespath,"#{outdir}/_changes.json", (err,path) ->
  if err?
    process.exit -1
  try 
    changes = JSON.parse (fs.readFileSync path, encoding:'utf8')
  catch err
    console.log "Error reading downloaded file #{path}: #{err.message}"
    process.exit -1
  # { results: [ ... ], last_seq: ... }
  last_seq = changes.last_seq
  console.log "Got #{changes.results.length} docs, last_seq=#{last_seq}"
  if changes.results.length==0
    console.log "No changes found in database"
    process.exit 0

  checkpointDir = "#{outdir}/checkpoint-#{if checkpoint? then checkpoint else ''}"
  if fs.existsSync checkpointDir
    console.log "Error: Checkpoint dir #{checkpointDir} already exists"
    process.exit -1
  console.log "Creating checkpoint directory #{checkpointDir}"
  fs.mkdirSync checkpointDir
  try
    fs.renameSync path,"#{checkpointDir}/_changes.json"
  catch e
    console.log "Error moving _changes.json to #{checkpointDir}: #{e}"
    process.exit -1

  # get each revision
  # e.g.{"seq":48,"id":"file:be76fd1e-0a95-4a60-8b42-b6ed305ec741","changes":[{"rev":"4-19d854d0ebbd8d23b764044051c5f833"}],"deleted":true}
  revs = []
  for result in changes.results
    # skip special docs
    if not result.id? or result.id.indexOf( '_' )==0
      console.log "skip special document #{result.id}"
      continue
    try 
      # TODO safe filename
      fs.mkdirSync "#{checkpointDir}/#{result.id}"
    catch err
      console.log "error creating document directory for #{result.id}: #{err.message}"
      continue
    for orev in result.changes
      revs.push 
        id: result.id
        rev: orev.rev

  getRevs = (fn) ->
    if revs.length==0
      return fn()
    rev = (revs.splice 0,1)[0]
    getpath="/#{encodeURIComponent rev.id}?rev=#{encodeURIComponent rev.rev}&revs=true" #&attachments=true"
    # TODO atts_since based on last checkpoint!
    atts_since = []
    if oldResults? 
      for res in oldResults when res.id==rev.id
        for r in res.changes
          atts_since.push r.rev
    #if atts_since.length>0
    #  getpath = getpath+"&atts_since=#{encodeURIComponent JSON.stringify atts_since}"
    downloadFile couchurl+getpath,"#{checkpointDir}/#{rev.id}/#{rev.rev}", (err,path) ->
      if err
        console.log "Error downloading #{getpath}: #{err}"
        process.exit -1
      # TODO attachments...
      try 
        doc = JSON.parse fs.readFileSync path,encoding:'utf8'
      catch err
        console.log "Error reading downloaded doc #{path}: #{err}"
        process.exit -1
      if doc._attachments?
        atts = []
        for name,att of doc._attachments
          atts.push {name:name, info:att}
        getAtts = (fn) ->
          if atts.length==0
            return fn()
          att = (atts.splice 0,1)[0]
          console.log "- #{rev.id} attachment #{att.name} hash #{att.info.digest}"
          docattachdir = "#{attachdir}/#{rev.id}"
          if !fs.existsSync(docattachdir)
            try
              fs.mkdirSync docattachdir
            catch err
              console.log "Error: could not create attachment  directory #{docattachdir}: #{err.message}"
              process.exit -1
          # hopefully rev will ensure uniqueness/no race
          attachpath = "/#{encodeURIComponent rev.id}/#{encodeURIComponent att.name}?rev=#{encodeURIComponent rev.rev}"
          # / in base64 = bad
          attachfile = "#{attachdir}/#{rev.id}/#{att.info.digest.replace '/', '_'}"
          if fs.existsSync attachfile
            try
              state = fs.statSync attachfile
              if state.isFile
                # check size
                if state.size == att.info.length
                  console.log "skip download existing attachment #{attachfile}"
                  return getAtts fn
                console.log "Error: existing attachment wrong size #{state.size} vs #{att.info.length}"
            catch err
              console.log "Error: stat'ing #{attachfile}: #{err.message}"
              process.exit -1

          downloadFile couchurl+attachpath,attachfile, (err,path) ->
            if err
              console.log "Error downloading #{attachpath}: #{err}"
              process.exit -1          
            getAtts fn

        return getAtts () -> getRevs fn

      getRevs fn 

  getRevs ()->
    config.checkpoint = last_seq
    config.checkpoints.push if checkpoint? then checkpoint else ''
    writeConfig()

