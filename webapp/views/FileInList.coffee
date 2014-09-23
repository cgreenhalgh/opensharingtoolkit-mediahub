# FileInList View
templateFileInList = require 'templates/FileInList'
ThingInListView = require 'views/ThingInList'
offline = require 'offline'

module.exports = class FileInListView extends ThingInListView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateFileInList d

  events:
    "click .do-edit-file": "edit"
    "click .do-copy-file": "copy"
    "click .do-delete-file": "delete"
    "click .do-save": "save"
    "click .do-testapp": "testapp"

  save: (ev) =>
    @model.download ev

  testapp: (ev) =>
    ev.preventDefault()
    # offline test...
    offline.testFile @model

