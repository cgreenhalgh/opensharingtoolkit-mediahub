# from http://arcturo.github.io/library/coffeescript/06_applications.html

require("coffee-script")
stitch  = require("stitch")
fs = require('fs')
argv    = process.argv.slice(2)

buildapp = (from,to) ->
  console.log "compile #{from} to #{to}..."
  pckg1 = stitch.createPackage(
    # Specify the paths you want Stitch to automatically bundle up
    paths: [ __dirname + from ]

    # Specify your base libraries
    dependencies: [
      # __dirname + '/lib/jquery.js'
    ]
  )

  # the file export...
  pckg1.compile(
    (err, source) ->
      if (err) then throw err
      fs.writeFile(to, source, 
        (err) ->
        console.log "Compiled #{from} to #{to}"
      )
  )

buildapp '/webapp','public/js/webapp.js'
buildapp '/offlineapp','public/js/offlineapp.js'

