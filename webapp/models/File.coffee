# A file/fragment
module.exports = class File extends Backbone.Model
  defaults:
    title: ''
    description: ''
    type: 'file'
    ratingSum: 0
    ratingCount: 0

  download: (ev) =>
    if ev?
      ev.preventDefault()
    console.log "Save #{@id}"
    @attachment "bytes",(error,blob)=>
      if error?
        console.log "Error getting file attachment: #{error}"
      else
        console.log "Got file attachment for #{@id}"
        saveAs blob, @get 'title'

