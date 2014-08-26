# server couch db

pathname = window.location.pathname
ix = pathname.indexOf '/_design/'
if ix>=0
  pathname = pathname.substring 0, ix
else
  alert("The page URL was not what was expected; this probably won't work! ("+pathname+")")
  console.log("The page URL was not what was expected; this probably won't work! ("+pathname+")")
  ix = pathname.lastIndexOf('/')
  if (ix>=0)
    pathname = pathname.substring(0,ix)

# production
dburl = window.location.protocol+"//"+window.location.host+pathname;
console.log "Server using dburl #{dburl}"

module.exports = new PouchDB(dburl)

