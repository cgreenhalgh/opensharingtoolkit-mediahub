# exportapp.coffee
https = require 'https'
http = require 'http'
fs = require 'fs'
parse_url = (require 'url').parse
resolve_url = (require 'url').resolve
utils = require './utils'

if process.argv.length!=3 
  console.log 'usage: coffee exportapp.coffee <APP-URL>'
  process.exit -1

appurl = process.argv[2]

ix = appurl.indexOf '/_design/'
if ix<0
  console.log "Could not /_design/ in appurl #{appurl}"
  process.exit -1
couchurl = appurl.substring 0,(ix+1)
console.log "couchdb = #{couchurl}"
pathprefix = ''
for p,i in (appurl.substring ix+1).split '/' when i>0
  pathprefix = '../'+pathprefix

console.log 'exportapp '+appurl

get_file_extension = utils.get_file_extension

cachePaths = utils.cachePaths
cacheUrls = utils.cacheUrls

addSrcRefs = (file) ->
  if file.text?
    #console.log "check for src in #{file.text}"
    srcs = /<[^>]+src="?([^"\s>]+)"?[^>]*>/g
    ix = 0
    while m = ( srcs.exec file.text ) 
      src = m[1]
      #console.log "src #{src}"
      if src.length>0
        from = file.text.indexOf src, ix
        file.refs.push
          type: 'html'
          from: from
          to: from+src.length
          src: fix_relative_url file.url, (src.replace /[&]amp[;]/g, '&')
      ix = srcs.lastIndex

check_json = (surl) ->
  if files[surl]?
    return
  #console.log "check json #{surl}"
  path = cachePaths[surl]
  console.log "check json #{surl} = #{path}"
  try 
    data = fs.readFileSync path,{encoding:'utf8'}
    json = JSON.parse data
    file = 
      json: json
      url: surl
      done: false
      refs: []
    addSrcRefs file
    els = for name,val of json
      {obj:json,ix:[name]}
    while els.length>0
      el = (els.splice 0,1)[0]
      ix = el.ix[el.ix.length-1]
      val = el.obj[ix]
      #console.log "check json #{el.ix} = #{typeof val} #{val}"
      if (typeof val)=='string'
        if (typeof ix)=='string' and ix.length>=3 and (ix.lastIndexOf 'url')==(ix.length-3) and val.length>0
          console.log "found json ...url #{el.ix} = #{val}"
          file.refs.push
            from: 0
            to: val.length
            src: fix_relative_url file.url, val
            ix: el.ix.join '.'
        else # html?
          #console.log "check for src in #{val}"
          srcs = /<[^>]+src="?([^"\s>]+)"?[^>]*>/g
          ix = 0
          while m = ( srcs.exec val ) 
            src = m[1]
            console.log "found json src #{src} in #{el.ix}"
            if src.length>0
              from = val.indexOf src, ix
              file.refs.push
                from: from
                to: from+src.length
                src: fix_relative_url file.url, (src.replace /[&]amp[;]/g, '&')
                ix: el.ix.join '.'
            ix = srcs.lastIndex
      else if (typeof val)=='object'
        for name,val2 of val
          els.push {obj:val,ix:(el.ix.concat [name])}
    files[surl] = file
  catch err
    console.log "error reading json #{path}: #{err.message}"
    process.exit -1 

check_manifest = (surl) ->
  console.log "check manifest #{surl}"
  path = cachePaths[surl]
  try 
    data = fs.readFileSync path,{encoding:'utf8'}
  catch err
    console.log "error reading manifest #{path}"
    process.exit -1 
  file = 
    text: ''
    url: surl
    done: false
    refs: []
  lines = data.split '\n'
  lines = for l in lines when l.trim().length>0
    l.trim()
  if lines.length<=0
    console.log "Empty appcache manifest #{surl}"
    return
  if lines[0]!='CACHE MANIFEST'
    console.log "Bad appcache manifest #{surl}; first line #{lines[0]}"
  text = lines[0]+'\n'
  section = "CACHE:"
  for l,i in lines when i>0
    if l=="CACHE:" or l=="SETTINGS:" or l=="NETWORK:"
      section = l
    else if section=="CACHE:" and (l.indexOf '#')!=0
      url = fix_relative_url surl,l
      #console.log "Found manifest entry #{l} -> #{url}"
      file.refs.push 
        from: text.length
        to: text.length+l.length
        src: url
    text = text+l+'\n'
  text = text+'\n'
  file.text = text
  files[surl] = file

cacheFile = utils.cacheFile

readCacheTextFile = utils.readCacheTextFile
 
fix_relative_url = resolve_url

files = {}

processRefs = (text,refs) ->
    out = ''
    ix = text.length
    for ref in refs  
      path = pathprefix+ref.path
      if ref.encoding=='json'
        path = JSON.stringify path
      else if ref.encoding=='html'
        path = path # encodeURI(path)
      out = path+text.substring(ref.to,ix)+out
      ix = ref.from
    out = text.substring(0,ix)+out
    out

processFile = (file) ->
  if file.text
    sortRefs file.refs
    out = processRefs file.text, file.refs
    path = cachePaths[file.url]
    try
      console.log "re-writing #{path}..."
      fs.writeFileSync path, out
    catch err
      console.log "error re-writing #{path}"
      process.exit -1
  else if file.json
    sortJsonRefs file.refs
    # TODO 
    els = {}
    for ref in file.refs
      if not els[ref.ix]?
        els[ref.ix] = []
      els[ref.ix].push ref
    for ix,refs of els
      ixs = ix.split '.'
      obj = file.json
      while ixs.length>1
        obj = obj[(ixs.splice 0, 1)[0]]
      val = obj[ixs[0]]
      sortRefs refs
      out = processRefs val,refs
      obj[ixs[0]] = out
    path = cachePaths[file.url]
    text = JSON.stringify file.json
    try
      console.log "re-writing #{path}..."
      fs.writeFileSync path, text
    catch err
      console.log "error re-writing #{path}"
      process.exit -1

checkFile = (surl, path) ->
  ix = path.lastIndexOf '.'
  if ix>=0
    ext = path.substring (ix+1)
    if ext=='appcache'
      if not files[surl]?
        check_manifest surl
    else if ext=='json'
      # TODO do we still need a top-level check??
      check_json surl


processFiles = () ->
  for url,file of files when not file.done
    console.log "processFile #{file.url}..."
    for ref in file.refs when not ref.done
      #f = files[ref.url]
      console.log "- ref #{JSON.stringify ref}"
      ref.done = true
      return cacheFile ref.src, (err,path) ->
        if err?
          process.exit -1
        checkFile ref.src, path
        ref.path = cacheUrls[ref.src]
        processFiles()
    file.done = true
    processFile file
  console.log "Done!"
    
sortRefs = (refs) ->
  refs.sort (a,b)-> return b.from-a.from

sortJsonRefs = (refs) ->
  refs.sort (a,b)-> 
    if a.json? and b.json? 
      c = a.localeCompare b
      if c!=0
        c
      else
        b.from-a.from

cacheFile appurl, (err,path) ->
  if err?
    console.log "error cacheing #{appurl}: #{err}"
    process.exit -1
  console.log "cached #{appurl} as #{path}"
  checkFile appurl, path

# html index
readCacheTextFile appurl, (err,html) ->
  if err?
    process.exit -1
  file = 
    done: false
    url: appurl
    text: html
    refs: []
  # note: same logic as kiosk cache builder
  hi = html.indexOf '<html '
  hi2 = html.indexOf '>',hi
  mi = html.indexOf ' manifest="', hi
  mi2 = html.indexOf '"', mi+11
  if mi>=0 and mi2>=mi and mi2<hi2
    file.refs.push
      type: 'html' 
      from: mi+11
      to: mi2
      src: fix_relative_url file.url, decodeURI(html.substring mi+11,mi2)
    #console.log "Found manifest #{manifesturl}"    
  else
    console.log "Could not find manifest reference"
    process.exit -1
  # mark as exported using meta
  ix = html.indexOf '<head>'
  if ix<0
    console.log "error: cannot find <head> to mark as exported"
    process.exit -1
  file.text = html.substring( 0, ix+6 )+'<meta name="mediahub-exported" content="true"/>'+html.substring( ix+6 )
  addSrcRefs file
  if not (get_file_extension file.url)?
    file.extension = '.html'

  files[file.url] = file
  processFiles()

