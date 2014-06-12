# Html View
templateHtml = require 'templates/Html'
ThingView = require 'views/Thing'

module.exports = class HtmlView extends ThingView

  # syntax ok?? or (x...) -> 
  template: (d) =>
    templateHtml d


