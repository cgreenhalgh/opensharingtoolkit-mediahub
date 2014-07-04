# FileEdit View
templateFileEdit = require 'templates/FileEdit'
templateFileDetail = require 'templates/FileDetail'

module.exports = class FileEditView extends Backbone.View

  constructor:(options)->
    @add = options.add ?= false
    @files = options.files ?= null
    super(options)

  tagName: 'div'
  className: 'row file-edit'
  #fileState: 'unchanged'
  #cancelled: false
  #created: false

  initialize: ->
    @fileState = 'unchanged'
    @cancelled = false
    @created = false
    #@listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFileEdit d

  render: =>
    console.log "render FileEdit #{@model.attributes._id}: #{ @model.attributes.title }"
    # TODO edit?
    @$el.html @template { data: @model.attributes, add: @add }
    # TODO file info
    @renderFileDetails()
    f = () -> $('input[name="title"]', @$el).focus()
    setTimeout f, 0
    @

  events:
    "submit": "submit"
    "click .do-cancel": "cancel"
    "click .do-url": "doUrl"
    "click .do-edit-image": "imageEdit"
    "click .do-save-image": "imageSave"
    "click .do-cancel-image": "imageCancel"
    "dragover .drop-zone": "handleDragOver"
    "drop .drop-zone": "handleDrop"
    "dragenter .drop-zone": "handleDragEnter"
    "dragleave .drop-zone": "handleDragLeave"
    "dragend .drop-zone": "handleDragLeave"
    'change input[name="file"]': "handleFileSelect"
    "click .do-save": "save"
    "click": "click"
  
  click: (ev) =>
    console.log "click #{ev.target} classes #{$(ev.target).attr('class')}"

  submit: (ev)=>
    console.log "submit..."
    ev.preventDefault()
    title = $('input[name="title"]', @$el).val()
    file = $('input[name="file"]', @$el).val()
    description = $(':input[name="description"]', @$el).val()
    console.log "title=#{title}, file=#{file}, description=#{description}"
    @model.set 'title', title
    @model.set 'description', description
    # check/fix hasFile
    atts = @model.attachments()
    @model.set 'hasFile', atts.indexOf("bytes")>=0
    
    @model.save()
    @close()

  cancel: =>
    console.log "cancel"
    @cancelled = true
    if @created and @model.id?
      console.log "try destroy on cancel for #{@model.id}"
      @model.destroy()
    if @model.id? and @files?
      console.log "try remove on cancel for #{@model.id}"
      @files.remove @model
    @close()

  remove: =>
    @removeJcrop()
    super()

  close: =>
    @remove()
    window.history.back()

  handleDragEnter: (ev)->
    console.log "dragenter"
    $(ev.target).addClass('over')

  handleDragLeave: (ev)->
    console.log "dragleave"
    $(ev.target).removeClass('over')

  handleDragOver: (ev)->
    console.log "dragover"
    ev.stopPropagation()
    ev.preventDefault()
    ev.originalEvent.dataTransfer.dropEffect = 'copy'
    false

  handleDrop: (ev)=>
    console.log "drop"
    @handleDragLeave ev
    ev.stopPropagation()
    ev.preventDefault()
    files = ev.originalEvent.dataTransfer.files
    @listFiles files
    false

  handleFileSelect: (ev)=>
    console.log "fileSelect"
    files = ev.target.files
    @listFiles files

    #output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
    #              f.size, ' bytes, last modified: ',
    #              f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',

  listFiles: (files) =>
    if files.length > 0
      file = files[0]
      console.log "file #{file.name} - #{file.type}"
      # a HTML5 File is a Blob
      blob = file.slice(0, file.size, file.type)
      # default title
      if file.name? and $('input[name="title"]', @$el).val()==''
        $('input[name="title"]', @$el).val file.name
      @loadBlob blob, file

  loadBlob: (blob, file) =>
      @newblob = blob
      @fileState = 'loading'
      if @add
        @created = true
      $('input[type=submit]',@$el).prop('disabled',true)
      @model.attach blob,"bytes", blob.type, (err,result)=>
        $('input[type=submit]',@$el).prop('disabled',false)
        if @cancelled
          console.log "attach on cancelled #{@model.id}"
          @model.destroy()
          return
        if err?
          console.log "Error attaching blob #{blob.name}: #{err}"
          @fileState = 'error'
          @renderFileDetails()
        else
          console.log "Attached blob to #{@model.id}: #{JSON.stringify result}"
          @fileState = 'loaded'
          @model.set 'hasFile',true
          @model.set 'fileSize', blob.size
          @model.set 'fileType', blob.type
          if file? and file.lastModified?
            @model.set 'fileLastModified', file.lastModified
          else
            @model.unset 'fileLastModified'
          # Fails with precondition failure - presumably _rev not updated yet?!
          #@model.attributes._rev = result.rev
          @model.save()
          @renderFileDetails()

      @renderFileDetails()

  renderFileDetails: =>
    console.log "renderFileDetails, #{@fileState} _rev=#{@model.get '_rev'}"
    hasBytes = (@model.get 'hasFile') || false

    imageOk = false
    
    if not hasBytes and @fileState=='unchanged'
      data = 
        'state': 'nofile'
    else if @fileState=='loading'
      data = 
        'state': @fileState
        'type': @newblob.type
        'size': @newblob.size
    else 
      type = @model.get 'fileType'
      data = 
        'state': @fileState
        'type': @model.get 'fileType'
        'size': @model.get 'fileSize'
      if type? and type.indexOf('image/')==0 
        console.log "imageOk"
        imageOk = true
        $('.do-edit-image',@$el).prop('disabled', false)

    if not imageOk
      $('.do-edit-image',@$el).prop('disabled', true)
      $('.image-editor',@$el).addClass 'hide'    

    $('.file-detail', @$el).html templateFileDetail data

  save: (ev) =>
    @model.download ev

  doUrl: (ev) =>
    ev.preventDefault()
    url = $('input[name="url"]', @$el).val()
    console.log "doUrl #{url}"
    @fileState = 'downloading'
    @renderFileDetails()
    $('input[type=submit]',@$el).prop('disabled',true)
    $('input[name=do-url]',@$el).prop('disabled',true)
    
    # TODO image? try as img element...
    # Ajax requests often blocked by CORS :-(
    $.ajax url, 
      method: 'GET'
      processData: false
      crossDomain: true
      error: (xhr, status, error) =>
        # jqXHR, textStatus, errorThrown
        console.log "Error getting #{url}: #{status} (#{error})"
        @fileState = 'error'
        alert "Error getting #{url}: #{status} (#{error})"
        @renderFileDetails()
        $('input[type=submit]',@$el).prop('disabled',false)
        $('input[name=do-url]',@$el).prop('disabled', false)

      success: (data, status, xhr) =>
        console.log "Got #{url} as #{typeof data} length #{data.length} (#{status})"
        @fileState = 'loading'
        @renderFileDetails()
        # TODO
        $('input[type=submit]',@$el).prop('disabled',false)
        $('input[name=do-url]',@$el).prop('disabled',false)

  removeJcrop: =>
    console.log "remove jcrop #{@jcrop}"
    if @jcrop
      try
        @jcrop.destroy()
      catch err 
        console.log "error destroying jcrop: #{err.message}"
      @jcrop = null

  crop: (c) =>
    console.log "crop #{c.x},#{c.y} #{c.x2},#{c.y2}; image #{@img.width}x#{@img.height}"
    @cropCoords =
      x: (Math.floor c.x)
      y: Math.floor c.y
      x2: Math.floor c.x2
      y2: Math.floor c.y2 

  nocrop: () =>
    console.log "nocrop"
    @cropCoords = null

  imageEdit: (ev) =>
    console.log "imageEdit"
    ev.preventDefault()
    @removeJcrop()
    @cropCoords = null

    oldImage = if @img? then @img else $('.image-editor-image', @$el).get(0)

    fileurl = "../../../../#{encodeURIComponent @model.id}/bytes"
    @img = new Image()

    self = @

    @img.onload = () =>
      console.log "Image real size #{@img.width}x#{@img.height}"
      @trueSize = [@img.width, @img.height]
      $(oldImage).replaceWith @img
      init = () =>
        console.log "init jcrop"
        $(@img).Jcrop {
            boxWidth: 600
            boxHeight: 600
            trueSize: @trueSize
            onSelect: (c) -> self.crop(c)
            onRelease: () -> self.nocrop()
          }, 
          () -> 
            self.jcrop = this
            console.log "set @jcrop #{this}"
      setTimeout init,0

    @img.src = fileurl

    # Note: non-responsive!
    
    # TODO more jcrop goodness
    $('.image-editor',@$el).removeClass('hide')

  dataURItoBlob: (dataURI) ->
    #'use strict'
    try 
      if (dataURI.split(',')[0].indexOf('base64') != -1 ) 
        byteString = atob(dataURI.split(',')[1])
      else 
        byteString = decodeURI(dataURI.split(',')[1])

      mimestring = dataURI.split(',')[0].split(':')[1].split(';')[0]
      content = new Array();
      for i in [0..byteString.length-1]
        content[i] = byteString.charCodeAt(i)
      return new Blob([new Uint8Array(content)], {type: mimestring})
    catch err
      console.log "Error doing dataURItoBlob: #{err.message} #{err.stack}"
      return null

  imageSave: (ev) =>
    console.log "image save"
    ev.preventDefault()
    $('.image-editor',@$el).addClass('hide')
    if @img? and @cropCoords?
      console.log "Crop #{JSON.stringify @cropCoords}"
      # TODO
      type = @model.get 'fileType'
      if not type?
        console.log "Using default image type"
        type = "image/png"
      try 
        canvas = document.createElement("canvas")
        w = @cropCoords.x2-@cropCoords.x+1
        h = @cropCoords.y2-@cropCoords.y+1
        canvas.width = w
        canvas.height = h
        context = canvas.getContext("2d")
        context.drawImage(@img, @cropCoords.x, @cropCoords.y, w, h, 0, 0, w, h)
        console.log "try to save as #{type}"
        data = canvas.toDataURL type
        if not data?
          console.log "Could not get dataURL"
          return
        #console.log "image: #{data}"
        blob = @dataURItoBlob data
        if not blob?
          console.log "Could not get blob"
          return
        @loadBlob blob
        console.log "initiated load blob"
      catch err
        console.log "error cropping image: #{err.message} #{err.stack}"

  imageCancel: (ev) =>
    console.log "image cancel"
    ev.preventDefault()
    $('.image-editor',@$el).addClass('hide')


    
