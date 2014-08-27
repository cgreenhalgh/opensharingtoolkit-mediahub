# user

user = new Backbone.Model username: window.localStorage?.getItem 'username'

module.exports.getUserId = () ->
  if user.attributes.username
    if user.attributes.username.indexOf '@' >= 0
      'mailto:'+user.attributes.username
    else
      'nickname:'+user.attributes.username
  else
    ''

module.exports.getUser = () ->
  user

user.on 'change:username', (model,value) ->
  try
    window.localStorage.setItem 'username', value
    console.log "Username changed to #{value}"
  catch err
    console.log "Error saving username '#{value}' to localStorage: #{err.message}"

