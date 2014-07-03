# Thing (offline) View
templateHtml = require 'templates/Html'
ThingView = require 'views/Thing'

module.exports = class HtmlView extends ThingView

  template: (d) =>
    templateHtml d

