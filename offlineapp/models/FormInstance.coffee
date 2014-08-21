# FormInstance (offline) - see formdb.coffeee

module.exports = class FormInstance extends Backbone.Model
  defaults:
    type: 'forminstance'
    formdata: {}
    draftdata: {}
    metadata: 
      saved:false
      finalized:false
      submitted:false
    #formdef:

  idAttribute: '_id'

