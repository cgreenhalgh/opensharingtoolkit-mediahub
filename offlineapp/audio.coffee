# audio stuff, esp. android appcache workaround

module.exports.fixAudio = (jqel) ->
  if navigator.userAgent?.match /Android/
    $("source", jqel).each () ->
      el = this
      src = $(this).attr 'src'
      type = $(this).attr 'type'
      if src and (src.indexOf 'data:')!=0
        console.log "Attempt to fix audio source #{src}..."
        try 
          xhr = new XMLHttpRequest()
          xhr.open('GET', src, true)
          xhr.responseType = 'blob'
          xhr.onload = (e) ->
            # why do we get 206 (partial)??
            if (@status == 200 || @status == 206) 
              blob = new Blob([this.response], {type: type})
              reader  = new FileReader()
              reader.onloadend = () ->
                console.log "convert audio source #{src} to data #{reader.result}"
                $(el).attr 'src', reader.result
              reader.readAsDataURL(blob)
            else
              console.log "Get for audio #{src} -> status #{@status}"
          xhr.send()
        catch err
          console.log "Error initiating audio load of #{src}: #{err.message}"
  else
    console.log "Leaving audio sources - hopefully this isn't android (#{navigator.userAgent})"

