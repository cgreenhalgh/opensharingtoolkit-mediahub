# from http://arcturo.github.io/library/coffeescript/06_applications.html

require("coffee-script")
stitch  = require("stitch")
fs = require('fs')
argv    = process.argv.slice(2)

buildapp = (froms,to,extrasource) ->
  paths = for from in froms
    __dirname + from

  console.log "compile #{froms} to #{to}..."
  pckg1 = stitch.createPackage(
    # Specify the paths you want Stitch to automatically bundle up
    paths: paths

    # Specify your base libraries
    dependencies: [
      # __dirname + '/lib/jquery.js'
    ]
  )

  # the file export...
  pckg1.compile(
    (err, source) ->
      if (err) then throw err
      if extrasource? then source = source+extrasource
      fs.writeFile(to, source, 
        (err) ->
        console.log "Compiled #{from} to #{to}"
      )
  )

buildapp ['/common','/webapp'],'public/js/webapp.js'
buildapp ['/common','/offlineapp'],'public/js/offlineapp.js'
buildapp ['/common','/server/webapp'],'public/js/serverapp.js'
#buildapp '/tools','tools.js','require("exportapp");'

