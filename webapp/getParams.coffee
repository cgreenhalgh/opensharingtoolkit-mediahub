getParams = ->
  # http://stelfox.net/blog/2013/12/access-get-parameters-with-coffeescript/
  query = window.location.search.substring 1
  raw_vars = query.split "&" 
  params = {}
  for v in raw_vars
    [key, val] = v.split "="
    params[key] = decodeURIComponent val
  params

module.exports = getParams

