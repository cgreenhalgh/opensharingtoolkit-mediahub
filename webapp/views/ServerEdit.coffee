# Server edit View
ThingEditView = require 'views/ThingEdit'
templateServerEditTab = require 'templates/ServerEditTab'
templateServerAdmin = require 'templates/ServerAdmin'

module.exports = class ServerEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'Server', template: templateServerEditTab } ]

  formToModel: () =>
    super()
    cs = $('.server-admin', @$el)
    admins = []
    for c in cs
      username = $('.server-admin-username', c).val()
      password = $('.server-admin-password', c).val()
      if username!='' or password!=''
        admins.push { username: username, password: password }
    console.log "found admins #{JSON.stringify admins}"
    #TODO servertype = $('input[name="atomfilename"]', @$el).val()
    submissionurl = $('input[name="submissionurl"]', @$el).val()
    uploadNoHttps = $('input[name=uploadNoHttps]', @$el).prop 'checked'
    @model.set 
      admins: admins
      submissionurl: submissionurl
      uploadNoHttps: uploadNoHttps

  render: () =>
    super()
    @nexti = @model.attributes.admins?.length

  events:->
    _.extend {}, super(),
      "click .delete-server-admin": "deleteAdmin"
      "click input[name=addadmin]": "addAdmin"

  deleteAdmin: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "deleteAdmin #{name}"
    if (name.indexOf 'delete-')==0
      $(".#{name.substring ('delete-'.length)}", @$el).remove()

  addAdmin: (ev) =>
    ev.preventDefault()
    console.log "addAdmin #{@nexti}"
    $(".server-admins", @$el).append templateServerAdmin { i: (@nexti++), username:'', password:'' }

