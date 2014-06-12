# list of ContentTypes
ContentType = require('models/ContentType')

module.exports = class ContentTypeList extends Backbone.Collection

  model: ContentType

