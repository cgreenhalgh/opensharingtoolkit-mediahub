# node task runner for mediahub
fs = require('fs')
multiparty = require('multiparty')
http = require('http')
spawn = require('child_process').spawn
parse_url = require('url').parse
utils = require('./utils')
uuid = require 'node-uuid'

log = (msg) -> 
  # compatible with couchdb external processes
  console.log JSON.stringify ["log", msg]

log "Node version #{JSON.stringify process.version}"
#log "Environment #{JSON.stringify process.env}"
newmask = 0o0022
try
  oldmask = process.umask newmask
  log "Changed umask from #{oldmask.toString(8)} to #{newmask.toString(8)}"
catch err
  log "error changing umask: #{err.message}"

dburl = 'http://127.0.0.1:5984/mediahub'
publicwebdir = '../docker/nginxdev/html/public'
serverport = 8090
MAX_PROCESS_TIME = 300000
MAX_FILES_SIZE = 50000000

started = false
# couchdb config
stdin = process.openStdin()
stdin.on 'data', (d) ->
  log "config data: #{d}"
  try
    conf = JSON.parse d
    if conf.dburl?
      dburl = conf.dburl
    if conf.publicwebdir?
      publicwebdir = conf.publicwebdir
      if publicwebdir.length>0 and (publicwebdir.lastIndexOf '/')==publicwebdir.length-1
        publicwebdir = publicwebdir.substring 0, publicwebdir.length-1
    if conf.serverport?
      serverport = Number(conf.serverport)
    if !started
      started = true
      startAuth()

  catch err
    log "Error reading config #{d}: #{err.message}"

log "requesting config like #{JSON.stringify { dburl: dburl, publicwebdir: publicwebdir, serverport: serverport }}"
console.log JSON.stringify ["get", "taskrunner"]

tasks = {} 

nano = null
db = null
publicwebdirerror = true
cookie = null

checkCookie = (headers) ->
  if headers && headers['set-cookie']
    cookie = headers['set-cookie'].toString()
    log "set cookie authentication -> cookie #{cookie}"
    nano.config.cookie = cookie.substring 0,(cookie.indexOf ';')

startCookieAuth = () ->
  # not using, at least for now - basic auth is fine
  url = parse_url dburl
  server = url.protocol+"//"+url.host
  dbname = url.pathname.split('/')[1]
  log "connect to #{dburl} = #{server} #{dbname} as #{url.auth}"
  nano = require('nano') 
    url: server
    log: (id, args) ->
      log "nano:#{id}: #{JSON.stringify args}"
  if url.auth
    ix = url.auth.indexOf ':'
    username = url.auth.substring 0,ix
    password = url.auth.substring ix+1
    cred = username+':'+password
    auth = 'Basic '+new Buffer(cred, 'utf8').toString('base64')
    log "auth: #{cred} / #{new Buffer(cred, 'utf8').toString('hex')}"
    nano.config.default_headers = { 'authorization' : auth }
    nano.auth username, password, (err,body,headers) ->
      checkCookie headers
      nano.config.default_headers = {}
      if err
        log "authentication failed (#{username} : #{password}): #{err}; headers=#{JSON.stringify headers}, body=#{body}"
        process.exit -1
      db = nano.use dbname
      log "nano config: #{JSON.stringify nano.config}"
      start()
  else
    db = nano.use dbname
    log "nano config: #{JSON.stringify nano.config}"
    start()

startAuth = () ->
  log "connect to #{dburl}"
  db = require('nano') dburl
  start()
start = () ->

  # errors?

  log "using publicwebdir #{publicwebdir}"
  if fs.existsSync publicwebdir
    publicwebdirerror = false

  db.list
    include_docs: true
    startkey: 'taskstate:'
    endkey: 'taskstate;'
   , (err, body, headers) ->
    checkCookie headers
    if err?
      log "state error #{err}"
    else
      log "state got #{body.rows.length} rows"
      for row in body.rows
        state = row.doc
        log "got state #{JSON.stringify state}"
        id = state._id
        ix = id.indexOf ':'
        if ix>=0 then id = id.substring ix+1
        task = tasks[id]
        if not task?
          tasks[id] = task = { id: id }
        log "#{if task.serverState? then 'update' else 'add'} task #{id} serverState #{JSON.stringify state}"
        task.serverState = state
    log "state complete - getting tasks..."
    startTasks()

  startUploadServer()

taskQueue = []
activeTask = null

startTasks = () ->
  getChanges()

lastSequence = null

getChanges = () ->
  params = 
    include_docs: true
    #live: true
    filter: 'app/changesTaskconfig'
    feed: 'longpoll'
  if lastSequence?
    params.since = lastSequence
  feed = db.changes params, (err,changes,headers)->
    checkCookie headers
    if err?
      log "getChanges: error getting changes: #{err.message}"
      setTimeout getChanges,5000
      return
    first = not lastSequence?
    lastSequence = changes.last_seq
    log "change config: #{changes.results.length} changes, last_seq #{changes.last_seq}"
    for change in changes.results
      if not first or not change.doc._deleted
        updateConfig change.doc
    # GC
    if first
      ids = for id of tasks
        id
      for id in ids
        task = tasks[id]
        if not task.config? 
          gcTask task
          delete tasks[id]
    schedule()
    setTimeout getChanges,100

updateConfig = (config) ->
  id = config._id
  ix = id.indexOf ':'
  if ix>=0 then id = id.substring ix+1
  task = tasks[id]
  if not task?
    tasks[id] = task = { id: id }
  log "#{if task.config? then 'update' else 'add'} task #{id} config #{JSON.stringify config}"
  if config._deleted
    log "deleted config #{config._id}"
    delete task.config
    gcTask task
    return
  task.config = config
  # in queue?
  qix = -1
  for t,i in taskQueue when t.id==id
    qix = i
  if qix<0
    taskQueue.splice 0,0,task
  else if qix>0
    # move to head of queue
    taskQueue.splice 0,0,((taskQueue.splice qix,1)[0])
  # re-created?
  if task.targetState? and task.targetState.configCreated != config.created
    gcTask task

schedule = () ->
  if activeTask?
    # TODO
    log "schedule: has activeTask"
    return
  if taskQueue.length==0
    log "schedule: taskQueue empty"
    return
  next = (taskQueue.splice 0,1)[0]
  #log "schedule: next task #{JSON.stringify next}"
  log "schedule: next task #{next.id}"
  if not next.config?
    log "ignore deleted task #{next.id}"
    return schedule()
  if not next.targetState? or next.targetState.configCreated != next.config.created
    next.targetState = { _id: "taskstate:#{next.id}", type: 'taskstate', configCreated: next.config.created }
  if not next.targetState.path?
    next.targetState.path = next.config.path

  if next.config.enabled!=true
    log "schedule: task #{next.id} not enabled"
    next.targetState.lastUpdate = new Date().getTime()
    next.targetState.state = "disabled"
    next.targetState.message = "Task is disabled"
    setTimeout schedule,0
    sendState next
    return
  # start?
  if next.serverState? and next.serverState.lastConfigChanged? and not next.targetState.lastConfigChanged?
    next.targetState.lastConfigChanged = next.serverState.lastConfigChanged
  if next.targetState.lastConfigChanged >= next.config.lastChanged
    log "schedule: task #{next.id} done since last update #{next.targetState.lastConfigChanged} / #{next.config.lastChanged}"
    setTimeout schedule, 0
    next.targetState.lastUpdate = new Date().getTime()
    next.targetState.state = "done"
    next.targetState.message = "Task already done since last request"
    sendState next
    return

  if next.config.taskType=='import'
    if not next.uploadFile? or next.uploadTime < next.config.lastChanged
      setTimeout schedule, 0
      next.targetState.lastUpdate = new Date().getTime()
      next.targetState.state = "waiting"
      next.targetState.message = "Waiting for upload"
      sendState next
      return

  log "schedule: start task #{next.id} #{next.config.taskType} #{next.config.subjectId}"
  next.targetState.lastUpdate = new Date().getTime()
  next.targetState.state = "starting"
  next.targetState.message = "Running task..."
  next.targetState.nextConfigChanged = next.config.lastChanged
  sendState next
  activeTask = next

  if publicwebdirerror
    return taskError next,"Public web directory not found (#{publicwebdir})"
  if next.config.taskType=='exportapp'
    doExportapp next
  else if next.config.taskType=='exportkiosk'
    doExportkiosk next
  else if next.config.taskType=='tar'
    doTar next
  else if next.config.taskType=='rm'
    doRm next
  else if next.config.taskType=='backup'
    doBackup next
  else if next.config.taskType=='checkpoint'
    doCheckpoint next
  else if next.config.taskType=='import'
    doImport next
  else if next.config.taskType=='buildserver'
    doBuildserver next
  else if next.config.taskType=='dummy'
    # TEST...  
    dummy = () ->
      log "dummy end task #{next.id}"
      taskDone next

    setTimeout dummy,5000
  else
    taskError next,"Unknown task type #{next.config.taskType}"

taskDone = (next) ->
    if activeTask!=next
      log "Error: activeTask!=next in taskDone"
      return
    activeTask = null
    setTimeout schedule,0
    next.targetState.lastConfigChanged = next.targetState.nextConfigChanged
    next.targetState.nextConfigChanged = null
    next.targetState.lastUpdate = new Date().getTime()
    next.targetState.state = "done"
    next.targetState.message = "Task complete"
    sendState next

taskError = (next,err) ->
    if activeTask!=next
      log "Error: activeTask!=next in taskError"
      return
    activeTask = null
    setTimeout schedule,0
    next.targetState.nextConfigChanged = null
    next.targetState.lastUpdate = new Date().getTime()
    next.targetState.state = "error"
    next.targetState.message = "Error running task: #{err}"
    sendState next


sendState = (task) ->
  if task.internal
    return
  if task.sendingState?
    log "sendState: already active for #{task.id}"
    return
  if not task.serverState?
    task.sendingState = JSON.parse (JSON.stringify task.targetState)
    log "sendState: create state #{task.targetState._id}"
    db.insert task.sendingState, (err,response,headers) ->
      checkCookie headers
      if err?
        log "sendState: create error #{err}"
        task.sendingState = null
        checkServerState task
        return
      task.serverState = task.sendingState
      task.serverState._rev = response.rev
      task.sendingState = null
      log "sendState: sent new state #{task.serverState._id} rev #{response.rev}"
      sendState task
  else if task.serverState.state==task.targetState.state and task.serverState.lastUpdate==task.targetState.lastUpdate and task.serverState.nextConfigChanged==task.targetState.nextConfigChanged and task.serverState.lastConfigChanged==task.targetState.lastConfigChanged and task.serverState.message==task.targetState.message
    log "sendState: up-to-date for #{task.serverState._id}"
  else
    task.sendingState = JSON.parse (JSON.stringify task.targetState)
    task.sendingState._rev = task.serverState._rev
    log "sendState: update state #{task.targetState._id} rev #{task.serverState._rev}"
    db.insert task.sendingState, (err,response,headers) ->
      checkCookie headers
      if err?
        log "sendState: update error #{err}"
        task.sendingState = null
        checkServerState task
        return
      task.serverState = task.sendingState
      task.serverState._rev = response.rev
      task.sendingState = null
      log "sendState: updated state #{task.serverState._id} rev #{response.rev}"
      sendState task

checkServerState = (task) ->
  log "sendState: checkServerState #{task.targetState._id}"
  db.get task.targetState._id, (err,doc,headers) ->
    checkCookie headers
    if err?
      log "sendState: checkServerState #{task.targetState._id} error #{err}"
      return
    log "sendState: checkServerState -> #{JSON.stringify doc}"
    task.serverState = doc
    sendState task

checkPath = (task,root,create) ->
  path = task.config.path
  if path? and path.length!=0 
    els = path.split '/'
    path = ''
    for el in els
      if el=='.'
        continue
      if el=='..'
        return taskError task,"Path must not contain '..': #{next.config.path}"
      if el==''
        return taskError task,"Path must not contain '//' or leading/trailing '/': #{next.config.path}"
      path = path+"/#{el}"
      if !fs.existsSync root+path
        if !create
          taskError task, "Output directory does not exist: #{root+path}"
          return null
        log "create output dir #{root+path}"
        try
          fs.mkdirSync root+path,0o755
        catch err
          log "Could not create output dir #{root+path}: #{err.message}"
          taskError task, "Could not create output directory #{path}: #{err.message}"
          return null
    return root+path
  else
    taskError task, "Cannot output into top-level directory (empty path)"
    return null

doExportapp = (task) ->
  appId = task.config.subjectId
  if not appId?
    return taskError task, "App to export was not specified ('subjectId')"
  publicurl = task.config.configpublicurl
  if not publicurl
    return taskError task, "Publicurl for export was not specified ('configpublicurl')"
  appurl = "#{dburl}/_design/app/_show/app/#{appId}"
  if (path=(checkPath task, publicwebdir, true))?
    doSpawn task, "/usr/local/bin/coffee", ["#{__dirname}/exportapp.coffee",appurl,publicurl,task.config.path], path, true,
      (task) ->
        doTar task

doExportkiosk = (task) ->
  kioskId = task.config.subjectId
  if not kioskId
    return taskError task, "Kiosk config to export was not specified ('subjectId')"
  publicurl = task.config.configpublicurl
  if not publicurl
    return taskError task, "Publicurl for export was not specified ('configpublicurl')"
  #publicurl = publicurl+"/"+task.config.path
  kioskurl = "#{dburl}/#{kioskId}"
  if (path=(checkPath task, publicwebdir, true))?
    doSpawn task, "/usr/local/bin/coffee", ["#{__dirname}/exportkiosk.coffee",kioskurl,publicurl,task.config.path], path, true,
      (task) ->
        # TODO cache builder
        doTar task

doBackup = (task) ->
  dbfile = "/var/lib/couchdb/mediahub.couch"
  if (path=(checkPath task, publicwebdir, true))?
    doSpawn task, "cp", [dbfile,path], path, true,
      (task) ->
        doTar task

doCheckpoint = (task) ->
  if (path=(checkPath task, publicwebdir, true))?
    # NB typeContent filter
    doSpawn task, "/usr/local/bin/coffee", ["#{__dirname}/updatecache.coffee", ".", dburl, "app/changesContent"], path, true,
      (task) ->
        doTar task

doTar = (task) ->
  path = task.config.path
  if (path=(checkPath task, publicwebdir, false))?
    file = path
    ix = file.lastIndexOf '/'
    if ix>=0
      file = file.substring ix+1
    tar = "../#{file}.tgz"
    doSpawn task, "tar", ["czf", tar, '.'], path, false

doRm = (task) ->
  path = task.config.path
  if (path=(checkPath task, publicwebdir, false))?
    if !fs.existsSync path
      log "rm: file/path does not exist: #{path}"
      return taskDone task
    if (path.indexOf publicwebdir)==0
      dir = path.substring publicwebdir.length+1
      cwd = path.substring 0, publicwebdir.length
      doSpawn task, "rm", ["-r", dir], cwd, false
    else
      return taskError task, "Could not split dir/path #{path}"

addRmTask = (path) ->
  taskQueue.splice 0,0,
    id: "rm"
    internal: true
    config:
      taskType: 'rm'
      path: path
      _id: "taskcofig:#{encodeURIComponent path}:rm"
      lastChanged: new Date().getTime()
      enabled: true
  log "addRmTask #{path}"

doSpawn = (task, cmd, args, cwd, dolog, continuation) ->
  log "doSpawn: #{cmd} #{JSON.stringify args} in #{cwd}"
  if dolog
    try
      out = fs.openSync("#{cwd}/out.log", 'a')
      err = fs.openSync("#{cwd}/out.log", 'a')
      logstdio = [ 'ignore', out, err ]
    catch err
      log "doSpawn: error opening log file #{err.message}"
      return taskError task, "Unable to open task log files"
  else
    logstdio = ['ignore','ignore','ignore']
  try
    child = spawn cmd, args, 
      stdio: logstdio
      env: process.env
      cwd: cwd
  catch err
    log "doSpawn: error spawning #{cmd}: #{err.message}"
    child = null

  # just in parent?!      
  if dolog
    try
      fs.close out,(err)->if err? then log "doSpawn: error closing out #{out}"
    catch err
      log "doSpawn: error closing out #{err.message}"
    try
      fs.close err,(err)->if err? then log "doSpawn: error closing err #{out}"
    catch err
      log "doSpawn: error closing out #{err.message}"

  if not child?
    return taskError task, "Unable to run task script"

  state = ['running']
  timeout = setTimeout (()->killTask state,child,task), MAX_PROCESS_TIME

  child.on 'error', (err) ->
    log "child process reported error #{err} from state #{state[0]}"
    clearTimeout timeout
    if state[0]=='running'
      taskError task, "Problem running scropt (#{err})"
    state[0] = 'error'

  child.on 'close', (code) ->
    log "child process exited with code #{code} from state #{state[0]}"
    clearTimeout timeout
    if state[0]=='running'
      if code==0
        if continuation?
          continuation task
        else
          taskDone task
      else
        taskError task, "Script exiting reporting error #{code}"
    state[0] = 'closed'
      
killTask = (state,child,task) ->
  log "killing task #{task.id}"
  state[0]='killing'
  taskError task,"The task has taken too long - it probably isn't working"
  try 
    child.kill()
  catch err
    log "killTask: error doing kill: #{err.message}"

  killTask2 = () ->
    if state[0]!='killing'
      return
    try 
      log "killTask: try SIGKILL"
      child.kill 'SIGKILL'
    catch err
      log "killTask: error doing kill(SIGKILL): #{err.message}"
    setTimeout killTask3,10000

  killTask3 = () ->
    if state[0]!='killing'
      return
    try 
      log "killTask: try detach"
      child.disconnect()
    catch err
      log "killTask: error doing disconnect: #{err.message}"

  setTimeout killTask2,5000

handleUpload = (req, res, pathels, uploaddir) ->
    if pathels.length!=1
      res.writeHead 404, {'content-type': 'text/plain'}
      res.end "Not found (upload #{req.url})"
      return

    name = pathels[0]
    name = decodeURIComponent name
    ts = for id,t of tasks when t.config?._id==name
      t
    if ts.length==0
      res.writeHead 404, {'content-type': 'text/plain'}
      res.end "Upload task unknown (#{name})"
      return
    task = ts[0]
    log "upload for task #{task.id}, #{req.method}"
    if not task.targetState? or task.targetState.state!="waiting"
      res.writeHead 404, {'content-type': 'text/plain'}
      res.end "Task #{name} is not waiting for upload (#{task.targetState.state})"
      return
      
    if req.method == 'POST' 
      # parse a file upload
      form = new multiparty.Form
        uploadDir: uploaddir
        maxFilesSize: MAX_FILES_SIZE
        autoFiles: true
  
      form.parse req, (err, fields, files) ->
        if err?
          res.writeHead 400, {'content-type': 'text/plain'}
          res.end "Form upload error - #{err}"
          return        

        log "uploaded #{JSON.stringify files}"
        file = files['upload']
        if file.length>0
          file = file[0]
        else
          file = null
        if not file?
          res.writeHead 400, {'content-type': 'text/plain'}
          res.end "Form upload file not found - did you use the right upload form?"
          return

        path = file.path
        fn = file.originalFilename
        length = file.size
        log "uploaded #{fn} (#{length} bytes) to #{path}"

        taskPath = checkPath task, publicwebdir, true
        if not taskPath?
          res.writeHead 500, {'content-type': 'text/plain'}
          res.end "Could not create incoming directory #{task.config.path}"
          return
        taskFile = "#{taskPath}.tgz"
        try
          fs.renameSync path, taskFile
        catch err
          res.writeHead 500, {'content-type': 'text/plain'}
          res.end "Could not move incoming file to target: #{err.message}"
          return
        task.uploadFile = taskFile
        task.uploadTime = new Date().getTime()
        log "done upload #{task.id} - schedule"
        taskQueue.push task
        setTimeout schedule,0

        res.writeHead 200, {'content-type': 'text/plain'}
        res.end 'received upload file ('+length+' bytes); scheduled for processing\n'
      return

    else if req.method == 'HEAD' 
      res.writeHead 200, 'content-type': 'text/html'
      res.end()

    else if req.method == 'GET' 
      # show a file upload form
      res.writeHead 200, 'content-type': 'text/html'
      res.end(
        '<form action="" enctype="multipart/form-data" method="post">'+
        '<input type="file" name="upload" multiple="multiple"><br>'+
        '<input type="submit" value="Upload">'+
        '</form>'
      )
    else
      res.writeHead 405, {'content-type': 'text/plain', 'allow': 'GET, HEAD, POST'}
      res.end "Not allowed: #{req.method}"

getServerUrl = (task) ->
  # buildserver task only! 
  if not task.config.subjectId
    return null
  ix = task.config.subjectId.lastIndexOf ':'
  dbname = task.config.subjectId.substring (ix+1)
  if not dbname
    return null
  ix = dburl.lastIndexOf '/'
  couchurl = dburl.substring 0, ix
  serverurl = couchurl+'/'+dbname
  serverurl

servers = {}

headers =
        'content-type': 'text/plain'
        'access-control-allow-origin': '*'


handleFormdata = (req, res, formdatasub, serverurl, nano) ->
  try
    formdata = JSON.parse formdatasub
  catch err
    res.writeHead 400, headers
    res.end "Form data parse error: #{err.message}"
    return        
  # submission metadata cf https://bitbucket.org/javarosa/javarosa/wiki/OpenRosaMetaDataSchema
  # JSON has no attributes per se (for required form id & optional version) so we will
  # pass in meta section as id & version
  # In meta, instanceID as required to uniquely identify form instance (version), as 'uuid:...'
  # e.g. {"meta":{"id":"123","instanceID":"uuid:234"}}
  # Other defined instance metadata: timeStart, timeEnd, userID (mailto: openid:), 
  #   deviceID (imei: mac: uuid:), 
  #   deprecatedID (superceded instance/version) 
  meta = formdata.meta
  if not meta or not meta.id or not meta.instanceID
    res.writeHead 400, headers
    res.end "Form data missing required metadata: #{JSON.stringify meta}"
    return

  # TODO check valid form ID, etc.?
  # TODO check valid data?
  now = new Date().getTime()
  submission = 
          _id: 'submission:'uuid()
          type: 'submission'
          data: formdata
          submissiontime: now
          request:
            httpVersion: req.httpVersion
            url: req.url
            headers: 
              host: req.headers['host']
              origin: req.headers['origin']
              via: req.headers['via']
              useragent: req.headers['user-agent']
              referer: req.headers['referer']
              date: req.headers['date']
            clientAddress: req.socket?.remoteAddress

        nano.insert submission, (err, body) ->
          if err
            log "Error adding form submission to db #{serverurl}: #{err}"
            res.writeHead 500, headers
            res.end 'Error adding form submission to db'
            return
          log "Added form submission to db #{serverurl} as #{submission._id}"
          # OpenRosa created, not 200
          res.writeHead 201, headers
          # Warning: non-standard response
          res.end "Added form submission to db #{serverurl} as #{submission._id}"
          return

handleSubmission = (req, res, pathels, uploaddir) ->
    if pathels.length!=1
      res.writeHead 404, headers
      res.end "Not found (submission #{req.url})"
      return

    name = pathels[0]
    name = decodeURIComponent name
    ts = for id,t of tasks when t.config?.taskType=='buildserver' and t.config?.subjectId==name
      t
    if ts.length==0
      res.writeHead 404, headers 
      res.end "Submission server unknown (#{name})"
      return
    task = ts[0]
    log "submission for server #{task.config.subjectId}, task #{task.id}, #{req.method}"
    serverurl = getServerUrl task
    nano = servers[serverurl]
    if not nano
      console.log "Initialise nano for submission server #{serverurl}"
      servers[serverurl] = nano = require('nano') serverurl

    if req.method == 'POST'
      contenttype = req.headers['content-type']
      if (contenttype.indexOf 'multipart/form-data') == 0

        # parse a file upload
        form = new multiparty.Form
          uploadDir: uploaddir
          maxFilesSize: MAX_FILES_SIZE
          autoFiles: true
  
        form.parse req, (err, fields, files) ->
          if err?
            res.writeHead 400, headers
            res.end "Form submission error - #{err}"
            return        

          log "uploaded submission #{JSON.stringify fields} with #{JSON.stringify files}"
          formdatasub = fields['json_submission_file']
          if not formdatasub
            res.writeHead 400, headers
            res.end "Form field 'json_submission_file' not found"
            return        
          handleFormdata req, res, formdatasub, serverurl, nano

      else if contenttype == 'application/x-www-form-urlencoded' 
        body = ''
        req.on 'data', (data) ->
            body += data;
            # Too much POST data, kill the connection!
            if (body.length > 1e6)
              req.connection.destroy()
        req.on 'end', () ->
          parameters = body.split '&'
          for p in parameters
            ix = p.indexOf '='
            if ix>=0
              pname = decodeURIComponent (p.substring 0,ix)
              if pname == 'json_submission_file'
                formdatasub = decodeURIComponent (p.substring ix+1)
                #console.log "got json_submission_file = #{formdata}"
                return handleFormdata req, res, formdatasub, serverurl, nano  
          res.writeHead 400, headers
          res.end "Form field 'json_submission_file' not found"

      else
        res.writeHead 400, 
          'content-type': 'text/html'
          'access-control-allow-origin': '*'
        res.end "Unsupported POST content-type #{contenttype}"

    else if req.method == 'HEAD' 
      res.writeHead 200, 
        'content-type': 'text/html'
        'access-control-allow-origin': '*'
      res.end()

    else if req.method == 'GET' 
      # show a form upload form
      res.writeHead 200, 
        'content-type': 'text/html;charset=utf-8'
        'access-control-allow-origin': '*'
      # cf OpenDataKit / OpenRosa / JavaRosa
      # https://bitbucket.org/javarosa/javarosa/wiki/FormSubmissionAPI
      # i.e. multipart/form-data, one (first) part 
      # Content Type: application/json (NOT text/xml), Name: json_submission_file (NOT xml_submission_file)
      # TODO: file attachments?
      res.end(
        '<form action="" enctype="multipart/form-data" method="post">'+
        '<label>JSON submission data<br/><textarea name="json_submission_file" style="width:90%;"></textarea></label><br/>'+
        '<input type="submit" value="Upload (form-data)">'+
        '</form>'+
        '<form action="" enctype="application/x-www-form-urlencoded" method="post">'+
        '<label>JSON submission data<br/><textarea name="json_submission_file" style="width:90%;"></textarea></label><br/>'+
        '<input type="submit" value="Upload (url-encoded)">'+
        '</form>'
      )

    else
      res.writeHead 405, 
        'content-type': 'text/plain'
        'access-control-allow-origin': '*'
        'allow': 'GET, HEAD, POST'
      res.end "Not allowed: #{req.method}"

startUploadServer = () ->
  uploaddir = "#{publicwebdir}/upload"
  if !fs.existsSync uploaddir
    try
      fs.mkdirSync uploaddir,0o755
    catch err
      log "Error creating upload dir #{uploaddir}: #{err.message}"
      return

  http.createServer (req, res) ->
    url = parse_url req.url
    pathels = url.pathname.split '/'
    if pathels.length>0 && pathels[0]==''
      pathels.splice 0,1
    if pathels.length==0
      res.writeHead 403, {'content-type': 'text/plain'}
      return res.end "Access denied (/)"
    switch pathels[0]
      when 'upload'  
        pathels.splice 0,1
        handleUpload req,res,pathels,uploaddir
      when 'submission' 
        pathels.splice 0,1
        handleSubmission req,res,pathels,uploaddir
      else
        res.writeHead 404, {'content-type': 'text/plain'}
        res.end "Not found (#{req.url})"

  .listen(serverport)
  log "created upload server on port #{serverport}"

doImport = (task) ->
  # should have .uploadFile and dir, but could be old stuff in it
  if not (path=(checkPath task, publicwebdir, true))?
    return
  if (path.indexOf publicwebdir)!=0
    return taskError task, "Could not split dir/path #{path}"
  dir = path.substring publicwebdir.length+1
  cwd = path.substring 0, publicwebdir.length
  doSpawn task, "rm", ["-r", dir], cwd, false, (task)->
    checkPath task, publicwebdir, true
    file = path
    ix = file.lastIndexOf '/'
    if ix>=0
      file = file.substring ix+1
    tar = "../#{file}.tgz"
    doSpawn task, "tar", ["zxf", tar], path, false, (task)->
      doSpawn task, "/usr/local/bin/coffee", ["#{__dirname}/cache2couch.coffee",".",dburl], path, true

gcTask = (task) ->
  if task.config?.path?
    addRmTask task.config.path
    addRmTask task.config.path+".tgz"
  else if task.serverState?.path
    addRmTask task.serverState.path
    addRmTask task.serverState.path+".tgz"
  else if task.targetState?.path
    addRmTask task.targetState.path
    addRmTask task.targetState.path+".tgz"
  else
    log "gcTask #{task.id} cannot find path"

doBuildserver = (task) ->
  serverurl = getServerUrl task
  if not serverurl
    return taskError task, "Buildserver did not specify valid subjectId: #{task.config?.subjectId}"
  # DB exists? if not expect 404

  utils.readJson serverurl, (err,res) ->
    if err==404
      log "Create non-existent db #{serverurl}"
      return utils.doHttp serverurl,'PUT','', (err,res) ->
        if err
          return taskError task, "Could not create database #{serverurl}: #{err}"
        return updateServer task, serverurl
    else if err
      return taskError task, "Error checking database #{serverurl}: #{err}"
    log "Database #{serverurl} already exists: #{res}"
    return updateServer task, serverurl

updateServer = (task, serverurl) ->
  nano = require('nano') serverurl
  # (re)initialise security
  utils.doHttp "#{serverurl}/_security",'PUT','{"admins":{"names":["admin"],"roles":[]},"members":{"names":[],"roles":["serverreader","serverwriter"]}}', (err,res) ->
    if err
      return taskError task,"Error updating security on #{serverurl}: #{err}"
    log "Updated security on #{serverurl}"
    updateServerapp task, serverurl, nano

SERVERDIR = __dirname+"/../server"
updateServerapp = (task, serverurl, nano) ->
  console.log "Pushing server app to #{serverurl}"
  doSpawn task, "/usr/bin/node", [SERVERDIR+"/../node_modules/couchapp/bin.js", "push", SERVERDIR+"/couchapp/server.js", serverurl], SERVERDIR, true, (task)->
    # replicate Forms associated with Server (via Apps)
    # query view _design/app/_view/serverId with key=serverId
    formIds = []
    couchurl = dburl.substring 0,(serverurl.lastIndexOf '/')
    hubdbname = dburl.substring (dburl.lastIndexOf '/')+1
    serverdbname = serverurl.substring (serverurl.lastIndexOf '/')+1
    nanodb = require('nano') couchurl
    nanohub = nanodb.use hubdbname
    nanohub.view 'app', 'serverId', {
        include_docs: true
        key: task.config.subjectId
      }, (err, body) ->
      if err
        return taskError task,"Error listing apps for server #{task.config.subjectId}: #{err}"
      # rows .id .doc
      log "Found #{body.rows?.length} Apps for server #{task.config.subjectId}" # #{JSON.stringify body}"
      for row in (body.rows ? []) 
        # check items for .type 'form' -> .id
        for item in (row.doc?.items ? []) when item.type=='form' and item.id
          formIds.push item.id
      log "Found #{formIds.length} Forms referred to be Apps"
      # replicate from mediahub to server db with docs_ids = [form ids])
      nanodb.db.replicate hubdbname, serverdbname, {
          continuous: false
          create_target: false
          doc_ids: formIds
        }, (err, body) ->
          if err
            return taskError task,"Error replicating forms from #{hubdbname} to #{serverdbname}: #{err}"
          if not body.ok
            return taskError task,"Error replicating forms from #{hubdbname} to #{serverdbname}: reponse not ok: #{JSON.stringify body}"
          log "Replicated #{formIds.length} forms from #{hubdbname} to #{serverdbname}: #{JSON.stringify body}"
          # TODO - update nginx config
          taskDone task

