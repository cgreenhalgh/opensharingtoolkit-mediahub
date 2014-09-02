# App edit View
ListEditView = require 'views/ListEdit'
templateAppEditTab = require 'templates/AppEditTab'
plugins = require 'plugins'

module.exports = class AppEditView extends ListEditView

  tabs: ->
    super().concat [ { title: 'App', template: templateAppEditTab } ]

  formToModel: () =>
    super()
    serverId = $('select[name=server]', @$el).val()
    showAbout = $('input[name=showAbout]', @$el).prop 'checked'
    aboutText = $('textarea[name=aboutText]', @$el).val()
    version = $('input[name=version]', @$el).val()
    licenseShortName = $('select[name=licenseShortName]', @$el).val()
    licenseVersion = $('input[name=licenseVersion]', @$el).val()
    showShare = $('input[name=showShare]', @$el).prop 'checked'
    console.log "Selected server #{serverId}"
    now = new Date().getTime()
    createdtime = @model.attributes.createdtime ? now
    lastupdatedtime = now
    @model.set 
      serverId: serverId
      showAbout: showAbout
      aboutText: aboutText
      version: version
      licenseShortName: licenseShortName
      licenseVersion: licenseVersion
      showShare: showShare
      createdtime: createdtime
      lastupdatedtime: lastupdatedtime

  template: (d) =>
    servers = (plugins.getContentType 'server')?.getThings()?.models
    console.log "Found #{servers?.length} servers (in AppEditView)"
    super _.extend { servers: servers }, d

  render: () =>
    super()
    # html editor for about text 
    f = () =>
      console.log "Set up aboutText CKEditor..."
      ckconfig = {}
      ckconfig.filebrowserBrowseUrl = 'filebrowse.html'
      ckconfig.filebrowserImageBrowseUrl = 'filebrowse.html?type=image%2F'
      #editor = CKEDITOR.instances['aboutText']
      #if editor 
      #  editor.destroy(true)
      CKEDITOR.replace 'aboutText', ckconfig
    setTimeout f, 0

  remove: () =>
    editor = CKEDITOR.instances['aboutText']
    if editor 
      console.log "destroy ckeditor aboutText"
      editor.destroy(true)
    super()

