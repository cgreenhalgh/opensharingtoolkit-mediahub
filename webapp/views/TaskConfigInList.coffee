# TaskConfig in list
ThingInListView = require 'views/ThingInList'
templateTaskConfigInList = require 'templates/TaskConfigInList'
allthings = require 'allthings'

module.exports = class TaskConfigInListView extends ThingInListView

  initialize: ->
    super()

  template: (d) =>
    if not @subject
      if @model.attributes.subjectId?
        things = allthings.get()
        @subject = things.get @model.attributes.subjectId

    console.log "template TaskConfigInList subject=#{@subject}"
    templateTaskConfigInList _.extend { subject: if @subject? then @subject.attributes else {} }, d

