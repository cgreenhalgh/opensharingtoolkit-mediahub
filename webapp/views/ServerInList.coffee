# ServerInList View
templateServerInList = require 'templates/ServerInList'
ThingInListView = require 'views/ThingInList'
addTaskConfig = require 'addTaskConfig'
TaskConfig = require 'models/TaskConfig'

module.exports = class ServerInListView extends ThingInListView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateServerInList d

  events: ->
    _.extend {}, super(),
      "click .do-build": "build"
      "click .do-export": "export"
      "click .do-import": "import"

  build: (ev) =>
    ev.preventDefault()
    console.log "Build server #{@model.id}"
    id = @model.id
    ix = id.indexOf ':'
    if ix>=0
      id = id.substring ix+1
    id = 'taskconfig::server:'+id
    model = 
          _id:id 
          subjectId: @model.id
          taskType: 'buildserver'
          enabled: true
    TaskConfig.addingThings[id] = model
    window.router.navigate "#ContentType/taskconfig/add/#{encodeURIComponent id}", trigger:true

  export: (ev) =>
    ev.preventDefault()
    console.log "Export server #{@model.id}"
    id = @model.id
    ix = id.indexOf ':'
    if ix>=0
      id = id.substring ix+1
    id = 'taskconfig:'+id
    model = 
          _id:id 
          subjectId: @model.id
          taskType: 'exportserver'
          enabled: true
    # need path!
    addTaskConfig.add model     

  import: (ev) =>
    ev.preventDefault()
    console.log "Import server #{@model.id}"
    id = @model.id
    ix = id.indexOf ':'
    if ix>=0
      id = id.substring ix+1
    id = 'taskconfig:'+id
    model = 
          _id:id 
          subjectId: @model.id
          taskType: 'importserver'
          enabled: true
    # need path!
    addTaskConfig.add model     

