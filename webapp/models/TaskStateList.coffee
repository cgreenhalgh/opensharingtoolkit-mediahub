# list of TaskState, esp singleton

module.exports = class TaskStateList extends Backbone.Collection

  pouch: 
    fetch: 'query' 
    # NB LIVE!
    listen: true
    options:
      query: 
        include_docs: true
        fun: 'app/type'
        startkey: 'taskstate'
        endkey: 'taskstate'
      changes: 
        include_docs: true
        continuous: true
        filter: 'app/changesTaskstate'

  parse: (result) ->
    #console.log "parse #{JSON.stringify result}"
    _.pluck result.rows, 'doc'

  fetch: (fetchOptions) =>
    # try to workaround couchdb bug where longpoll doesn't complete
    # if filtered-out changes occur
    pouchOptions = @sync()
    if !pouchOptions.db
      throw new Error 'A "db" property must be specified (TaskStateList.fetch)'
    
    @changeOptions = _.extend {}, pouchOptions.options.changes, @pouch.options.changes, {
      timeout: 0
      continuous: false
    }
    @changeOptions.timeout
 
    reset = () =>
      if @pollTimer
        clearTimeout @pollTimer
      @pollTimer = setTimeout poll, @changeOptions.timeout+1000

    # without getting a change you can't tell if the underlying change feed is still
    # working or not, so if nothing happens for a bit we just have to restart it in case.
    poll = (first) =>
 
      if !first
        if @pollTimer
          clearTimeout @pollTimer
        @pollTimer = setTimeout poll, @changeOptions.timeout+1000

      if @changes
        try
          console.log "Cancel old changes feed on timeout"
          @changes.cancel()
        catch err
          console.log "error cancelling changes feed: #{err.message}"
 
      console.log "fetch: changeOptions #{JSON.stringify @changeOptions}"
      @changes = pouchOptions.db.changes @changeOptions
      @changes.on 'change', @onChange
      @changes.on 'error', (err) =>
        console.log "TaskStateList: error: #{err}"
        if first and fetchOptions.error?
          fetchOptions.error(@, err, fetchOptions)
        reset(true)
      @changes.on 'complete', (resp) =>
        console.log "TaskStateList: complete: #{resp} last_seq #{resp.last_seq}"
        if not resp.last_seq?
          # probably cancelled - seems to be pouchdb behaviour at present
          # to call 'complete' on cancel
          return
        try
          if first and fetchOptions.success?
            #console.log "- call #{fetchOptions.success}"
            fetchOptions.success(@, resp, fetchOptions)
          if resp.last_seq?
            @changeOptions.since = resp.last_seq
          reset(true)
          # now live
          if first
            @changes = null
            console.log "start continuous fetch..."
            @changeOptions.continuous = true
            @changeOptions.timeout = 20000
            poll()
        catch err
          console.log "error handling complete: #{err.message}, #{err.stack}" 
    # first (non-longpoll) fetch
    poll true

  onChange: (change) =>
    console.log "TaskStateList: change: #{change}"
    todo = @get(change.id)

    if (change.deleted)
      if (todo) 
        todo.destroy()
    else 
      if (todo) 
        todo.set(change.doc);
      else 
        @add(change.doc);

    #?// call original onChange if present
    #?if (typeof options.options.changes.onChange === 'function') 
    #?  options.options.changes.onChange(change);
 
