# Form edit View
ThingEditView = require 'views/ThingEdit'
templateFormEditTab = require 'templates/FormEditTab'
templateFormInput = require 'templates/FormInput'

module.exports = class FormEditView extends ThingEditView

  tabs: ->
    super().concat [ { title: 'Form', template: templateFormEditTab } ]

  formToModel: () =>
    super()
    cs = $('.form-input', @$el)
    inputs = []
    for c in cs
      title = $('.form-input-title', c).val()
      description = $('.form-input-description', c).val()
      type = $('.form-input-type', c).val()
      if title or description or type
        inputs.push { title:title, description:description, type:type }
    console.log "found inputs #{JSON.stringify inputs}"
    cardinality = $('select[name="cardinality"]', @$el).val()
    @model.set 
      inputs: inputs
      cardinality: cardinality

  render: () =>
    super()
    @nexti = @model.attributes.inputs?.length

  events:->
    _.extend {}, super(),
      "click .delete-form-input": "deleteInput"
      "click input[name=addinput]": "addInput"

  deleteInput: (ev) =>
    ev.preventDefault()
    name = $(ev.target).attr 'name'
    console.log "deleteInput #{name}"
    if (name.indexOf 'delete-')==0
      $(".#{name.substring ('delete-'.length)}", @$el).remove()

  addInput: (ev) =>
    ev.preventDefault()
    console.log "addInput #{@nexti}"
    $(".form-inputs", @$el).append templateFormInput { i: (@nexti++), title:'', description:'', type:'text' }

