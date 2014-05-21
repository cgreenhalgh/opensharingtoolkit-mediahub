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

