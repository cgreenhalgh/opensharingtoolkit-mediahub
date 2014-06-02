# local db

# waiting on backbone-pouch fix https://github.com/pouchdb/pouchdb/issues/2158
# interrim workaround - force websql (idp-specific failure)
db = new PouchDB 'offline', 
  adapter: 'websql'

module.exports.db = db

