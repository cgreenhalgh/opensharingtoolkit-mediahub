# AppInList View
templateAppInList = require 'templates/AppInList'
ThingInListView = require 'views/ThingInList'
offline = require 'offline'

module.exports = class AppInListView extends ThingInListView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateAppInList d

  events:
    "click .do-edit-file": "edit"
    "click .do-delete-file": "delete"
    "click .do-save": "save"
    "click .do-testapp": "testapp"
    "click .do-export": "export"

  testapp: (ev) =>
    ev.preventDefault()
    # offline test...
    offline.testApp @model

  export: (ev) =>
    ev.preventDefault()
    console.log "Export app #{@model.id}"
    id = @model.id
    ix = id.indexOf ':'
    if ix>=0
      id = id.substring ix+1
    id = 'taskconfig:'+id
    window.router.navigate "#ContentType/taskconfig/editadd/#{encodeURIComponent id}", trigger:true

