# Kiosk edit View
ListEditView = require 'views/ListEdit'
templateKioskEditTab = require 'templates/KioskEditTab'
templateKioskCampaign = require 'templates/KioskCampaign'

module.exports = class KioskEditView extends ListEditView

  tabs: ->
    super().concat [ { title: 'Kiosk', template: templateKioskEditTab } ]

  formToModel: () =>
    super()
    cs = $('.kiosk-campaign', @$el)
    campaigns = []
    for c in cs
      id = $('.kiosk-campaign-id', c).val()
      title = $('.kiosk-campaign-title', c).val()
      if id!='' or title!=''
        campaigns.push { id: id, title: title }
    console.log "found campaigns #{JSON.stringify campaigns}"
    atomfilename = $('input[name="atomfilename"]', @$el).val()
    externalurl = $('input[name="externalurl"]', @$el).val()
    authorname = $('input[name="authorname"]', @$el).val()
    @model.set 
      campaigns: campaigns
      atomfilename: atomfilename
      externalurl: externalurl
      authorname: authorname

  render: () =>
    super()
    @nexti = @model.attributes.campaigns?.length

  events:->
    _.extend {}, super(),
      "click .delete-kiosk-campaign": "deleteCampaign"
      "click input[name=addcampaign]": "addCampaign"

  deleteCampaign: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "deleteCampaign #{name}"
    if (name.indexOf 'delete-')==0
      $(".#{name.substring ('delete-'.length)}", @$el).remove()

  addCampaign: (ev) =>
    ev.preventDefault()
    console.log "addCampaign #{@nexti}"
    $(".kiosk-campaigns", @$el).append templateKioskCampaign { i: (@nexti++), id:'', title:'' }


