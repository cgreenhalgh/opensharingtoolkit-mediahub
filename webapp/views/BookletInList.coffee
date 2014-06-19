# BookletInList View
templateBookletInList = require 'templates/BookletInList'
ThingInListView = require 'views/ThingInList'
offline = require 'offline'

module.exports = class BookletInListView extends ThingInListView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateBookletInList d

  events:
    "click .do-edit-file": "edit"
    "click .do-delete-file": "delete"
    "click .do-save": "save"
    "click .do-testapp": "testapp"

  testapp: (ev) =>
    ev.preventDefault()
    # offline test...
    offline.testBooklet @model

