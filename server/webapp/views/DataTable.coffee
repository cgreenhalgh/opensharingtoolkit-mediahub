# DataTable View
templateDataTable = require 'templates/DataTable'
db = require 'serverdb'
server = require 'server'

module.exports = class DataTableView extends Backbone.View

  tagName: 'div'
  className: 'row thing'

  initialize: ->
    @render()
    @getData()

  template: (d) =>
    templateDataTable d

  render: =>
    @$el.html @template @model.attributes
    @

  getData: () =>
    options = 
      reduce: false
      inclusive_end: true
      include_docs: true
    if @model.attributes.key.length>0 
      options.startkey = @model.attributes.key
      options.endkey = @model.attributes.key.concat ['ZZZ']
    server.working "get data for table view #{@model.attributes.view} key #{@model.attributes.key.join ','}"
    db.query "server/#{@model.attributes.view}", options, (err, res) =>
      if err
        return server.error null, err
      server.success()
      console.log "Got #{res.rows.length} data items"
      # TODO
      # pre-process - metadata to top-level, find all attribute names
      names = {}
      for row in res.rows
        for name,value of (row.doc.meta ? {})
          row.doc['_'+name] = value
        delete row.doc.meta
        row.doc['_type'] = row.doc['type']
        delete row.doc['type']
        for name,value of row.doc
          names[name] = true
      cnames = for name,value of names
        name
      cnames.sort (a,b) ->
        console.log "compare #{a} #{b}"
        if a and (not b)
          -1
        else if (not a) and b
          1
        else if a.charAt(0) == '_' and not (b.charAt(0) == '_')
          1
        else if not (a.charAt(0) == '_') and b.charAt(0) == '_'
          -1
        else if a=='_userID'
          -1
        else if b=='_userID'
          1
        else if (typeof a)=='string'
          a.localeCompare b
        else if (typeof a)=='number'
          a-b
        else
          String(a).localeCompare String(b)

      table = document.createElement 'TABLE'
      thead = table.createTHead()
      htr = thead.insertRow -1
      for cname in cnames
        htd = htr.insertCell -1
        htd.innerHTML = cname
      tbody = document.createElement "tbody"
      table.appendChild tbody
      for row in res.rows
        tr = document.createElement "tr"
        tbody.appendChild tr
        for cname in cnames
          td = tr.insertCell -1
          if row.doc[cname]
            text = document.createTextNode JSON.stringify row.doc[cname] 
            td.appendChild text
      $('.table-holder').empty()
      $('.table-holder').append table
      # DataTables.net
      $(table).dataTable()

