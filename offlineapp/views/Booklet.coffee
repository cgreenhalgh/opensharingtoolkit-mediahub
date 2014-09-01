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
      nextAnchor = 0
      anchorPrefix = @model.id.replace( ':', '_')+'_'
      for el,ei in html
        $el = $(el)
        #console.log "Element #{ei}: #{el.nodeType} #{el.nodeName}"
        nodeName = if el.nodeName? 
          String(el.nodeName).toLowerCase()
        else
          el.nodeName
        # div element
        if el.nodeType == 1 and nodeName == 'div' and $el.hasClass( 'mediahubcolumn' )
          if page.length>0
            pages.push page
            page = []
        else if el.nodeType == 1 and nodeName == 'div' and $el.hasClass( 'mediahubcomment' )
          # ignore
        else if el.nodeType == 1 and nodeName == 'h1'
          title = $el.text().trim()
          anchor = anchorPrefix+(pages.length+1)+'_'+(nextAnchor++)
          toc.push { level: 1, title: title, page: pages.length, anchor: anchor }
          ahtml = $.parseHTML "<a id='#{anchor}'><h1>#{title}</h1></a>"
          page.push ahtml[0]
        else if el.nodeType == 1 and nodeName == 'h2'
          title = $el.text().trim()
          anchor = anchorPrefix+(pages.length+1)+'_'+(nextAnchor++)
          toc.push { level: 2, title: title, page: pages.length, anchor: anchor }
          ahtml = $.parseHTML "<a id='#{anchor}'><h2>#{title}</h2></a>"
          page.push ahtml[0]
        else if el.nodeType == 3 and el.data? and el.data.trim().length==0
          # ignore
        else
          if page.length==0
            # extra toc entry
            title = "page #{pages.length+1}"
            anchor = anchorPrefix+(pages.length+1)+'_'
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
      els = templateBookletPage 
        booklet: @model.attributes
        toc: toc
        next: if i+1<pages.length then i+2 else null
        prev: if i>0 then i else null 
      el = document.createElement 'div'
      $el = $(el)
      el.id = "#{@model.id.replace( ':', '_' )}_p#{i+1}"
      $el.addClass 'booklet-page'
      if i>0 
       $el.addClass 'hide'
      $el.append els
      $('.contentholder', $el).append page
      console.log "adding page #{$el}"
      @$el.append $el
    @

  events:
    "click .toc-link" : "tocLink"
    "click .do-next" : "nextPrev"
    "click .do-prev" : "nextPrev"
    "click .do-back" : "back"
    "click .do-toc" : "showHideToc"
    "click a" : "anyLink"

  anyLink: (ev) =>
    console.log "anyLink #{$(ev.currentTarget).attr 'href'}"

  tocLink: (ev) =>
    ev.preventDefault()
    href = $(ev.currentTarget).attr 'href' 
    console.log "toc link #{href}"
    parts = href.split '_'
    # booklet id pN a[N]
    if parts.length==4
      hash = '#booklet/'+encodeURIComponent(@model.id)+'/'+parts[2]+'/'+parts[3]
      if location.hash == hash
        # force scroll
        @showPage parts[2],parts[3]
      else
        window.router.navigate hash, trigger:true
    else
      console.log "error: badly formed booklet anchor #{href} - #{parts.length} parts"

  nextPrev: (ev) =>
    page = $(ev.currentTarget).attr 'data-page'
    if page? 
      window.router.navigate '#booklet/'+encodeURIComponent(@model.id)+'/'+page, trigger:true
      @showPage page
    else
      console.log "next/prev but can't find data-page attribute"

  showHideToc: =>
    console.log "show/hide TOC"
    $('.toc', @$el).toggleClass 'toc-toggle'

  back: =>
    console.log "back"
    window.history.back()

  showPage: (page,anchor) =>
    console.log "Booklet #{@model.id} showPage #{page} #{anchor}"
    $('.booklet-page', @$el).addClass 'hide'
    $('#'+"#{@model.id.replace(':','_')}_p#{page}", @$el).removeClass 'hide'
    if anchor?
      $('html, body').animate { scrollTop: $('#'+"#{@model.id.replace(':','_')}_#{page}_#{anchor}", @$el).offset().top }, 500
    else 
      $('html, body').animate { scrollTop: 0 }, 500

    # TODO show/hide

  # TODO TOC navigation
