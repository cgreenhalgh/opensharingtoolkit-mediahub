# Booklet (offline) View
templateBookletPage = require 'templates/BookletPage'

module.exports = class BookletView extends Backbone.View

  tagName: 'div'

  initialize: ->
    #@listenTo @model, 'change', @render
    @render()

  render: =>
    pages = []
    toc = []
    try
      console.log "Booklet: #{@model.attributes.content}"
      html = $.parseHTML @model.attributes.content
      page = []
      anchor = 0
      for el in html
        $el = $(el)
        # div element
        if el.nodeType == 1 and el.nodeName == 'div' and $el.hasClass( 'mediahubcolumn' )
          if page.length>0
            pages.push page
            page = []
        else if el.nodeType == 1 and el.nodeName == 'div' and $el.hasClass( 'mediahubcomment' )
          # ignore
        else if el.nodeType == 1 and el.nodeName == 'h1'
          title = $el.html()
          anchor = encodeURIComponent(@model.id)+'%2Fa'+(anchor++)
          toc.push { level: 1, title: title, page: pages.length, anchor: anchor }
          ahtml = $.parseHTML "<a id='#{anchor}'><h1>#{title}</h1></a>"
          page.push ahtml[0]
        else if el.nodeType == 1 and el.nodeName == 'h2'
          title = $el.html()
          anchor = encodeURIComponent(@model.id)+'%2Fa'+(anchor++)
          toc.push { level: 2, title: title, page: pages.length, anchor: anchor }
          ahtml = $.parseHTML "<a id='#{anchor}'><h2>#{title}</h2></a>"
          page.push ahtml[0]
        else
          if page.length==0
            # extra toc entry
            title = "page #{pages.length+1}"
            anchor = encodeURIComponent(@model.id)+'%2Fa'+(anchor++)
            toc.push { level: 0, title: title, page: pages.length, anchor: anchor }
            ahtml = $.parseHTML "<a id='#{anchor}'><h1>#{title}</h1></a>"
            page.push ahtml[0]
          page.push el
      if page.length>0
        pages.push page
        page = []
      
    catch err
      console.log "Error building booklet: #{err.message}" 
      # TODO error/empty placeholder
      if pages.length==0
        pages.push ($.parseHTML "<p>Sorry, there was a problem viewing this book; please try downloading it again.</p>")

    if pages.length==0
      pages.push ($.parseHTML "<p>This booklet has no pages.</p>")

    for page, i in pages
      els = templateBookletPage { booklet: @model.attributes, toc: toc }
      el = document.createElement 'div'
      $el = $(el)
      el.id = "#{encodeURIComponent(@model.id)}%2Fp#{i+1}"
      if i>0 
       $el.addClass 'hide'
      $el.append els
      $('.contentholder', $el).append page
      console.log "adding page #{$el}"
      @$el.append $el
    @

  showPage: (page) =>
    console.log "Booklet #{@model.id} showPage #{page}"
    # TODO show/hide

  # TODO TOC navigation
