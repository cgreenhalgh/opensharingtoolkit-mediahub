# TaskConfig list - no add!
ThingListView = require 'views/ThingList'
templateTaskConfigList = require 'templates/TaskConfigList'

module.exports = class TaskConfigList extends ThingListView

  template: (d) =>
    templateTaskConfigList d

