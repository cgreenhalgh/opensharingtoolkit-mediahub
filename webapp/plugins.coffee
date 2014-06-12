# very simple plugin framework

contentTypes = {}

module.exports.registerContentType = (name, info) ->
  console.log "register ContentType #{name}: #{JSON.stringify info}"
  contentTypes[name] = info

# fn(info,name,list)
module.exports.forEachContentType = (fn) ->
  _.each contentTypes, fn

module.exports.getContentType = (name) ->
  contentTypes[name]


