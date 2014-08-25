# Form upload / local instance status (local, non-persistent, singleton)
module.exports = class FormUpload extends Backbone.Model
  defaults:
    uploading: false
    uploadInstanceIds: []
    lastUploadState: ''


