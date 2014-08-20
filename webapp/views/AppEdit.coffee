# App edit View
ListEditView = require 'views/ListEdit'
templateAppEditTab = require 'templates/AppEditTab'
plugins = require 'plugins'

module.exports = class AppEditView extends ListEditView

  tabs: ->
    super().concat [ { title: 'App', template: templateAppEditTab } ]

  formToModel: () =>
    super()
    serverId = $('select[name=server]').val()
    console.log "Selected server #{serverId}"
    @model.set serverId: serverId

  template: (d) =>
    servers = (plugins.getContentType 'server')?.getThings()?.models
    console.log "Found #{servers?.length} servers (in AppEditView)"
    super _.extend { servers: servers }, d


