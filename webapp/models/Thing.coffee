# A Thing
module.exports = class Thing extends Backbone.Model
  defaults:
    title: ''
    description: ''
    #iconurl:

  getSortValue: () =>
    typeName = ''
    if @id?
      ix = @id.indexOf(':')
      if ix>=0 
        typeName = @id.substring 0, ix
    return "#{typeName}:#{@attributes.title}"

