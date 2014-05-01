# FileEdit View
templateFileEdit = require 'templates/FileEdit'
templateFileDetail = require 'templates/FileDetail'

module.exports = class FileEditView extends Backbone.View

  tagName: 'div'
  className: 'row file-edit'
  newfile: null
  newfileReader: null

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFileEdit d

  render: =>
    console.log "render FileEdit #{@model.attributes._id}: #{ @model.attributes.title }"
    # TODO edit?
    @$el.html @template { data: @model.attributes, add: true }
    # TODO file info
    @renderFileDetails()
    f = () -> $('input[name="title"]', @$el).focus()
    setTimeout f, 0
    @

  events:
    "submit": "submit"
    "click .do-cancel": "close"
    "dragover .drop-zone": "handleDragOver"
    "drop .drop-zone": "handleDrop"
    "dragenter .drop-zone": "handleDragEnter"
    "dragleave .drop-zone": "handleDragLeave"
    "dragend .drop-zone": "handleDragLeave"
    'change input[name="file"]': "handleFileSelect"
    "click .do-save": "save"

  submit: (ev)=>
    console.log "submit..."
    ev.preventDefault()
    title = $('input[name="title"]', @$el).val()
    file = $('input[name="file"]', @$el).val()
    description = $(':input[name="description"]', @$el).val()
    console.log "title=#{title}, file=#{file}, description=#{description}"
    @model.set 'title', title
    @model.set 'description', description
    #if not @model.has '_id' or @model.get('id') == ''
    #  id = window.PouchDB.uuid()
    #  console.log "new id #{id}"
    #  @model.set '_id', id
    if @newfile? and @newfileDataurl?
      @model.set 'fileSize', @newfile.size
      @model.set 'fileType', @newfile.type
      if @newfile.lastModified?
        @model.set 'fileLastModified', @newfile.lastModified
      else
        @model.unset 'fileLastModified'
      @model.set 'fileDataurl', @newfileDataurl
      #attachments = @model.get '_attachments'

    @model.save()
    @close()

  close: =>
    @remove()
    if @newfileReader?
      console.log "abort old file reader"
      @newfileReader.abort()
      @newfileReader = null
    $('.file-list').show()

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

  listFiles: (files) ->
    if files.length > 0
      file = files[0]
      @newfile = file
      @newfileDataurl = null
      console.log "file #{file.name} - #{file.type}"
      # default title
      if file.name? and $('input[name="title"]', @$el).val()==''
        $('input[name="title"]', @$el).val file.name
      if @newfileReader?
        console.log "abort old file reader"
        @newfileReader.abort()
      @newfileReader = new FileReader()
      self = this
      @newfileReader.onload = (ev)=>
        console.log "Read #{ev.target.result.length} char dataurl"
        @newfileDataurl = ev.target.result
        @newfileReader = null
        @renderFileDetails()
        $('input[type=submit]',@$el).removeClass 'disabled'
      @newfileReader.onerror = (ev)=>
        console.log "Read file error"
        @newfileReader = null
        @newfile = null
        @renderFileDetails()
        $('input[type=submit]',@$el).removeClass 'disabled'
      $('input[type=submit]',@$el).addClass 'disabled'
      @newfileReader.readAsDataURL file
      @renderFileDetails()

  renderFileDetails: =>
    if @newfileDataurl? and @newfile?
      data = 
        'state': 'loaded'
        'type': @newfile.type
        'size': @newfile.size
        'dataurl': @newfileDataurl
    else if @newfile?
      data = 
        'state': 'error'
    else if @model.has 'fileDataurl' 
      data = 
        'state': 'unchanged'
        'type': @model.get 'fileType'
        'size': @model.get 'fileSize'
        'dataurl': @model.get 'fileDataurl'
    else
      data = 
        'state': 'nofile'
    $('.file-detail', @$el).html templateFileDetail data

  save: (ev) =>
    ev.preventDefault()
    if @newfileDataurl?
      @	saveDataurl @newfileDataurl
    else if @model.has 'fileDataurl'
      @saveDataurl @model.get 'fileDataurl'

  saveDataurl: (dataurl) ->
    bix = dataurl.indexOf ';base64,'
    if bix<0
      console.log "cannot save non-base64 dataurl"
      return
    raw = window.atob dataurl.substring bix+8
    len = raw.length
    array = new Uint8Array len
    for i in [0..len-1]
      array[i] = raw.charCodeAt i
    parts = dataurl.substring(0,bix).split /[:;]/
    contentType = parts[1]
        
    blob = new Blob array, {type: contentType}
    saveAs blob, @title

