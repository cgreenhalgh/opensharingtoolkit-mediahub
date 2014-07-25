# node task runner for mediahub
fs = require('fs')
multiparty = require('multiparty')
http = require('http')
spawn = require('child_process').spawn
parse_url = require('url').parse

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
MAX_PROCESS_TIME = 30000
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

startUploadServer = () ->
  uploaddir = "#{publicwebdir}/upload"
  if !fs.existsSync uploaddir
    try
      fs.mkdirSync uploaddir,0o755
    catch err
      log "Error creating upload dir #{uploaddir}: #{err.message}"
      return

  http.createServer (req, res) ->
    name = req.url
    if name.indexOf('/')==0
      name = name.substring 1
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

    # show a file upload form
    res.writeHead 200, 'content-type': 'text/html'
    res.end(
      '<form action="" enctype="multipart/form-data" method="post">'+
      '<input type="file" name="upload" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    )
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

