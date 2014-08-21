# Form edit View
ThingEditView = require 'views/ThingEdit'
templateFormEditTab = require 'templates/FormEditTab'
templateFormSurveyItem = require 'templates/FormSurveyItem'

module.exports = class FormEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'Form', template: templateFormEditTab } ]

  formToModel: () =>
    super()
    cs = $('.form-surveyitem', @$el)
    survey = []
    for c in cs
      displaytext = $('.form-surveyitem-displaytext', c).val()
      name = $('.form-surveyitem-name', c).val()
      type = $('.form-surveyitem-type', c).val()
      if displaytext or name or type
        survey.push { type:type, name:name, display: { text: displaytext }, }
    console.log "found survey items #{JSON.stringify survey}"
    cardinality = $('select[name="cardinality"]', @$el).val()
    @model.set 
      survey: survey
      cardinality: cardinality

  render: () =>
    super()
    @nextsurveyitem = @model.attributes.survey?.length

  events:->
    _.extend {}, super(),
      "click .delete-form-surveyitem": "deleteItem"
      "click input[name=addsurveyitem]": "addSurveyItem"

  deleteItem: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "deleteItem #{name}"
    if (name.indexOf 'delete-')==0
      $(".#{name.substring ('delete-'.length)}", @$el).remove()

  addSurveyItem: (ev) =>
    ev.preventDefault()
    console.log "addSurveyItem #{@nexti}"
    $(".form-survey", @$el).append templateFormSurveyItem { i: (@nextsurveyitem++), name:'', display: { text:'' }, type:'text' }

