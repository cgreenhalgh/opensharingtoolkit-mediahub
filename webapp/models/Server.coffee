# A Server (definition)
Thing = require 'models/Thing'

module.exports = class Server extends Thing
  defaults:
    title: ''
    description: ''
    type: 'server'
    uploadNoHttps: false
    #submissionurl:

  idAttribute: '_id'


