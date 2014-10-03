# AppInList View
templateAppInList = require 'templates/AppInList'
ThingInListView = require 'views/ThingInList'
TaskConfig = require 'models/TaskConfig'
addTaskConfig = require 'addTaskConfig'

offline = require 'offline'

module.exports = class AppInListView extends ThingInListView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateAppInList d

  events: ->
    "click .do-edit-file": "edit"
    "click .do-copy-file": "copy"
    "click .do-delete-file": "delete"
    "click .do-save": "save"
    "click .do-testapp": "testapp"
    "click .do-export": "export"
    "click .do-checkpoint": "checkpoint"

  testapp: (ev) =>
    ev.preventDefault()
    # offline test...
    offline.testApp @model

  export: (ev) =>
    @startTask ev, 'exportapp'

  startTask: (ev, taskType) =>
    ev.preventDefault()
    console.log "#{taskType} #{@model.id}"
    id = @model.id
    ix = id.indexOf ':'
    if ix>=0
      id = id.substring ix+1
    id = 'taskconfig:'+id
    model = 
          _id:id 
          subjectId: @model.id
          taskType: taskType
          enabled: true
    #TaskConfig.addingThings[id] = model
    # need path!
    addTaskConfig.add model     

  checkpoint: (ev) =>
    @startTask ev, 'checkpointapp'

