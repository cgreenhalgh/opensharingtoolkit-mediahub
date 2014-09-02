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
    if publicurl
      publicurl = decodeURI publicurl
    #if publicqrurl 
    #  publicqrurl = decodeURI publicqrurl

    @$el.html @template _.extend { publicurl: publicurl, publicqrurl: publicqrurl }, @model.attributes 
    @

