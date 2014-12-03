# updateserverfarm.coffee

fs = require 'fs'
os = require 'os'
exec = (require 'child_process').exec

errors = []

log = (msg) ->
  console.log msg

logError = (msg) ->
  log "Error: #{msg}"
  errors.push msg

done = () ->
  if errors.length>0
    log "There were #{errors.length} errors"
    process.exit 1
  log "No errors"
  process.exit 0

doneError = (msg) ->
  logError msg
  done()

get_local_ip = () ->
  interfaces = os.networkInterfaces()
  addresses = []
  bestaddresses = []
  for name,ifaddresses of interfaces 
    for address in ifaddresses
        if address.family == 'IPv4' && !address.internal
            addresses.push address.address
            # prefer interfaces called 'docker...'
            if name.substring(0,6)=='docker'
              bestaddresses.push address.address
            #log "found interface #{name} = #{address.address}"
  if addresses.length==0
    doneError 'Could not get local IP address'
  if bestaddresses.length>0
    log "using local IP address #{bestaddresses[0]}"
    return bestaddresses[0]
  log "using local IP address #{addresses[0]} (could not find docker address)"
  addresses[0]

local_ip = get_local_ip()

readConfig = (configfile) ->
  log "Read config #{configfile}"
  config = null
  try 
    config = fs.readFileSync configfile, {encoding:'utf8'}
  catch err
    doneError "reading config file #{configfile}: #{err.message}"

  lines = config.split '\n'
  # INSTANCENAME  IMAGE  LOCALPORT  STATE  # comment...

  instances = []
  linepatt = /^(\S+)\s+(\S+)\s+(\d+)\s+(\S+)$/
  for line in lines
    cix = line.indexOf '#'
    if cix>=0
      line = line.substring 0,cix
    line = line.trim()
    if line.length==0
      continue
    items = linepatt.exec line
    if items==null
      logError "Could not parse line: #{line}"
      continue
    instances.push name: items[1], image: items[2], port: Number(items[3]), state: items[4]
  instances

if process.argv.length!=3
  doneError 'usage: coffee updateserverfarm.coffee CONFIGFILE'

configfile = process.argv[2]

configpath = configfile
try 
  configpath = fs.realpathSync configfile
catch err
  doneError "Getting real path of config file #{configfile}: #{err.message}"

instances = readConfig configpath
log "read config #{JSON.stringify instances}"

ix = configpath.lastIndexOf '/'
rootdir = configpath.substring 0, ix+1
log "Using root directory #{rootdir}"

localserversdir = rootdir+"nginx-local-servers"

if !fs.existsSync localserversdir
  log "create local servers dir #{localserversdir}"
  try
    fs.mkdirSync localserversdir
  catch err
    doneError "could not create local servers dir #{localserversdir}: #{err.message}"

oldlocalserversdir = localserversdir+"/old"

if !fs.existsSync oldlocalserversdir
  log "create old local servers dir #{oldlocalserversdir}"
  try
    fs.mkdirSync oldlocalserversdir
  catch err
    doneError "could not create old local servers dir #{oldlocalserversdir}: #{err.message}"

publichtmldir = rootdir+"nginx-public-html"

if !fs.existsSync publichtmldir
  log "create public html dir #{publichtmldir}"
  try
    fs.mkdirSync publichtmldir
  catch err
    doneError "could not create public html dir #{publichtmldir}: #{err.message}"

subdirs = 
  'couchdb': '/var/lib/couchdb'
  'log': null
  'log/nginx': '/var/log/nginx'
  'log/couchdb': '/var/log/couchdb'
  'setup': '/home/root/setup'
  'nginx-etc': null
  'nginx-etc/conf': '/etc/nginx/conf'
  'nginx-etc/sites-available': '/etc/nginx/sites-available'
  'nginx-etc/mediahub-servers': '/etc/nginx/mediahub-servers'
#  'public': '/usr/share/nginx/html/public'

exportfiles = 
  'couchdb/mediahub.couch': 'cp /var/lib/couchdb/* /export/couchdb/'

templatefiles =
  'nginx-etc/sites-available/default': 'templates/sites-available/default'

updateInstance = (instance, continuation) ->
  if instance.state!='enabled'
    log "stop #{instance.name} - state not enabled (#{instance.state})"
    # stop in case?
    cmd = "sudo docker stop #{instance.name}"
    return exec cmd, (error, stdout, stderr) ->
      if error==null
        log "stopped image #{instance.name}: #{stdout.trim()}"
      continuation()
  restart = false
  instancehtmldir = publichtmldir+'/'+instance.name
  if !fs.existsSync instancehtmldir
    log "Create instance html directory #{instancehtmldir}"
    try 
      fs.mkdirSync instancehtmldir
      restart = true
    catch err
      logError "unable to create instance html dir #{instancehtmldir}: #{err.message}"
      return continuation()
  publicinstancehtmldir = instancehtmldir+'/public'
  if !fs.existsSync publicinstancehtmldir
    log "Create public instance html directory #{publicinstancehtmldir}"
    try 
      fs.mkdirSync publicinstancehtmldir
      restart = true
    catch err
      logError "unable to create public instance html dir #{publicinstancehtmldir}: #{err.message}"
      return continuation()
  instancedir = rootdir+instance.name
  if !fs.existsSync instancedir
    log "Create instance directory #{instancedir}"
    try 
      fs.mkdirSync instancedir
      restart = true
    catch err
      logError "unable to create instance dir #{instancedir}: #{err.message}"
      return continuation()
  for subdir,mount of subdirs
    dir = instancedir+'/'+subdir
    if !fs.existsSync dir
      try 
        fs.mkdirSync dir
        restart = true
      catch err
        logError "unable to create instance sub-dir #{dir}: #{err.message}"
        return continuation()
  for file,template of templatefiles
    tofile = instancedir+'/'+file
    if !fs.existsSync tofile
      try
        f = fs.readFileSync __dirname+'/'+template, {encoding:"utf8"}
        fs.writeFileSync tofile, f, {encoding:"utf8"}
        restart = true
        log "Created config file #{tofile} from template #{template}"
      catch err
        logError "unable to create config file #{tofile} from template #{template}: #{err.message}"
        return continuation()
  # front-end nginx config
  subvars = 
    '#{NAME}': instance.name
    '#{HOST}': "#{local_ip}:#{instance.port}"
    '#{CONTAINER}': instance.name
  for templateprotocol in ['http','https']
    template = "templates/local-servers/local-server-#{templateprotocol}.conf.template"
    tofile = "#{localserversdir}/#{instance.name}-#{templateprotocol}.conf"
    oldfile = "#{oldlocalserversdir}/#{instance.name}-#{templateprotocol}.conf"
    action = if !fs.existsSync tofile then "Creating" else "Updating"
    try
      f = fs.readFileSync __dirname+'/'+template, {encoding:"utf8"}
      for n,v of subvars
        f = f.replace (new RegExp(n,"g")), v
      fs.writeFileSync tofile, f, {encoding:"utf8"}
      unchanged = false
      if fs.existsSync oldfile
        try
          f2 = fs.readFileSync oldfile, {encoding:"utf8"}
          unchanged = f==f2
        catch err
          log "warning: unable to read (check) front-end config file #{oldfile}: #{err.message}"
      if !unchanged
        log "#{action} front-end config file #{tofile} from template #{template}"
    catch err
      logError "unable to create front-end config file #{tofile} from template #{template}: #{err.message}"
      return continuation()

  for file,command of exportfiles
    if !fs.existsSync instancedir+'/'+file
      log "Export initial file #{file}"
      cmd = "echo '#{command}' | sudo docker run -i --rm -v #{instancedir}:/export mediahub /bin/bash"
      log "Export initial file #{file}: #{cmd}"
      return exec cmd, (error, stdout, stderr) ->
        if  error!=null
          logError "unable to extract initial file #{file}: #{stderr.trim()} (code #{error.code}) for #{cmd}"
          contination()
        else if !fs.existsSync instancedir+'/'+file
          logError "extract initial file #{file} did not create file with #{cmd}"
          continuation()
        else
          # next step...
          updateInstance instance, continuation


  ps = exec "sudo docker inspect --format '{{.State.Running}} {{.Image}}' #{instance.name}",
    { timeout: 10000 }, 
    (error, stdout, stderr) ->
      if  error==null
        out = stdout.trim().split ' '
        if not instance.imageid?
          logError "cannot confirm image up-to-date for instance #{instance.name}, unknown image #{instance.image}"
        else if out[1]!=instance.imageid
          log "instance #{instance.name} wrong image #{out[1]} vs #{instance.imageid}"
          if out[0]=='true'
            log "stop instance #{instance.name} running - wrong type"
            cmd = "sudo docker stop #{instance.name}"
            return exec cmd, (error, stdout, stderr) ->
              if error!=null
                logError "error doing docker stop for #{instance.name}: #{stderr} (code #{error.code}) for #{cmd}"
                continuation()
              else
                log "Stopped instance #{instance.name} with wrong image: #{stdout.trim()}"
                updateInstance instance, continuation
          else
            log "rm instance #{instance.name}  - wrong type"
            cmd = "sudo docker rm #{instance.name}"
            return exec cmd, (error, stdout, stderr) ->
              if error!=null
                logError "error doing docker rm for #{instance.name}: #{stderr} (code #{error.code}) for #{cmd}"
                continuation()
              else
                log "Removed instance #{instance.name} with wrong image: #{stdout.trim()}"
                updateInstance instance, continuation

        if out[0]=='true'
          if restart
            log "restart running instance #{instance.name} - change of config"
            cmd = "sudo docker stop #{instance.name}"
            return exec cmd, (error, stdout, stderr) ->
              if error!=null
                logError "error doing docker stop for #{instance.name}: #{stderr} (code #{error.code}) for #{cmd}"
                continuation()
              else
                log "Stopped instance #{instance.name} with updated config"
                updateInstance instance, continuation

          log "instance #{instance.name} running"
          continuation()
        else if out[0]=='false'
          cmd = "sudo docker start #{instance.name}"
          log "start instance #{instance.name}: #{cmd}"
          run = exec cmd, (error, stdout, stderr) ->
            if error!=null
              logError "error doing docker start for #{instance.name}: #{stderr} (code #{error.code}) for #{cmd}"
            else
              log "Started instance for #{instance.name}"
            continuation()
        else
          logError "Unknown instance state #{stdout} for #{instance.name}"
          continuation()
      else
        log "error inspecting instance #{instance.name}: code #{error.code} - #{stderr.trim()}"
        cmd = "sudo docker run -d --name #{instance.name} -h #{instance.name}"
        for subdir,mount of subdirs when mount!=null
          cmd = cmd+" -v #{instancedir}/#{subdir}:#{mount}"
        cmd = cmd+" -v #{publicinstancehtmldir}:/usr/share/nginx/html/public"
        cmd = cmd+" -p #{instance.port}:80 #{instance.image}"
        log "run instance #{instance.name}: #{cmd}"
        run = exec cmd, (error, stdout, stderr) ->
          if error!=null
            logError "error doing docker run for #{instance.name}: #{stderr} (code #{error.code}) for #{cmd}"
          else
            log "Started instance for #{instance.name}"
          continuation()

# the top-level code...

images = {}
nextImage = (instances, continuation) ->
  if instances.length==0
    return continuation()
  instance = instances[0]
  if images[instance.image]?
    nextImage (instances.slice 1), continuation
  else
    cmd = "sudo docker inspect --format '{{.Id}}' #{instance.image}"
    log "look up image #{instance.image}: #{cmd}"
    exec cmd, (error, stdout, stderr) ->
      if error!=null
        logError "could not inspect image #{instance.image}: #{stderr.trim()} (code #{error.code}) from #{cmd}"
        nextImage (instances.slice 1), continuation
      else
        images[instance.image] = stdout.trim()
        log "Found image #{instance.image} = #{images[instance.image]}"
        nextImage (instances.slice 1), continuation
    
nextInstance = (continuation) ->
  if instances.length==0
    return continuation()
  instance = (instances.splice 0, 1)[0]
  if images[instance.image]?
    instance.imageid = images[instance.image]
  updateInstance instance, ()->nextInstance(continuation)

initNginxConfig = () ->
  # move old front-end configs
  try
    configfiles = fs.readdirSync localserversdir
    for f in configfiles when f.length>=5 and f.substring(f.length-5)=='.conf'
      try
        fs.renameSync "#{localserversdir}/#{f}", "#{oldlocalserversdir}/#{f}"
      catch err
        log "warning: could not move away front-end config file #{localserversdir}/#{f} to #{oldlocalserversdir}/#{f}: #{err.message}"
  catch err
    logError "moving away front-end config files: #{err.message}"
  # nginx front-end php config
  subvars = 
    '#{HOST}': "#{local_ip}:9001"
  template = "templates/local-servers/php-http.conf.template"
  tofile = "#{localserversdir}/php-http.conf"
  oldfile = "#{oldlocalserversdir}/php-http.conf"
  action = if !fs.existsSync tofile then "Creating" else "Updating"
  try
    f = fs.readFileSync __dirname+'/'+template, {encoding:"utf8"}
    for n,v of subvars
      f = f.replace (new RegExp(n,"g")), v
    fs.writeFileSync tofile, f, {encoding:"utf8"}
    unchanged = false
    if fs.existsSync oldfile
      try
        f2 = fs.readFileSync oldfile, {encoding:"utf8"}
        unchanged = f==f2
      catch err
        log "warning: unable to read (check) front-end config file #{oldfile}: #{err.message}"
    if !unchanged
      log "#{action} front-end config file #{tofile} from template #{template}"
  catch err
    logError "unable to create front-end config file #{tofile} from template #{template}: #{err.message}"

initNginxConfig()

kickNginx = ()->
  cmd = "sudo docker kill -s HUP nginx"
  exec cmd, (error, stdout, stderr) ->
    if error!=null
      logError "Could not signal front-end nginx instance: #{stderr.trim()} (code #{error.code}) from #{cmd}"
    else
      log "Signalled front-end nginx instance"
    done()

nextImage instances, ()->nextInstance(kickNginx)



