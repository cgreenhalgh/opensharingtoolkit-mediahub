# list of Form
Form = require('models/Form')

module.exports = class FormList extends Backbone.Collection

  model: Form

  pouch: 
    fetch: 'query'
    # NB NOT live for now 
    listen: false
    options:
      query:
        include_docs: true
        fun: 'server/typeForm'

  parse: (result) ->
    console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'
 

