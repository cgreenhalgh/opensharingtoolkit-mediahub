# FileEditSelectView
FileEditView = require 'views/FileEdit'
getParams = require 'getParams'

module.exports = class FileEditSelectView extends FileEditView

  constructor:(options)->
    @listView = options.listView
    super(options)

  initialize: ->
    super()
    @render()

  cancel: =>
    super()
    console.log "FileEditSelectView cancel"
    @listView?.$el?.show()

  submit: (ev) =>
    super(ev)
    console.log "FileEditSelectView submit"

    @fileUrl = "../../../../#{encodeURIComponent( @model.id )}/bytes"

    # see http://docs.ckeditor.com/#!/guide/dev_file_browser_api
    params = getParams()
    mediahubCallback = params[ 'mediahubCallback' ]
    funcNum = params[ 'CKEditorFuncNum' ]
    if mediahubCallback?
      console.log "- mediahubCallback #{mediahubCallback} fileUrl = #{@fileUrl}"
      try
        window.opener.mediahubCallbacks[mediahubCallback]( @fileUrl )
      catch err
        console.log "error calling mediahubCallback: #{err.message}"
      window.close()
    else if funcNum?
      console.log "- ckeditor fileUrl = #{@fileUrl}"
      window.opener.CKEDITOR.tools.callFunction( funcNum, @fileUrl )
      window.close()
    else
      alert "Error: could not find parameter CKEditorFuncNum or mediahubCallback"

