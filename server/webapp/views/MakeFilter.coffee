# MakeFilter View
templateMakeFilter = require 'templates/MakeFilter'
db = require 'serverdb'
server = require 'server'
cache = require 'cache'

# views supported - implemented by couchapp/server.js
views = [
  {
    name: 'formdataByAppFormUser',
    groups: [
      { type: 'app', title: 'App' }
      { type: 'form', title: 'Form' }
      { type: 'user', title: 'User' }      
    ]
  }
]

module.exports = class MakeFilterView extends Backbone.View

  tagName: 'div'
  className: 'row thing'

  initialize: ->
    @listenTo @model, 'change', @render
    @render()

  template: (d) =>
    templateMakeFilter d

  render: =>
    @$el.html @template _.extend { views: views }, @model.attributes
    @

  events:
    "click input": "update"
    "change select": "changeFilter"

  getView: (name) ->
    for view in views when name==view.name
      return view
    null

  update: (ev) =>
    name = $(ev.target).attr 'name'
    console.log "update #{name}"
    if name == 'update-view'
      @updateView()
    else if (name.indexOf 'update-filter')==0
      i = Number(name.substring ('update-filter-'.length))
      if i < (@model.attributes.filters ? []).length
        console.log "update filter #{i}"
        @model.attributes.filters[i].value = $("select[name=filter-#{i}]", @$el).val()
        filters = @model.attributes.filters.slice 0,(i+1)
        @updateOptions() 
        @model.set filters: filters
    else if name == 'show-table'
      @showTable()

  updateView: (ev) =>
    viewname = $('select[name=view]', @$el).val()
    console.log "updateView: #{viewname}"
    view = @getView viewname
    @model.set view: view, filters: []
    @updateOptions() 

  updateOptions: () =>
    filters = @model.attributes.filters.concat []
    ix = filters.length
    view = @model.attributes.view
    if ix >= view.groups.length
      # done
      return
    for filter,i in filters
      if not filter.value
        console.log "no value set for filter #{i}"
        return    
    options = 
      reduce: true
      group_level: (ix+1)
      inclusive_end: true
    key = for filter,i in filters
      filter.value
    if key.length>0 
      options.startkey = key
      options.endkey = key.concat ['ZZZ']
    server.working "get level #{ix} options for view #{view.name}"
    db.query "server/#{view.name}", options, (err, res) =>
      if err
        return server.error null, err
      server.success()
      count = 0
      options = for row in res.rows
        count += row.value
        { value: row.key[ix], count: row.value, title: (cache.getTitle row.key[ix], @updateTitle) }
      filter = 
        type: view.groups[ix].type
        title: view.groups[ix].title 
        count: count
        options: options
      @model.set filters: filters.concat [filter]

  changeFilter: (ev) =>
    name = $(ev.target).attr 'name'
    console.log "change filter #{name}..."
    # TODO

  updateTitle: (id, title) =>
    console.log "update title #{id} -> #{title}"
    refresh = false
    for filter,i in (@model.attributes.filters ? [])
      filter.value = $("select[name=filter-#{i}]", @$el).val()
      for option in filter.options
        if option.value == id and option.title!=title
          option.title = title
          refresh = true
     if refresh
       @render()

  showTable: () =>
    filters = @model.attributes.filters.concat []
    ix = filters.length-1
    if ix>=0
      filters[ix].value = $("select[name=filter-#{ix}]", @$el).val()
    key = for filter,i in filters
      if filter.value 
        encodeURIComponent filter.value
      else 
        null
    while key.length>0 and not key[key.length-1]
      key = key.slice 0,-1
    view = @model.attributes.view
    url = "datatable/#{view.name}/#{key.join '/'}"
    console.log "Show table #{url}"
    window.router.navigate url, trigger:true

