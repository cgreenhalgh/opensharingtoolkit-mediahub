# TaskConfig list - no add!
ThingListView = require 'views/ThingList'
templateTaskConfigList = require 'templates/TaskConfigList'
addTaskConfig = require 'addTaskConfig'

module.exports = class TaskConfigList extends ThingListView

  template: (d) =>
    templateTaskConfigList d

  isFilter: () -> false

  events:
    "click .do-add-task-tar": "addTaskTar"
    "click .do-add-task-rm": "addTaskRm"
    "click .do-add-task-backup": "addTaskBackup"
    "click .do-add-task-checkpoint": "addTaskCheckpoint"
    "click .do-add-task-import": "addTaskImport"

  addTask: (ev, taskType, _suffix) ->
    ev.preventDefault()
    model = 
          taskType: taskType
          enabled: true
          _suffix: _suffix
    addTaskConfig.add model     

  addTaskTar: (ev) =>
    @addTask ev, 'tar', ':tar'  

  addTaskRm: (ev) =>
    @addTask ev, 'rm', ':rm'  

  addTaskBackup: (ev) =>
    @addTask ev, 'backup'  

  addTaskCheckpoint: (ev) =>
    @addTask ev, 'checkpoint'  

  addTaskImport: (ev) =>
    @addTask ev, 'import'  


