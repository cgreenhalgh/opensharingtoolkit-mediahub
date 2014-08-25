# Home (offline) View

templateHome = require 'templates/Home'
FormUploadWidgetView = require 'views/FormUploadWidget'
formdb = require 'formdb'

module.exports = class HomeView extends Backbone.View

  tagName: 'div'

  initialize: ->
    @render()

  template: (d) =>
    templateHome d

  render: =>
    @$el.html @template @model
    f = () ->
      @formUploadWidgetView = new FormUploadWidgetView model: formdb.getFormUploadState()
      $('.upload-state-holder', @$el).replaceWith @formUploadWidgetView.el
    setTimeout f, 0
    @


