# tags in offline app
# Tag model:
#   subjectId
#   name
#   value
# Tag collection

templateTagModal = require 'templates/TagModal'
formdb = require 'formdb'

tagsForSubject = {}

tagTypes = 
  like:
    options: [
      { value:2, label:'Like it' }
      { value:1, label:'Not sure' }
      { value:0, label:'Don\'t Like it' }
      { label:'No comment...' }
    ]

# pseudo-form for tags
tagform = 
  id: 'tags:v1'
  attributes: 
    _id: 'tags:v1'

tagdata = null

initSubjectTags = (subjectId, tags) ->
  # TODO which?
  # changed value?
  value = (tagdata.get 'like:'+subjectId)
  if value == undefined
    # saved value?
    value = (((tagdata.get 'formdata')['like']) ? {})[subjectId]
  else if value == null
    value = undefined
  tag = new Backbone.Model name:'like', subjectId: subjectId, value: value
  tag.on 'change:value', () ->
    pname = tag.attributes.name+':'+tag.attributes.subjectId
    #console.log "Tag #{pname} = #{tag.attributes.value}"
    value = tagdata.get pname
    if value != tag.attributes.value
      tagdata.set pname, if (tag.attributes.value == undefined) then null else tag.attributes.value
      console.log "persist tag #{pname} #{tag.attributes.value} (check #{tagdata.get pname}) on #{tagdata.id}..."
      if false == tagdata.save null, {
          success: () -> 
            console.log "Saved updated tag state"
          error: (model,res,options) ->
            console.log "Error saving updated tag state: (error) #{res}"
        }
        console.log "Error saving updated tag state: (validation)"

  tags.add tag

initTags = () ->
  console.log "initialise tags from #{tagdata.id}: #{JSON.stringify tagdata.attributes}"
  for subjectId, tags of tagsForSubject
    initSubjectTags subjectId, tags

formdb.getInstancesForForm tagform, (err,instances) ->
  if err
    console.log "error getting tag form instances: #{err}"
  tagdata = instances?.at 0
  if not tagdata
    console.log "Getting new tag form instance" 
    tagdata = formdb.getNewFormInstance tagform
  formdb.setTagsFormInstance tagdata
  initTags()

module.exports.getTagsForSubject = (subjectId) ->
  if tagsForSubject[subjectId]?
    tagsForSubject[subjectId]
  else
    tags = new Backbone.Collection()
    if tagdata
      initSubjectTags subjectId, tags
    tagsForSubject[subjectId] = tags
    tags

currentModel = null

module.exports.showTagDialog = (model) ->
  $('#tagModalHolder').html templateTagModal _.extend { options: tagTypes[model.attributes.name]?.options }, model.attributes
  currentModel = model
  $('#tagModalHolder').foundation 'reveal', 'open'

$('#tagModalHolder').on 'click', '.tag-option', (ev) ->
  console.log "tagModal click..."
  cs = $(ev.currentTarget).attr 'class'
  tn = /tag-option-[0-9]*/.exec cs
  if not tn
    return console.log "unable to idendify tag option from classes #{cs}"
  #console.log "tag matches: #{JSON.stringify tn}"
  value = if tn[0]=='tag-option-'
      null
    else
      Number tn[0].substring 'tag-option-'.length
  if currentModel
    console.log "set tag #{currentModel.attributes.name} on #{currentModel.attributes.subjectId} to #{value}"
    currentModel.set value: value
  $('.tag-option-selected', $(ev.currenTarget).parent()).removeClass 'tag-option-selected'
  $(ev.currenTarget).addClass 'tag-option-selected'

  $('#tagModalHolder').foundation 'reveal', 'close'
  currentModel = null

