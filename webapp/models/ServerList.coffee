# list of Server
Server = require('models/Server')

module.exports = class ServerList extends Backbone.Collection

  model: Server

