# delete handler
templateFileDeleteModal = require 'templates/ThingDeleteModal'
server = require 'server'

currentModel = null

$('#deleteModalHolder').on 'closed', '[data-reveal]',  () ->
  console.log "deleteModalHolder closed"
  currentModel = null

$('#deleteModalHolder').on 'click', '.do-delete', (ev)->
  console.log "do-delete #{currentModel.id}"
  if currentModel?
    server.working 'destroy (delete)'
    if false==currentModel.destroy {
        success: server.success
        error: server.error
      }
      console.log "destroy (delete) #{currentModel.id} returned false"
      server.success currentModel,null,{}
    currentModel = null
  $('#deleteModalHolder').foundation 'reveal', 'close'

$('#deleteModalHolder').on 'click', '.do-close', (ev)->
  console.log "deleteModalHolder do-close"
  currentModel = null
  $('#deleteModalHolder').foundation 'reveal', 'close'

module.exports.delete = (model) ->
    console.log "delete #{model.attributes._id}"
    currentModel = model
    $('#deleteModalHolder').html templateFileDeleteModal model.attributes
    $('#deleteModalHolder').foundation 'reveal', 'open'

