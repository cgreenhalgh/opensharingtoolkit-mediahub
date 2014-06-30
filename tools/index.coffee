# for web server only
express = require("express")
# for compile only
argv    = process.argv.slice(2)

# the web-server...

app = express()

app.use express.static(process.cwd())

port = argv[0] or process.env.PORT or 9294
app.listen port, () ->
  console.log "Starting server on port: #{port} for #{process.cwd()}"

