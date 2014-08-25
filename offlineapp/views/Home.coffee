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
    f = () =>
      @formUploadWidgetView = new FormUploadWidgetView model: formdb.getFormUploadState()
      $('section.top-bar-section > ul.right', @$el).append @formUploadWidgetView.el
      # topbar fix
      $(document).foundation()
    setTimeout f, 0
    @


