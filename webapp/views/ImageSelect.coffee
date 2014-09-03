# ImageSelect View
templateImageSelect = require 'templates/ImageSelect'
getParams = require 'getParams'
FileSelectView = require 'views/FileSelect'

module.exports = class ImageSelectView extends FileSelectView

  className: 'columns image-select'

  template: (d) =>
    templateImageSelect d

  preview: (ev) =>
    console.log "preview #{@model.attributes._id}"
    ev.preventDefault()
    # TODO


