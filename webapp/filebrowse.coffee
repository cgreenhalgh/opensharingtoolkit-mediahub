# filebrowse App - for ckeditor integration, initially images

ImageList = require 'models/ImageList'
ImageSelectListView = require 'views/ImageSelectList'
getParams = require 'getParams'
server = require 'server'

db = require 'mydb'

require 'plugins/File'


App = 
  init: ->
    console.log "filebrowse App starting..."
    params = getParams()
    typePrefix = params.type ?= ''

    Backbone.sync =  BackbonePouch.sync
      db: db

    Backbone.Model.prototype.idAttribute = '_id'
    _.extend Backbone.Model.prototype, BackbonePouch.attachments()

    fileList = new ImageList()
    try 
      server.working 'fileList'
      fileList.fetch
        success: server.success
        error: server.error
    catch err
      alert "Error getting files: #{err.message}"

    fileListView = new ImageSelectListView model: fileList
    fileListView.render()
    $('body').append fileListView.el

module.exports = App

