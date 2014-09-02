# Share (offline) View

templateShare = require 'templates/Share'

module.exports = class ShareView extends Backbone.View

  title: 'Share'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateShare d

  render: =>
    publicurl = $('meta[name="mediahub-publicurl"]').attr('content')
    publicqrurl = $('meta[name="mediahub-publicqrurl"]').attr('content')
    exported = $('meta[name="mediahub-exported"]').attr('content')

    @$el.html @template _.extend { publicurl: publicurl, publicqrurl: publicqrurl, exported: exported }, @model.attributes 
    @

