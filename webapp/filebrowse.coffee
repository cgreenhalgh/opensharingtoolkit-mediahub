# filebrowse App - for ckeditor integration, initially images

FilteredFileList = require 'models/FilteredFileList'
ImageSelectListView = require 'views/ImageSelectList'
FileSelectListView = require 'views/FileSelectList'
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

    fileList = new FilteredFileList [], fileType: typePrefix
    try 
      server.working 'fileList'
      fileList.fetch
        success: server.success
        error: server.error
    catch err
      alert "Error getting files: #{err.message}"

    if (typePrefix.indexOf 'image')==0
      fileListView = new ImageSelectListView model: fileList
      fileListView.render()
      $('body').append fileListView.el

    else
      fileListView = new FileSelectListView model: fileList
      fileListView.render()
      $('body').append fileListView.el

module.exports = App

