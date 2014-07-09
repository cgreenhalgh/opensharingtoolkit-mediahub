# A Place
module.exports = class TaskConfig extends Backbone.Model
  defaults:
    type: 'taskconfig'
    subjectId: ''
    path: ''
    url: ''
    taskType: ''
    enabled: true
    lastChanged: null

