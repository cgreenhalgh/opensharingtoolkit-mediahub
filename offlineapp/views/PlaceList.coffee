# PlaceList
ThingListView = require 'views/ThingList'
PlaceInListView = require 'views/PlaceInList'

module.exports = class PlaceListView extends ThingListView

  newThingInListView: (thing) ->
    new PlaceInListView model: thing

