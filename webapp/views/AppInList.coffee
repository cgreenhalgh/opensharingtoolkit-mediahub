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

  testapp: (ev) =>
    ev.preventDefault()
    # offline test...
    offline.testApp @model

