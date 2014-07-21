# KioskInList View
templateKioskInList = require 'templates/KioskInList'
ThingInListView = require 'views/ThingInList'
addTaskConfig = require 'addTaskConfig'

offline = require 'offline'

module.exports = class KioskInListView extends ThingInListView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateKioskInList d

  events: ->
    _.extend {}, super(),
      "click .do-export": "export"

  export: (ev) =>
    ev.preventDefault()
    console.log "Export kiosk #{@model.id}"
    id = @model.id
    ix = id.indexOf ':'
    if ix>=0
      id = id.substring ix+1
    id = 'taskconfig:'+id
    model = 
          _id:id 
          subjectId: @model.id
          taskType: 'exportkiosk'
          enabled: true
    #TaskConfig.addingThings[id] = model
    # need path!
    addTaskConfig.add model     

