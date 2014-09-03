# Thing (offline) View
templateHtml = require 'templates/Html'
ThingView = require 'views/Thing'
audio = require 'audio'

module.exports = class HtmlView extends ThingView

  template: (d) =>
    templateHtml d

  render: () =>
    super()
    setTimeout (() => audio.fixAudio(@$el)), 0

