# form db (local), i.e. part/completed form information and upload metadata
# 
# Form db should include documents like:
#   _id: unique ID
#   _rev: local rev ID
#   formdef: mediahub form attributes: _id, inputs (id, title, type), cardinality
#   formdata: as (input) id: value
#   draftdata: like formdata but for 'unsaved' current entry values
#   metadata:
#     created: datatime
#     updated: [datatime]
#     status: 'new'|'draft'|'saved'|'submitted'
#   upload: TBC

dbname = 'formdata'

if window.openDatabase? 
  console.log "WARNING: forcing websql for formdb"  
  db = new PouchDB dbname, 
    adapter: 'websql'
else
  console.log "NOTE: using default pouchdb persistence for formdb"  
  db = new PouchDB dbname

module.exports.db = db

