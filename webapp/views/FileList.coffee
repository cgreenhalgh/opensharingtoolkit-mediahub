# FileList View
ThingListView = require 'views/ThingList'

module.exports = class FileListView extends ThingListView

  add: (file) =>
    console.log "FileListView add #{file.attributes._id}"
    # check rating
    if file.attributes.ratingCount==0 and @model.ratings[file.id]?
      console.log "Set ratings on add #{file.id} #{JSON.stringify @model.ratings[file.id]}"
      file.set
        ratingSum: @model.ratings[file.id][0]
        ratingCount: @model.ratings[file.id][1]
    super(file)

