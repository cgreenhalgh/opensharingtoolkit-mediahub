# node task runner for mediahub
fs = require('fs')
spawn = require('child_process').spawn
   
log = (msg) -> 
  # compatible with couchdb external processes
  console.log JSON.stringify ["log", msg]

dburl = 'http://127.0.0.1:5984/mediahub'
publicwebdir = '../docker/nginxdev/html/public'
MAX_PROCESS_TIME = 30000

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
    if !started
      started = true
      start()

  catch err
    log "Error reading config #{d}: #{err.message}"

log 'requesting config like { "dburl": "http://127.0.0.1:5984/mediahub", "publicwebdir": "/..." }'
console.log JSON.stringify ["get", "taskrunner"]

tasks = {} 

db = null
approot = null
publicwebdirerror = true

start = () ->
  log "connect to #{dburl}"
  db = require('nano') dburl
  # errors?

  log "using publicwebdir #{publicwebdir}"
  if fs.existsSync publicwebdir
    publicwebdirerror = false

  approot = "#{publicwebdir}/apps"
  if not fs.existsSync approot and not publicwebdirerror
    try
      fs.mkdirSync approot
    catch err
      log "Error creating approot #{approot}: #{err.message}"

  db.list
    include_docs: true
    startkey: 'taskstate:'
    endkey: 'taskstate;'
   , (err, body) ->
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

taskQueue = []
activeTask = null

startTasks = () ->
  getChanges()

lastSequence = null

getChanges = () ->
  params = 
    include_docs: true
    #live: true
    filter: 'app/typeTaskconfig'
    feed: 'longpoll'
  if lastSequence?
    params.since = lastSequence
  feed = db.changes params, (err,changes)->
    if err?
      log "getChanges: error getting changes: #{err.message}"
      setTimeout getChanges,5000
      return
    lastSequence = changes.last_seq
    log "change config: #{changes.results.length} changes, last_seq #{changes.last_seq}"
    for change in changes.results
      updateConfig change.doc
    setTimeout getChanges,100

updateConfig = (config) ->
  id = config._id
  ix = id.indexOf ':'
  if ix>=0 then id = id.substring ix+1
  task = tasks[id]
  if not task?
    tasks[id] = task = { id: id }
  log "#{if task.config? then 'update' else 'add'} task #{id} config #{JSON.stringify config}"
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
  schedule()

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
  if not next.targetState?
    next.targetState = { _id: "taskstate:#{next.id}", type: 'taskstate' }
  if next.config.enabled!=true
    log "schedule: task #{next.id} not enabled"
    next.targetState.lastUpdate = new Date().getTime()
    next.targetState.state = "disabled"
    next.targetState.message = "Task is disabled"
    setTimeout schedule,0
    sendState next
    return
  # start?
  if next.serverState.lastConfigChanged? and not next.targetState.lastConfigChanged?
    next.targetState.lastConfigChanged = next.serverState.lastConfigChanged
  if next.targetState.lastConfigChanged >= next.config.lastChanged
    log "schedule: task #{next.id} done since last update #{next.targetState.lastConfigChanged} / #{next.config.lastChanged}"
    setTimeout schedule, 0
    next.targetState.lastUpdate = new Date().getTime()
    next.targetState.state = "done"
    next.targetState.message = "Task already done since last request"
    sendState next
    return

  log "schedule: start task #{next.id} #{next.config.taskType} #{next.config.subjectId}"
  next.targetState.lastUpdate = new Date().getTime()
  next.targetState.state = "starting"
  next.targetState.message = "Running task..."
  next.targetState.nextConfigChanged = next.config.lastChanged
  sendState next
  activeTask = next

  if next.config.taskType=='exportapp'
    if publicwebdirerror
      return taskError next,"Public web directory not found (#{publicwebdir})"
    doExportapp next
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
  if task.sendingState?
    log "sendState: already active for #{task.id}"
    return
  if not task.serverState?
    task.sendingState = JSON.parse (JSON.stringify task.targetState)
    log "sendState: create state #{task.targetState._id}"
    db.insert task.sendingState, (err,response) ->
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
    db.insert task.sendingState, (err,response) ->
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
  db.get task.targetState._id, (err,doc) ->
    if err?
      log "sendState: checkServerState #{task.targetState._id} error #{err}"
      return
    log "sendState: checkServerState -> #{JSON.stringify doc}"
    task.serverState = doc
    sendState task

doExportapp = (task) ->
  appId = task.config.subjectId
  if not appId?
    return taskError task, "App to export was not specified ('subjectId')"
  appurl = "#{dburl}/_design/app/_show/app/#{appId}"
  path = task.config.path
  if path? 
    if (path.indexOf '/')!=0
      path = '/'+path
    path = approot+path
  else
    path = approot
  doSpawn task, "/usr/local/bin/coffee", ["#{__dirname}/exportapp.coffee",appurl], path

doSpawn = (task, cmd, args, cwd) ->
  log "doSpawn: #{cmd} #{JSON.stringify args} in #{cwd}"
  try
    out = fs.openSync("#{cwd}/out.log", 'a')
    err = fs.openSync("#{cwd}/out.log", 'a')
  catch err
    log "doSpawn: error opening log file #{err.message}"
    return taskError task, "Unable to open task log files"

  try
    child = spawn cmd, args, 
      stdio: [ 'ignore', out, err ]
      env: process.env
      cwd: cwd
  catch err
    log "doSpawn: error spawning #{cmd}: #{err.message}"
    child = null

  # just in parent?!      
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
        taskDone task
      else
        taskError task, "Script exiting reporting error #{code}"
    state[0] = 'closed'
      
killTask = (status,child,task) ->
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

