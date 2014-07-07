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
    #@render()

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
    "click .do-save-image": "imageSave"
    "click .do-reset-image": "imageReset"
    "click .do-crop-image": "imageCrop"
    "click .do-scale-image": "imageScale"
    "click .do-flip-image": "imageFlip"
    "click .do-rotate-image": "imageRotate"
    "dragover .drop-zone": "handleDragOver"
    "drop .drop-zone": "handleDrop"
    "dragenter .drop-zone": "handleDragEnter"
    "dragleave .drop-zone": "handleDragLeave"
    "dragend .drop-zone": "handleDragLeave"
    'change input[name="file"]': "handleFileSelect"
    "click .do-save": "save"
    "click": "click"
    "change select[name=image-aspect]": "imageAspect"
  
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
        setTimeout @imageEdit, 0

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
    $('input[name=image-width]',@$el).val "#{@cropCoords.x2-@cropCoords.x+1}"
    $('input[name=image-height]',@$el).val "#{@cropCoords.y2-@cropCoords.y+1}"
    $('input[name=do-crop-image]',@$el).prop 'disabled',false

  nocrop: () =>
    console.log "nocrop"
    if @trueSize?
      $('input[name=image-width]',@$el).val "#{@trueSize[0]}"
      $('input[name=image-height]',@$el).val "#{@trueSize[1]}"
    @cropCoords = null
    $('input[name=do-crop-image]',@$el).prop 'disabled',true

  imageEdit: (ev, url) =>
    console.log "imageEdit"
    if ev?
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
      $('input[name=image-width]',@$el).val "#{@trueSize[0]}"
      $('input[name=image-height]',@$el).val "#{@trueSize[1]}"
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

    if not url?
      @img.src = fileurl
      $('input[name=do-save-image]',@$el).prop 'disabled',true
      $('input[name=do-reset-image]',@$el).prop 'disabled',true
    else
      # data url
      @img.src = url
      #@img.onload() 
      $('input[name=do-save-image]',@$el).prop 'disabled',false
      $('input[name=do-reset-image]',@$el).prop 'disabled',false
    $('input[name=do-crop-image]',@$el).prop 'disabled',true

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
    if @img? 
      data = @img.src
      if (data.indexOf 'data:')==0
        try 
          #console.log "image: #{data}"
          blob = @dataURItoBlob data
          if not blob?
            console.log "Could not get blob"
            return
          @loadBlob blob
          console.log "initiated load blob"
        catch err
          console.log "error saving edited image: #{err.message} #{err.stack}"
      else
        console.log "image src is not data url: #{data}"
    else
      console.log "img element not found"

  imageReset: (ev) =>
    ev.preventDefault()
    console.log "imageReset"
    @imageEdit()
    
  imageCrop: (ev) =>
    ev.preventDefault()
    if @img? and @cropCoords?
      console.log "Crop #{JSON.stringify @cropCoords}"
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
        console.log "update image with dataurl"
        @imageEdit ev, data
      catch err
        console.log "error doing crop: #{err.message} #{err.stack}"
    else
      console.log "warning: imageCrop without img and/or cropCoords"

  imageTransform: (cw, ch, a, b, c, d, e, f) =>
    if @img? and @trueSize?
      type = @model.get 'fileType'
      if not type?
        console.log "Using default image type"
        type = "image/png"
      try
        canvas = document.createElement("canvas")
        canvas.width = cw
        canvas.height = ch
        context = canvas.getContext("2d")
        # translate w-1 or w?
        context.transform a,b,c,d,e,f
        context.drawImage @img, 0, 0
        console.log "try to save as #{type}"
        data = canvas.toDataURL type
        if not data?
          console.log "Could not get dataURL"
          return
        console.log "update image with dataurl"
        @imageEdit null, data
      catch err
        console.log "error doing #{name}: #{err.message} #{err.stack}"

  imageFlip: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "imageFlip #{name}"
    if @img? and @trueSize?
      if (name.indexOf 'horizontal') >= 0
        @imageTransform @trueSize[0], @trueSize[1], -1,0,0,1,@trueSize[0],0
      else
        @imageTransform @trueSize[0], @trueSize[1], 1,0,0,-1,0,@trueSize[1]
    
  imageScale: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "imageScale #{name}"
    ix = name.lastIndexOf '-'
    sw = Number(name.substring ix+1)
    if @img? and @trueSize? 
      sh = Math.round( sw*@trueSize[1]/@trueSize[0] )
      console.log "Scale to #{sw}x#{sh}"
      @imageTransform sw,sh, sw/@trueSize[0],0,0,sh/@trueSize[1],0,0    
    
  imageRotate: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "imageRotate #{name}"
    if @img? and @trueSize?
      if (name.indexOf 'left') >= 0
        @imageTransform @trueSize[1], @trueSize[0], 0,-1,1,0,0,@trueSize[0]
      else
        @imageTransform @trueSize[1], @trueSize[0], 0,1,-1,0,@trueSize[1],0

  imageAspect: (ev) =>
    ev.preventDefault()
    aspect = $(ev.target).val()
    console.log "aspect #{aspect}"
    if not @jcrop?
      console.log "jcrop not set in imageAspect"
      if aspect!=''
        $(ev.target).val ''
      return false
    if aspect=='fixed'
      if not @trueSize
        console.log "truSize not set in imageAspect fixed"
        $(ev.target).val ''
        return false
      aspect = @trueSize[0]/@trueSize[1]
    else if aspect==''
      aspect = null
    else
      aspect = Number(aspect)
    console.log "set image aspect ratio to #{aspect}"
    try  
      @jcrop.setOptions
        aspectRatio: aspect
    catch err
      console.log "error setting aspect ratio to #{aspect}: #{err.message} #{err.stack}"

