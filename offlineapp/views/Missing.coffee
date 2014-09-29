# Missing (thing) (offline) View
templateMissing = require 'templates/Missing'

module.exports = class MissingView extends Backbone.View

  tagName: 'div'

  initialize: ->
    @render()

  template: (d) =>
    templateMissing d
 
  render: =>
    @$el.html @template @model.attributes
    @

  showPage: (page,anchor) =>
    @page = page
    @anchor = anchor

  isMissing: 
    true
