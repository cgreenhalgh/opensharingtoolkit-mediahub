# offline
db = require 'mydb'

config = window.mediahubconfig

module.exports.testFile = (file) ->
  console.log "Offline test with file #{file.id}"
  clientid = window.clientid
  if clientid.indexOf('client:')!=0
    clientid = 'client:'+clientid
  # pouch
  db.get clientid, (err,client)->
    if err?
      console.log "error getting client #{err} - new?"
      client = _id: clientid
    else
      console.log "got client #{client._id} #{client._rev}"
    client.files = []
    # standard attachment
    client.files.push {
      url: config.dburl+"/"+file.id+"/bytes"
      type: file.get 'fileType'
      title: file.get 'title'
    }
    client.items = []
    client.items.push {
      id: file.id
      type: 'track'
      url: config.dburl+"/"+file.id
    }
    db.put client, (err,response) ->
      if err?
        console.log "error setting client #{err}"
      else
        console.log "set client #{clientid}"
        window.open config.dburl+"/_design/app/_show/index/"+clientid, '_self'

module.exports.testBooklet = (booklet) ->
  console.log "Offline test with booklet #{booklet.id}"
  clientid = window.clientid
  if clientid.indexOf('client:')!=0
    clientid = 'client:'+clientid
  # pouch
  db.get clientid, (err,client)->
    if err?
      console.log "error getting client #{err} - new?"
      client = _id: clientid
    else
      console.log "got client #{client._id} #{client._rev}"
    client.files = []
    # cover image
    coverurl = booklet.attributes.coverurl
    if coverurl? and coverurl!=''
      # mime type? (not actually used, happily)
      client.files.push {
        url: coverurl
        title: 'cover'
      }
    # images in html
    content = booklet.attributes.content
    if content?
      srcs = /<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/g
      while m = ( srcs.exec content ) 
        src = m[1]
        if src.length>0
          client.files.push {
            url: src
            title: 'img'
          }
        
    client.items = []
    # booklet itself
    client.items.push {
      id: booklet.id
      type: 'booklet'
      url: config.dburl+"/"+booklet.id
    }
    db.put client, (err,response) ->
      if err?
        console.log "error setting client #{err}"
      else
        console.log "set client #{clientid}"
        window.open config.dburl+"/_design/app/_show/client/"+clientid, '_self'

module.exports.testApp = (app) ->
  console.log "Offline test with app #{app.id}"
  window.open config.dburl+"/_design/app/_show/app/"+app.id, '_self'

