# add TaskConfig (specify path) handler
templateTaskConfigPathModal = require 'templates/TaskConfigPathModal'
TaskConfig = require 'models/TaskConfig'

currentModel = null

$('#taskConfigPathModalHolder').on 'closed.fndtn.reveal',  () ->
  #.fndtn.reveal
  console.log "taskConfigPathModalHolder closed.fndtn.reveal"
  currentModel = null

$('#taskConfigPathModalHolder').on 'opened.fndtn.reveal',  () ->
  #.fndtn.reveal
  console.log "taskConfigPathModalHolder opened"
  $('#taskConfigPathModalHolder input[name=path]').focus()

$('#taskConfigPathModalHolder').on 'submit', (ev)->
  ev.preventDefault()

  path = $('#taskConfigPathModalHolder input[name=path]').val()
  console.log "do-ok #{currentModel._id} '#{path}'"
  while (path.indexOf '/')==0
    path = path.substring 1
  while path.length>0 and (path.lastIndexOf '/')==(path.length-1)
    path = path.substring 0, (path.length-1)

  if path.length==0
    # need a path
    return

  # mutate!
  currentModel.path = path
  currentModel._id = "taskconfig:#{encodeURIComponent path}"
  if currentModel._suffix?
    currentModel._id = currentModel._id+currentModel._suffix
    delete currentModel._suffix

  $('#taskConfigPathModalHolder').foundation 'reveal', 'close'

  if currentModel? and currentModel._id
    console.log "try #ContentType/taskconfig/add/#{encodeURIComponent currentModel._id} with #{JSON.stringify currentModel}"
    TaskConfig.addingThings[currentModel._id] = currentModel
    window.router.navigate "#ContentType/taskconfig/add/#{encodeURIComponent currentModel._id}", trigger:true
    currentModel = null
  else
    console.log "error: taskConfigPathModalHolder do-ok with null currentModel" 

$('#taskConfigPathModalHolder').on 'click', '.do-close', (ev)->
  console.log "taskConfigPathModalHolder do-close"
  currentModel = null
  $('#taskConfigPathModalHolder').foundation 'reveal', 'close'

module.exports.add = (attributes) ->
    console.log "addTaskConfig #{attributes._id}"
    currentModel = attributes
    $('#taskConfigPathModalHolder').html templateTaskConfigPathModal attributes
    $('#taskConfigPathModalHolder').foundation 'reveal', 'open'

