# locked stuff

templateLockedModal = require 'templates/LockedModal'

module.exports.showLockedAlert = (model) ->
  $('#lockedModalHolder').html templateLockedModal {title:'Sorry, this item is currently locked', description:'You may be able to unlock it by scanning or entering a code.' }
  $('#lockedModalHolder').foundation 'reveal', 'open'

module.exports.unlock = ( type, code ) ->

