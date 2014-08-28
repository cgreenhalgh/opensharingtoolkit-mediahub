# doc cache
db = require 'serverdb'

cache = {}

module.exports.getTitle = (id, cb) ->
  # return title, if discovered/changed async call cb(id,title)
  # TODO
  if cache[id]
    return cache[id].title
  if (id.indexOf 'mailto:')==0 
    return id.substring 'mailto:'.length
  if (id.indexOf 'nickname:')==0 
    return id.substring 'nickname:'.length
  db.get id, (err,doc) ->
    if err
      return console.log "error getting #{id} for cache: #{err}"
    cache[id] = doc
    cb id, doc.title
  null
