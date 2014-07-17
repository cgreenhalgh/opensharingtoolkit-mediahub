# A Place
Thing = require 'models/Thing'

module.exports = class TaskConfig extends Thing
  defaults:
    type: 'taskconfig'
    subjectId: ''
    path: ''
    url: ''
    taskType: ''
    enabled: true
    lastChanged: null

  idAttribute: '_id'


