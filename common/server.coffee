# server interaction feedback
templateErrorModal = require 'templates/ErrorModal'

workingCount = 0

module.exports.working = (msg) ->
    workingCount++
    console.log "server working (#{workingCount}) #{msg}..."
    $('#workingModal').removeClass 'hide'

module.exports.success = () ->
    workingCount = Math.max 0, (workingCount-1)
    console.log "server success (#{workingCount})"
    if workingCount<=0
      $('#workingModal').addClass 'hide'

module.exports.error = (model,resp,options) ->
    workingCount = Math.max 0, (workingCount-1)
    message = "#{resp}"
    if options?.textStatus 
      message = "#{message}, textState #{options.textStatus}"
    if options?.errorThrown 
      message = "#{message}, errorThrown #{options.errorThrown}"

    console.log "server error  (#{workingCount}) #{message}"
    if workingCount<=0
      $('#workingModal').addClass 'hide'

    $('#errorModalHolder').html templateErrorModal {message:message}
    $('#errorModalHolder').foundation 'reveal', 'open'

