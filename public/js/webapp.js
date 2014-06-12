
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"app": function(exports, require, module) {(function() {
  var App, ContentTypeList, ContentTypeListView, Router, config, db, plugins, tempViews,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ContentTypeList = require('models/ContentTypeList');

  ContentTypeListView = require('views/ContentTypeList');

  db = require('mydb');

  plugins = require('plugins');

  require('plugins/Track');

  config = window.mediahubconfig;

  tempViews = [];

  Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      return Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "": "entries",
      "ContentType/:type": "contentType",
      "ContentType/:type/:action": "contentTypeAction",
      "ContentType/:type/:action/:id": "contentTypeAction"
    };

    Router.prototype.entries = function() {
      console.log("router: entries");
      this.removeTempViews();
      $('body .top-level-view').hide();
      return $('body .content-type-list').show();
    };

    Router.prototype.removeTempViews = function() {
      var view, _results;
      console.log("removeTempViews (" + tempViews.length + ")");
      _results = [];
      while (tempViews.length > 0) {
        view = tempViews.splice(0, 1)[0];
        _results.push(view.remove());
      }
      return _results;
    };

    Router.prototype.contentType = function(type) {
      var contentType;
      contentType = plugins.getContentType(type);
      if (contentType == null) {
        console.log("Error: could not find ContentType " + type);
        return;
      }
      console.log("show ContentType " + type + "...");
      $('body .top-level-view').hide();
      this.removeTempViews();
      if (contentType.view == null) {
        contentType.view = contentType.createView();
        return $('body').append(contentType.view.el);
      } else {
        return $('body').append(contentType.view.$el.show());
      }
    };

    Router.prototype.contentTypeAction = function(type, action, id) {
      var contentType, view;
      console.log;
      contentType = plugins.getContentType(type);
      if (contentType == null) {
        console.log("Error: could not find ContentType " + type);
        return;
      }
      console.log("consoleTypeAction " + type + " " + action + " " + id);
      this.contentType(type);
      $('body .top-level-view').hide();
      this.removeTempViews();
      view = contentType.createActionView(action, id);
      if (view != null) {
        view.render();
        $('body').append(view.el);
        return tempViews.push(view);
      }
    };

    return Router;

  })(Backbone.Router);

  $(document).ajaxError(function(event, jqxhr, settings, exception) {
    return console.log("ajaxError " + exception);
  });

  App = {
    init: function() {
      var contentTypes, contentTypesView, router;
      console.log("App starting...");
      Backbone.sync = BackbonePouch.sync({
        db: db,
        error: function(err) {
          return console.log("ERROR (sync): " + err);
        },
        options: {
          error: function(err) {
            return console.log("ERROR (sync/options): " + err);
          }
        }
      });
      Backbone.Model.prototype.idAttribute = '_id';
      _.extend(Backbone.Model.prototype, BackbonePouch.attachments());
      contentTypes = new ContentTypeList();
      plugins.forEachContentType(function(ct, name) {
        return contentTypes.add(ct);
      });
      contentTypesView = new ContentTypeListView({
        model: contentTypes
      });
      contentTypesView.render();
      $('body').append(contentTypesView.el);
      router = new Router;
      window.router = router;
      return Backbone.history.start();
    }
  };

  module.exports = App;

}).call(this);
}, "fileDeleter": function(exports, require, module) {(function() {
  var currentModel, templateFileDeleteModal;

  templateFileDeleteModal = require('templates/FileDeleteModal');

  currentModel = null;

  $('#deleteModalHolder').on('closed', '[data-reveal]', function() {
    console.log("deleteModalHolder closed");
    return currentModel = null;
  });

  $('#deleteModalHolder').on('click', '.do-delete', function(ev) {
    console.log("do-delete " + currentModel.id);
    if (currentModel != null) {
      currentModel.destroy();
    }
    return $('#deleteModalHolder').foundation('reveal', 'close');
  });

  $('#deleteModalHolder').on('click', '.do-close', function(ev) {
    console.log("deleteModalHolder do-close");
    currentModel = null;
    return $('#deleteModalHolder').foundation('reveal', 'close');
  });

  module.exports["delete"] = function(model) {
    console.log("delete " + model.attributes._id);
    currentModel = model;
    $('#deleteModalHolder').html(templateFileDeleteModal(model.attributes));
    return $('#deleteModalHolder').foundation('reveal', 'open');
  };

}).call(this);
}, "models/ContentType": function(exports, require, module) {(function() {
  var ContentType,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ContentType = (function(_super) {
    __extends(ContentType, _super);

    function ContentType() {
      return ContentType.__super__.constructor.apply(this, arguments);
    }

    ContentType.prototype.defaults = {
      title: '',
      description: ''
    };

    ContentType.prototype.createView = function() {};

    return ContentType;

  })(Backbone.Model);

}).call(this);
}, "models/ContentTypeList": function(exports, require, module) {(function() {
  var ContentType, ContentTypeList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ContentType = require('models/ContentType');

  module.exports = ContentTypeList = (function(_super) {
    __extends(ContentTypeList, _super);

    function ContentTypeList() {
      return ContentTypeList.__super__.constructor.apply(this, arguments);
    }

    ContentTypeList.prototype.model = ContentType;

    return ContentTypeList;

  })(Backbone.Collection);

}).call(this);
}, "models/File": function(exports, require, module) {(function() {
  var File,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = File = (function(_super) {
    __extends(File, _super);

    function File() {
      this.download = __bind(this.download, this);
      return File.__super__.constructor.apply(this, arguments);
    }

    File.prototype.defaults = {
      title: '',
      description: '',
      type: 'file',
      ratingSum: 0,
      ratingCount: 0
    };

    File.prototype.download = function(ev) {
      if (ev != null) {
        ev.preventDefault();
      }
      console.log("Save " + this.id);
      return this.attachment("bytes", (function(_this) {
        return function(error, blob) {
          if (error != null) {
            return console.log("Error getting file attachment: " + error);
          } else {
            console.log("Got file attachment for " + _this.id);
            return saveAs(blob, _this.get('title'));
          }
        };
      })(this));
    };

    return File;

  })(Backbone.Model);

}).call(this);
}, "models/FileList": function(exports, require, module) {(function() {
  var File, FileList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  File = require('models/File');

  module.exports = FileList = (function(_super) {
    __extends(FileList, _super);

    function FileList() {
      return FileList.__super__.constructor.apply(this, arguments);
    }

    FileList.prototype.model = File;

    FileList.prototype.pouch = {
      fetch: 'allDocs',
      error: function(err) {
        return console.log("ERROR(FileList) (sync): " + err);
      },
      options: {
        error: function(err) {
          return console.log("ERROR(FileList/options) (sync): " + err);
        },
        listen: false,
        allDocs: {
          include_docs: true,
          startkey: 'file:',
          endkey: 'file;'
        },
        query: {
          include_docs: true,
          fun: {
            map: function(doc) {
              if (doc.type === 'file') {
                return emit(doc.title, null);
              }
            }
          }
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: function(doc) {
            return doc._deleted || doc.type === 'file';
          }
        }
      }
    };

    FileList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return FileList;

  })(Backbone.Collection);

}).call(this);
}, "mydb": function(exports, require, module) {(function() {
  var config;

  config = window.mediahubconfig;

  module.exports = new PouchDB(config.dburl);

}).call(this);
}, "offline": function(exports, require, module) {(function() {
  var config, db;

  db = require('mydb');

  config = window.mediahubconfig;

  module.exports.testFile = function(file) {
    var clientid;
    console.log("Offline test with file " + file.id);
    clientid = window.clientid;
    if (clientid.indexOf('client:') !== 0) {
      clientid = 'client:' + clientid;
    }
    return db.get(clientid, function(err, client) {
      if (err != null) {
        console.log("error getting client " + err + " - new?");
        client = {
          _id: clientid
        };
      } else {
        console.log("got client " + client._id + " " + client._rev);
      }
      client.files = [];
      client.files.push({
        url: config.dburl + "/" + file.id + "/bytes",
        type: file.get('fileType'),
        title: file.get('title')
      });
      client.items = [];
      client.items.push({
        id: file.id,
        type: 'track',
        url: config.dburl + "/" + file.id
      });
      return db.put(client, function(err, response) {
        if (err != null) {
          return console.log("error setting client " + err);
        } else {
          console.log("set client " + clientid);
          return window.open(config.dburl + "/_design/app/_show/index/" + clientid, '_self');
        }
      });
    });
  };

}).call(this);
}, "plugins": function(exports, require, module) {(function() {
  var contentTypes;

  contentTypes = {};

  module.exports.registerContentType = function(name, info) {
    console.log("register ContentType " + name + ": " + (JSON.stringify(info)));
    return contentTypes[name] = info;
  };

  module.exports.forEachContentType = function(fn) {
    return _.each(contentTypes, fn);
  };

  module.exports.getContentType = function(name) {
    return contentTypes[name];
  };

}).call(this);
}, "plugins/Track": function(exports, require, module) {(function() {
  var ContentType, File, FileEditView, FileList, FileListView, files, plugins, trackType, updateRatings;

  plugins = require('plugins');

  ContentType = require('models/ContentType');

  File = require('models/File');

  FileList = require('models/FileList');

  FileListView = require('views/FileList');

  FileEditView = require('views/FileEdit');

  files = null;

  trackType = new ContentType({
    id: 'Track',
    title: 'File/Track',
    description: 'Initial test/development content type - part file, part audio track'
  });

  updateRatings = function(files, ratings) {
    var err, file, row, _i, _len, _ref, _results;
    try {
      ratings = JSON.parse(ratings);
    } catch (_error) {
      err = _error;
      console.log("Error parsing ratings: " + err.message + ": " + ratings);
      return;
    }
    _ref = ratings.rows;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      files.ratings[row.key] = row.value;
      file = files.get(row.key);
      if (file != null) {
        console.log("Set ratings on load-ratings " + file.id + " " + (JSON.stringify(row.value)));
        _results.push(file.set({
          ratingSum: row.value[0],
          ratingCount: row.value[1]
        }));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  trackType.createView = function() {
    var filesView;
    console.log("create Track view");
    files = new FileList();
    filesView = new FileListView({
      model: files
    });
    filesView.render();
    files.fetch();
    files.ratings = {};
    $.ajax(window.mediahubconfig.dburl + '/_design/app/_view/rating?group=true', {
      success: function(ratings) {
        return updateRatings(files, ratings);
      },
      dataType: "text",
      error: function(xhr, status, err) {
        return console.log("get ratings error " + xhr.status + ": " + err.message);
      }
    });
    return filesView;
  };

  trackType.createActionView = function(action, id) {
    var file;
    if (action === 'edit') {
      file = files.get(id);
      if (file == null) {
        alert("could not find Track " + id);
        return;
      }
      return new FileEditView({
        model: file
      });
    } else if (action === 'add') {
      file = new File({
        _id: 'file:' + uuid()
      });
      console.log("new id " + file.id);
      files.add(file);
      return new FileEditView({
        model: file,
        add: true,
        files: files
      });
    } else {
      return console.log("unknown Track action " + action + " (id " + id + ")");
    }
  };

  plugins.registerContentType('Track', trackType);

}).call(this);
}, "templates/ContentTypeInList": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n<a href="#" class="select-content-type">\n  <h4>');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</h4>\n  ');
    
      if ((this.description != null) && this.description.length > 0) {
        __out.push('\n   <p>');
        __out.push(__sanitize(this.description));
        __out.push('</p>\n  ');
      }
    
      __out.push('\n</a>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ContentTypeList": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n<div class="columns small-12 large-12">\n  <h2>Content Types</h2>\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/FileDeleteModal": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n');
    
      __out.push('\n  <h2>Permanently delete this file?</h2>\n  <p>Do you want to permanently delete ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('?</p>\n  <a class="close-reveal-modal">&#215;</a>\n  <a class="button do-delete">Yes</a>\n  <a class="button do-close">No</a>\n');
    
      __out.push('\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/FileDetail": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n');
    
      if (this.state === 'nofile') {
        __out.push('\nNo file\n');
      } else if (this.state === 'error') {
        __out.push('\nError loading file\n');
      } else {
        __out.push('\n');
        __out.push(__sanitize(this.size));
        __out.push(' bytes, ');
        __out.push(__sanitize((this.type == null) || this.type === '' ? 'unknown mimetype' : this.type));
        __out.push('\n');
        if (this.state === 'loading') {
          __out.push('\nLoading...\n');
        } else if (this.state === 'unchanged') {
          __out.push('\n<a href="#-save" class="button tiny do-save">Save</a>\n');
        } else if (this.state === 'loaded') {
          __out.push('\n<a href="#-save" class="button tiny do-save">Save (new)</a>\n');
        } else {
          __out.push('\n(');
          __out.push(__sanitize(this.state));
          __out.push(')\n');
        }
        __out.push('\n');
      }
    
      __out.push('\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/FileEdit": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n<div class="columns large-12">\n  <h2>');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Edit'));
    
      __out.push(' File/Track</h2>\n</div>\n<form>\n  <div class="columns large-12">\n    <label>Title\n      <input type="text" name="title" placeholder="title" value="');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('"/>\n    </label>\n    <label>File (note: replacing a file is immediate - no undo!)\n      <input type="file" name="file"/>\n    </label>\n    <div class="drop-zone">Drop file here</div>\n    <div class="file-detail">No File<!-- TODO --></div>\n    <label>Description\n      <textarea name="description" placeholder="description" >');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</textarea>\n    </label>\n    <input type="submit" value="');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Save changes'));
    
      __out.push('"/>\n    <input type="reset" value="Clear"/>\n    <input type="button" value="Cancel" class="do-cancel"/>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/FileInList": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n<h4 class="clearfix">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n  ');
    
      if (this.ratingCount !== 0) {
        __out.push('\n   <span class="rating">');
        __out.push(this.ratingSum / this.ratingCount >= 0.5 ? '&#9733;' : '&#9734;');
        __out.push('<!--\n  -->');
        __out.push(this.ratingSum / this.ratingCount >= 1.5 ? '&#9733;' : '&#9734;');
        __out.push('<!--\n  -->');
        __out.push(this.ratingSum / this.ratingCount >= 2.5 ? '&#9733;' : '&#9734;');
        __out.push('<!--\n  -->');
        __out.push(this.ratingSum / this.ratingCount >= 3.5 ? '&#9733;' : '&#9734;');
        __out.push('<!--\n  -->');
        __out.push(this.ratingSum / this.ratingCount >= 4.5 ? '&#9733;' : '&#9734;');
        __out.push('</span>\n   (');
        __out.push(__sanitize(this.ratingCount));
        __out.push(' ratings)\n  ');
      }
    
      __out.push('\n  <a href="#-delete-file" class="action-button do-delete-file right">Delete</a>\n  <a href="#-edit-file" class="action-button do-edit-file right">Edit</a>\n');
    
      if (this.hasFile) {
        __out.push('\n  <a href="#-save" class="action-button do-save right">Save</a>\n  <a href="#-testapp" class="action-button do-testapp right">Test Offline</a>\n');
      }
    
      __out.push('\n</h3>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/FileList": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('\n  <div class="column large-12 small-12">\n    <h2>File/Track List</h2>\n    <a href="#-add-file" class="button do-add-file">Add...</a>\n  </div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "views/ContentTypeInList": function(exports, require, module) {(function() {
  var ContentTypeInListView, templateContentTypeInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateContentTypeInList = require('templates/ContentTypeInList');

  module.exports = ContentTypeInListView = (function(_super) {
    __extends(ContentTypeInListView, _super);

    function ContentTypeInListView() {
      this.select = __bind(this.select, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ContentTypeInListView.__super__.constructor.apply(this, arguments);
    }

    ContentTypeInListView.prototype.tagName = 'div';

    ContentTypeInListView.prototype.className = 'columns small-12 large-12 content-type-in-list';

    ContentTypeInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    ContentTypeInListView.prototype.template = function(d) {
      return templateContentTypeInList(d);
    };

    ContentTypeInListView.prototype.render = function() {
      console.log("render ContentTypeInList " + this.model.id + ": " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    ContentTypeInListView.prototype.events = {
      "click .select-content-type": "select"
    };

    ContentTypeInListView.prototype.select = function(ev) {
      console.log("select ContentType " + this.model.id);
      ev.preventDefault();
      return router.navigate("#ContentType/" + this.model.id, {
        trigger: true
      });
    };

    return ContentTypeInListView;

  })(Backbone.View);

}).call(this);
}, "views/ContentTypeList": function(exports, require, module) {(function() {
  var ContentType, ContentTypeInListView, ContentTypeListView, templateContentTypeList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ContentType = require('models/ContentType');

  ContentTypeInListView = require('views/ContentTypeInList');

  templateContentTypeList = require('templates/ContentTypeList');

  module.exports = ContentTypeListView = (function(_super) {
    __extends(ContentTypeListView, _super);

    function ContentTypeListView() {
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ContentTypeListView.__super__.constructor.apply(this, arguments);
    }

    ContentTypeListView.prototype.tagName = 'div';

    ContentTypeListView.prototype.className = 'row content-type-list top-level-view';

    ContentTypeListView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.add);
      return this.listenTo(this.model, 'remove', this.remove);
    };

    ContentTypeListView.prototype.template = function(d) {
      return templateContentTypeList(d);
    };

    ContentTypeListView.prototype.render = function() {
      var views;
      console.log("render ContentTypeList with template");
      this.$el.html(this.template(this.model.attributes));
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    ContentTypeListView.prototype.views = [];

    ContentTypeListView.prototype.add = function(item) {
      var view;
      console.log("ContentTypeListView add " + item.id);
      view = new ContentTypeInListView({
        model: item
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    ContentTypeListView.prototype.remove = function(item) {
      var i, view, _i, _len, _ref;
      console.log("ContentTypeListView remove " + item.id);
      _ref = this.views;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        view = _ref[i];
        if (!(view.model.id === item.id)) {
          continue;
        }
        console.log("remove view");
        view.$el.remove();
        this.views.splice(i, 1);
        return;
      }
    };

    return ContentTypeListView;

  })(Backbone.View);

}).call(this);
}, "views/FileEdit": function(exports, require, module) {(function() {
  var FileEditView, templateFileDetail, templateFileEdit,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateFileEdit = require('templates/FileEdit');

  templateFileDetail = require('templates/FileDetail');

  module.exports = FileEditView = (function(_super) {
    __extends(FileEditView, _super);

    function FileEditView(options) {
      this.save = __bind(this.save, this);
      this.renderFileDetails = __bind(this.renderFileDetails, this);
      this.handleFileSelect = __bind(this.handleFileSelect, this);
      this.handleDrop = __bind(this.handleDrop, this);
      this.close = __bind(this.close, this);
      this.cancel = __bind(this.cancel, this);
      this.submit = __bind(this.submit, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      this.add = options.add != null ? options.add : options.add = false;
      this.files = options.files != null ? options.files : options.files = null;
      FileEditView.__super__.constructor.call(this, options);
    }

    FileEditView.prototype.tagName = 'div';

    FileEditView.prototype.className = 'row file-edit';

    FileEditView.prototype.newfile = null;

    FileEditView.prototype.fileState = 'unchanged';

    FileEditView.prototype.cancelled = false;

    FileEditView.prototype.created = false;

    FileEditView.prototype.initialize = function() {
      return this.render();
    };

    FileEditView.prototype.template = function(d) {
      return templateFileEdit(d);
    };

    FileEditView.prototype.render = function() {
      var f;
      console.log("render FileEdit " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template({
        data: this.model.attributes,
        add: this.add
      }));
      this.renderFileDetails();
      f = function() {
        return $('input[name="title"]', this.$el).focus();
      };
      setTimeout(f, 0);
      return this;
    };

    FileEditView.prototype.events = {
      "submit": "submit",
      "click .do-cancel": "cancel",
      "dragover .drop-zone": "handleDragOver",
      "drop .drop-zone": "handleDrop",
      "dragenter .drop-zone": "handleDragEnter",
      "dragleave .drop-zone": "handleDragLeave",
      "dragend .drop-zone": "handleDragLeave",
      'change input[name="file"]': "handleFileSelect",
      "click .do-save": "save"
    };

    FileEditView.prototype.submit = function(ev) {
      var atts, description, file, title;
      console.log("submit...");
      ev.preventDefault();
      title = $('input[name="title"]', this.$el).val();
      file = $('input[name="file"]', this.$el).val();
      description = $(':input[name="description"]', this.$el).val();
      console.log("title=" + title + ", file=" + file + ", description=" + description);
      this.model.set('title', title);
      this.model.set('description', description);
      atts = this.model.attachments();
      this.model.set('hasFile', atts.indexOf("bytes") >= 0);
      this.model.save();
      return this.close();
    };

    FileEditView.prototype.cancel = function() {
      console.log("cancel");
      this.cancelled = true;
      if (this.created && (this.model.id != null)) {
        console.log("try destroy on cancel for " + this.model.id);
        this.model.destroy();
      }
      if ((this.model.id != null) && (this.files != null)) {
        console.log("try remove on cancel for " + this.model.id);
        this.files.remove(this.model);
      }
      return this.close();
    };

    FileEditView.prototype.close = function() {
      this.remove();
      return window.history.back();
    };

    FileEditView.prototype.handleDragEnter = function(ev) {
      console.log("dragenter");
      return $(ev.target).addClass('over');
    };

    FileEditView.prototype.handleDragLeave = function(ev) {
      console.log("dragleave");
      return $(ev.target).removeClass('over');
    };

    FileEditView.prototype.handleDragOver = function(ev) {
      console.log("dragover");
      ev.stopPropagation();
      ev.preventDefault();
      ev.originalEvent.dataTransfer.dropEffect = 'copy';
      return false;
    };

    FileEditView.prototype.handleDrop = function(ev) {
      var files;
      console.log("drop");
      this.handleDragLeave(ev);
      ev.stopPropagation();
      ev.preventDefault();
      files = ev.originalEvent.dataTransfer.files;
      this.listFiles(files);
      return false;
    };

    FileEditView.prototype.handleFileSelect = function(ev) {
      var files;
      console.log("fileSelect");
      files = ev.target.files;
      return this.listFiles(files);
    };

    FileEditView.prototype.listFiles = function(files) {
      var blob, file;
      if (files.length > 0) {
        file = files[0];
        console.log("file " + file.name + " - " + file.type);
        this.newfile = file;
        blob = file.slice(0, file.size, file.type);
        if ((file.name != null) && $('input[name="title"]', this.$el).val() === '') {
          $('input[name="title"]', this.$el).val(file.name);
        }
        this.fileState = 'loading';
        if (this.add) {
          this.created = true;
        }
        $('input[type=submit]', this.$el).attr('disabled', 'disabled');
        this.model.attach(blob, "bytes", file.type, (function(_this) {
          return function(err, result) {
            $('input[type=submit]', _this.$el).removeAttr('disabled');
            if (_this.cancelled) {
              console.log("attach on cancelled " + _this.model.id);
              _this.model.destroy();
              return;
            }
            if (err != null) {
              console.log("Error attaching file " + file.name + ": " + err);
              _this.fileState = 'error';
              return _this.renderFileDetails();
            } else {
              console.log("Attached file " + file.name + " to " + _this.model.id + ": " + (JSON.stringify(result)));
              _this.fileState = 'loaded';
              _this.model.set('hasFile', true);
              _this.model.set('fileSize', file.size);
              _this.model.set('fileType', file.type);
              if (file.lastModified != null) {
                _this.model.set('fileLastModified', file.lastModified);
              } else {
                _this.model.unset('fileLastModified');
              }
              _this.model.save();
              return _this.renderFileDetails();
            }
          };
        })(this));
        return this.renderFileDetails();
      }
    };

    FileEditView.prototype.renderFileDetails = function() {
      var data, hasBytes;
      console.log("renderFileDetails, " + this.fileState + " _rev=" + (this.model.get('_rev')));
      hasBytes = (this.model.get('hasFile')) || false;
      if (!hasBytes && this.fileState === 'unchanged') {
        data = {
          'state': 'nofile'
        };
      } else if (this.fileState === 'loading') {
        data = {
          'state': this.fileState,
          'type': this.newfile.type,
          'size': this.newfile.size
        };
      } else {
        data = {
          'state': this.fileState,
          'type': this.model.get('fileType'),
          'size': this.model.get('fileSize')
        };
      }
      return $('.file-detail', this.$el).html(templateFileDetail(data));
    };

    FileEditView.prototype.save = function(ev) {
      return this.model.download(ev);
    };

    return FileEditView;

  })(Backbone.View);

}).call(this);
}, "views/FileInList": function(exports, require, module) {(function() {
  var FileEditView, FileInListView, fileDeleter, offline, templateFileInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateFileInList = require('templates/FileInList');

  FileEditView = require('views/FileEdit');

  fileDeleter = require('fileDeleter');

  offline = require('offline');

  module.exports = FileInListView = (function(_super) {
    __extends(FileInListView, _super);

    function FileInListView() {
      this.testapp = __bind(this.testapp, this);
      this.save = __bind(this.save, this);
      this["delete"] = __bind(this["delete"], this);
      this.edit = __bind(this.edit, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return FileInListView.__super__.constructor.apply(this, arguments);
    }

    FileInListView.prototype.tagName = 'div';

    FileInListView.prototype.className = 'file-in-list';

    FileInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    FileInListView.prototype.template = function(d) {
      return templateFileInList(d);
    };

    FileInListView.prototype.render = function() {
      console.log("render FileInList " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    FileInListView.prototype.events = {
      "click .do-edit-file": "edit",
      "click .do-delete-file": "delete",
      "click .do-save": "save",
      "click .do-testapp": "testapp"
    };

    FileInListView.prototype.edit = function(ev) {
      console.log("edit " + this.model.attributes._id);
      ev.preventDefault();
      return window.router.navigate("#ContentType/Track/edit/" + (encodeURIComponent(this.model.attributes._id)), {
        trigger: true
      });
    };

    FileInListView.prototype["delete"] = function(ev) {
      fileDeleter["delete"](this.model);
      ev.preventDefault();
      return false;
    };

    FileInListView.prototype.save = function(ev) {
      return this.model.download(ev);
    };

    FileInListView.prototype.testapp = function(ev) {
      ev.preventDefault();
      return offline.testFile(this.model);
    };

    return FileInListView;

  })(Backbone.View);

}).call(this);
}, "views/FileList": function(exports, require, module) {(function() {
  var File, FileEditView, FileInListView, FileListView, templateFileList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  File = require('models/File');

  FileInListView = require('views/FileInList');

  FileEditView = require('views/FileEdit');

  templateFileList = require('templates/FileList');

  module.exports = FileListView = (function(_super) {
    __extends(FileListView, _super);

    function FileListView() {
      this.addFile = __bind(this.addFile, this);
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return FileListView.__super__.constructor.apply(this, arguments);
    }

    FileListView.prototype.tagName = 'div';

    FileListView.prototype.className = 'row file-list top-level-view';

    FileListView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.add);
      return this.listenTo(this.model, 'remove', this.remove);
    };

    FileListView.prototype.template = function(d) {
      return templateFileList(d);
    };

    FileListView.prototype.render = function() {
      var views;
      console.log("render FileList with template");
      this.$el.html(this.template(this.model.attributes));
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    FileListView.prototype.views = [];

    FileListView.prototype.add = function(file) {
      var view;
      console.log("FileListView add " + file.attributes._id);
      if (file.attributes.ratingCount === 0 && (this.model.ratings[file.id] != null)) {
        console.log("Set ratings on add " + file.id + " " + (JSON.stringify(this.model.ratings[file.id])));
        file.set({
          ratingSum: this.model.ratings[file.id][0],
          ratingCount: this.model.ratings[file.id][1]
        });
      }
      view = new FileInListView({
        model: file
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    FileListView.prototype.remove = function(file) {
      var i, view, _i, _len, _ref;
      console.log("FileListView remove " + file.attributes._id);
      _ref = this.views;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        view = _ref[i];
        if (!(view.model.id === file.id)) {
          continue;
        }
        console.log("remove view");
        view.$el.remove();
        this.views.splice(i, 1);
        return;
      }
    };

    FileListView.prototype.events = {
      "click .do-add-file": "addFile"
    };

    FileListView.prototype.addFile = function(ev) {
      console.log("addFile");
      ev.preventDefault();
      return window.router.navigate("#ContentType/Track/add", {
        trigger: true
      });
    };

    return FileListView;

  })(Backbone.View);

}).call(this);
}});
