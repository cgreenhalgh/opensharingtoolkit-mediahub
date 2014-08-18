# working interaction feedback

workingCount = 0

module.exports.working = (msg) ->
    workingCount++
    console.log "app working (#{workingCount}) #{msg}..."
    $('#workingModal').removeClass 'hide'

module.exports.done = () ->
    workingCount = Math.max 0, (workingCount-1)
    console.log "app done (#{workingCount})"
    if workingCount<=0
      $('#workingModal').addClass 'hide'


