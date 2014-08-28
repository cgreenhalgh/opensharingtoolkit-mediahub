# A Form
Thing = require 'models/Thing'
# loose compatibility with OpenDataKit xlsform, http://opendatakit.org/help/form-design/xlsform
# http://opendatakit.org/use/2_0_tools/older-versions/xlsxconverter-beta-2-0-v2/
# https://bitbucket.org/javarosa/javarosa/wiki/OpenRosaMetaDataSchema - submission metadata
# with a dash of compatibility with formDef.json, https://code.google.com/p/opendatakit/wiki/SurveyJSON

# model: <OMITTED FOR NOW>
# survey: [{ type:TYPE, values_list:LISTNAME?, name, display: { text, hint? }, 
#            required:BOOL? }, ...]
#   (see also condition, constraint, default, ...)
#   TYPE: *text*, integer, decimal, select_one [options], select_multiple [options], *note* (no input),
#        geopoint, image, barcode, date, datetime, audio, video, calculate
# (auto) start (datetime), end, today (day of survey), deviceid, subscriberid, sim_serial, phone_number
# choices: { LISTNAME: [{ choice_list_name?, data_value, display: { text?, image? }, ...], ...}
# settings: <HANDLED AT TOP LEVEL FOR NOW> 
#           [{setting_name, value, display: { title? } },...]
#   SETTING_NAMEs: survey <with display:title> => title, form_id => id, 
#                  form_version (int, YYYYMMDD) => version 
#
# Also client config for form:
#   cardinality: 1|* - can single client create/submit multiple independent instances?
#
# Also submission server config for form:
#   autoacceptSubmission: true|false

module.exports = class Form extends Thing
  defaults:
    title: ''
    description: ''
    type: 'form'
    survey: []
    choices: []
    # id
    # version
    cardinality: '1'
    autoacceptSubmission: true

  idAttribute: '_id'

