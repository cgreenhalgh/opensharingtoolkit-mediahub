# FileEdit View
templateFileEdit = require 'templates/FileEdit'
templateFileDetail = require 'templates/FileDetail'

module.exports = class FileEditView extends Backbone.View

  constructor:(options)->
    @add = options.add ?= false
    super(options)

  tagName: 'div'
  className: 'row file-edit'
  newfile: null
  fileState: 'unchanged'
  cancelled: false
  created: false

  initialize: ->
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
    @close()

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

  listFiles: (files) ->
    if files.length > 0
      file = files[0]
      console.log "file #{file.name} - #{file.type}"
      @newfile = file
      # a HTML5 File is a Blob
      blob = file.slice(0, file.size, file.type)
      # default title
      if file.name? and $('input[name="title"]', @$el).val()==''
        $('input[name="title"]', @$el).val file.name
      @fileState = 'loading'
      if @add
        @created = true
      $('input[type=submit]',@$el).attr('disabled','disabled')
      @model.attach blob,"bytes", file.type, (err,result)=>
        $('input[type=submit]',@$el).removeAttr('disabled')
        if @cancelled
          console.log "attach on cancelled #{@model.id}"
          @model.destroy()
          return
        if err?
          console.log "Error attaching file #{file.name}: #{err}"
          @fileState = 'error'
          @renderFileDetails()
        else
          console.log "Attached file #{file.name} to #{@model.id}: #{JSON.stringify result}"
          @fileState = 'loaded'
          @model.set 'hasFile',true
          @model.set 'fileSize', file.size
          @model.set 'fileType', file.type
          if file.lastModified?
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
    
    if not hasBytes and @fileState=='unchanged'
      data = 
        'state': 'nofile'
    else if @fileState=='loading'
      data = 
        'state': @fileState
        'type': @newfile.type
        'size': @newfile.size
    else 
      data = 
        'state': @fileState
        'type': @model.get 'fileType'
        'size': @model.get 'fileSize'
    $('.file-detail', @$el).html templateFileDetail data

  save: (ev) =>
    @model.download ev

