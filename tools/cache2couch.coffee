# couchdb replication to target from an updatecache file-set

http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse

if process.argv.length!=4
  console.log 'usage: coffee cache2couch.coffee <DIR> <COUCHDB-URL>'
  process.exit -1

cachedir = process.argv[2]
couchurl = process.argv[3]

if !fs.existsSync(cachedir)
  console.log "Error: cache directory does not exist: #{cachedir}"
  process.exit -1

# try to read config
configpath = "#{cachedir}/_updatecache.json"
config = null
if !fs.existsSync configpath
  console.log "Error: cannot find cache config file #{configpath}"
  process.exit -1
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
if not config.checkpoints? or not config.uuid? or not config.checkpoint?
  console.log "Error: config file #{configpath} is not valid"
  process.exit -1

readFile = (surl,fn) ->

  url = parse_url surl
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'GET'

  req = http.request options,(res) ->
    if res.statusCode != 200
      console.log "Error downloading #{surl}: response #{res.statusCode}"
      return fn res
    lastmod = res.headers['last-modified']
    length = res.headers['content-length']
    type = res.headers['content-type']
    body = ''
    res.on 'data',(data) ->
      body = body+data
    res.on 'end',() ->
      fn null, body, res
  req.on 'error',(e) ->
    console.log "Error getting file #{surl}: #{e}"
    fn e
  req.end()

doPost = (surl,body,fn) ->

  url = parse_url surl
  options = 
    hostname: url.hostname
    port: url.port
    path: url.path
    auth: url.auth
    method: 'POST'
    headers: 
      'content-type': 'application/json'

  req = http.request options,(res) ->
    if res.statusCode != 200 and res.statusCode != 201
      console.log "Error POSTing to #{surl}: response #{res.statusCode}"
      return fn res
    lastmod = res.headers['last-modified']
    length = res.headers['content-length']
    type = res.headers['content-type']
    body = ''
    res.on 'data',(data) ->
      body = body+data
    res.on 'end',() ->
      fn null, body, res
  req.on 'error',(e) ->
    console.log "Error getting file #{surl}: #{e}"
    fn e
  req.end(body, 'utf8')

# can we get the _local file to check checkpoint?
checkpointpath = "/_local/#{encodeURIComponent config.uuid}"

readFile couchurl+checkpointpath, (err,data,res) ->
  checkpoint = ''
  if err?
    if err.statusCode == 404
      # OK!
      console.log "checkpoint file not found: #{checkpointpath} on #{couchurl}"
    else
      console.log "Error getting checkpoint file (not 404) for #{couchurl} #{checkpointpath}: #{err}"
      process.exit -1
  else
    console.log "get checkpoint file #{data}"
    if data.checkpoint
      checkpoint = data.checkpoint
  console.log "Use target checkpoint '#{checkpoint}'"
  # find checkpoint in cache
  cix = -1
  checkpointName = "#{checkpoint}"
  for cp,ix in config.checkpoints when cp==checkpointName
    cix = ix
  if cix<0
    console.log "Could not find checkpoint #{checkpoint} in cache #{cachedir} - using initial checkpoint"
    checkpoint = ''
    checkpointName = ""
    cix = 0

  # each checkpoint in order?!
  checkpoints = for cp,ix in config.checkpoints when ix>=cix
    cp

  doCheckpoint = (fn) ->
    if checkpoints.length==0
      return fn()
    cp = (checkpoints.splice 0,1)[0]
    checkpointDir = "#{cachedir}/checkpoint-#{cp}"
    if !fs.existsSync checkpointDir
      console.log "Error: could not find checkpoint directory #{checkpointDir}"
      process.exit -1
    console.log "Checkpoint #{checkpointDir}..."
    changesFile = "#{checkpointDir}/_changes.json"
    try 
      changes = JSON.parse fs.readFileSync changesFile,encoding:'utf8'
    catch err
      console.log "Error reading checkpoint changes #{changesFile}: #{err.message}"
      process.exit -1
    # _revs_diff...
    revs = {}
    for res in changes.results
      if not res.id? or res.id.indexOf('_')==0
        console.log "skip document #{res.id}"
        continue
      revs[res.id] = []
      for change in res.changes
        revs[res.id].push change.rev
    revpath = "/_revs_diff"
    console.log "Doing _revs_diff for #{changes.results.length} documents"
    doPost couchurl+revpath, (JSON.stringify revs), (err,data,res) ->
      if err?
        console.log "Error checking _revs_diff on #{couchurl}: #{err}"
        process.exit -1
      #console.log "_revs_diff: #{data}"
      # object {id:{missing:[..]},..}
      try 
        diffs = JSON.parse data
      catch err
        console.log "Error parsing _revs_diff response: #{err}"
        process.exit -1
      missing = []
      for id,diff of diffs
        if diff.missing?
          for rev in diff.missing
            missing.push { id: id, rev: rev }

      console.log "#{missing.length} revs missing from target"
      bulkdocs = []

      doRevWithAttachments = (rev, fn) ->
        for name,att of rev._attachments
          # TODO skip if already known to target
          attpath = "#{cachedir}/attachments/#{rev._id}/#{att.digest.replace /\//g, '_'}"
          try 
            bin = fs.readFileSync attpath
          catch err
            console.log "Error reading attachment file #{attpath}: #{err.message}"
            process.exit -1
          base64 = new Buffer(bin, 'binary').toString('base64')
          delete rev._attachments[name].stub
          rev._attachments[name].data = base64
          console.log "- loaded attachment #{name}"
        console.log "upload #{rev._id} #{rev._rev} with attachments"
        body =  JSON.stringify( {docs: [ rev ], new_edits: false} )
        #console.log "body: #{body}"
        doPost couchurl+"/_bulk_docs", body, (err,data,res) ->
          if err?
            console.log "Error doing _bulk_docs: #{err}"
            process.exit -1
          console.log "upload done: #{data}"
          fn()        

      doRev = (fn) ->
       while true
        if missing.length==0
          return fn()
        miss = (missing.splice 0,1)[0]
        # check revision
        revpath = "#{checkpointDir}/#{miss.id}/#{miss.rev}"
        if !fs.existsSync revpath
          console.log "Error: cannot find revision file #{revpath}"
          process.exit -1
        try 
          rev = JSON.parse fs.readFileSync revpath
        catch err
          console.log "Error: could not read revision file #{revpath}: #{err}"
          process.exit -1
        if rev._attachments? 
          console.log "Note: attachments on #{revpath}"
          return doRevWithAttachments rev, () -> doRev fn
          # TODO
        else
          console.log "no attachments on #{revpath}"
          #if bulkdocs.length>0 and bulkdocs[bulkdocs.length-1]._id==rev._id
          #  console.log "flush on multiple reviison for #{rev._id}"
          #  return doBulk () ->
          #    bulkdocs.push rev
          #    doRev fn
          bulkdocs.push rev
        #continue

      doBulk = (fn) ->
        if bulkdocs.length>0
          console.log "bulk update #{bulkdocs.length} documents"
          body =  JSON.stringify( {docs: bulkdocs, new_edits: false} )
          bulkdocs = []
          #console.log "bulk body: #{body}"
          doPost couchurl+"/_bulk_docs", body, (err,data,res) ->
            if err?
              console.log "Error doing _bulk_docs: #{err}"
              process.exit -1
            console.log "bulk update done: #{data}"
            fn()
        else        
          console.log "No bulk updates left"
          return fn()

      return doRev () -> 
        doBulk () ->
          doCheckpoint fn

  doCheckpoint () ->
    console.log "Done!"
    process.exit 0

