# A Server (definition)
Thing = require 'models/Thing'

module.exports = class Server extends Thing
  defaults:
    title: ''
    description: ''
    type: 'server'
    #submissionurl:

  idAttribute: '_id'


