
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

  require('plugins/Html');

  require('plugins/Booklet');

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
}, "filebrowse": function(exports, require, module) {(function() {
  var App, ImageList, ImageSelectListView, db, getParams;

  ImageList = require('models/ImageList');

  ImageSelectListView = require('views/ImageSelectList');

  getParams = require('getParams');

  db = require('mydb');

  require('plugins/Track');

  App = {
    init: function() {
      var err, fileList, fileListView, params, typePrefix;
      console.log("filebrowse App starting...");
      params = getParams();
      typePrefix = params.type != null ? params.type : params.type = '';
      Backbone.sync = BackbonePouch.sync({
        db: db
      });
      Backbone.Model.prototype.idAttribute = '_id';
      _.extend(Backbone.Model.prototype, BackbonePouch.attachments());
      fileList = new ImageList();
      try {
        fileList.fetch();
      } catch (_error) {
        err = _error;
        alert("Error getting files: " + err.message);
      }
      fileListView = new ImageSelectListView({
        model: fileList
      });
      fileListView.render();
      return $('body').append(fileListView.el);
    }
  };

  module.exports = App;

}).call(this);
}, "getParams": function(exports, require, module) {(function() {
  var getParams;

  getParams = function() {
    var key, params, query, raw_vars, v, val, _i, _len, _ref;
    query = window.location.search.substring(1);
    raw_vars = query.split("&");
    params = {};
    for (_i = 0, _len = raw_vars.length; _i < _len; _i++) {
      v = raw_vars[_i];
      _ref = v.split("="), key = _ref[0], val = _ref[1];
      params[key] = decodeURIComponent(val);
    }
    return params;
  };

  module.exports = getParams;

}).call(this);
}, "models/Booklet": function(exports, require, module) {(function() {
  var Booklet,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = Booklet = (function(_super) {
    __extends(Booklet, _super);

    function Booklet() {
      return Booklet.__super__.constructor.apply(this, arguments);
    }

    Booklet.prototype.defaults = {
      title: '',
      description: '',
      type: 'booklet',
      coverurl: '',
      columns: []
    };

    return Booklet;

  })(Backbone.Model);

}).call(this);
}, "models/BookletList": function(exports, require, module) {(function() {
  var Booklet, BookletList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Booklet = require('models/Booklet');

  module.exports = BookletList = (function(_super) {
    __extends(BookletList, _super);

    function BookletList() {
      return BookletList.__super__.constructor.apply(this, arguments);
    }

    BookletList.prototype.model = Booklet;

    BookletList.prototype.pouch = {
      fetch: 'query',
      listen: true,
      options: {
        query: {
          include_docs: true,
          startkey: 'booklet',
          endkey: 'booklet',
          fun: 'app/type'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeBooklet'
        }
      }
    };

    BookletList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return BookletList;

  })(Backbone.Collection);

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
      fetch: 'query',
      error: function(err) {
        return console.log("ERROR(FileList) (sync): " + err);
      },
      listen: true,
      options: {
        error: function(err) {
          return console.log("ERROR(FileList/options) (sync): " + err);
        },
        query: {
          include_docs: true,
          fun: 'app/type',
          startkey: 'file',
          endkey: 'file'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeFile'
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
}, "models/Html": function(exports, require, module) {(function() {
  var Html,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = Html = (function(_super) {
    __extends(Html, _super);

    function Html() {
      return Html.__super__.constructor.apply(this, arguments);
    }

    Html.prototype.defaults = {
      title: '',
      description: '',
      type: 'html'
    };

    return Html;

  })(Backbone.Model);

}).call(this);
}, "models/HtmlList": function(exports, require, module) {(function() {
  var Html, HtmlList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Html = require('models/Html');

  module.exports = HtmlList = (function(_super) {
    __extends(HtmlList, _super);

    function HtmlList() {
      return HtmlList.__super__.constructor.apply(this, arguments);
    }

    HtmlList.prototype.model = Html;

    HtmlList.prototype.pouch = {
      fetch: 'query',
      error: function(err) {
        return console.log("ERROR(HtmlList) (sync): " + err);
      },
      listen: true,
      options: {
        error: function(err) {
          return console.log("ERROR(HtmlList/options) (sync): " + err);
        },
        query: {
          include_docs: true,
          fun: 'app/type',
          startkey: 'html',
          endkey: 'html'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeHtml'
        }
      }
    };

    HtmlList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return HtmlList;

  })(Backbone.Collection);

}).call(this);
}, "models/ImageList": function(exports, require, module) {(function() {
  var File, ImageList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  File = require('models/File');

  module.exports = ImageList = (function(_super) {
    __extends(ImageList, _super);

    function ImageList() {
      return ImageList.__super__.constructor.apply(this, arguments);
    }

    ImageList.prototype.model = File;

    ImageList.prototype.pouch = {
      fetch: 'query',
      options: {
        listen: false,
        query: {
          include_docs: true,
          fun: 'app/fileType',
          startkey: ['image', ''],
          endkey: ['image ', '']
        }
      }
    };

    ImageList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return ImageList;

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
}, "plugins/Booklet": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/Booklet');

  ThisThingList = require('models/BookletList');

  ThisThingListView = require('views/ThingList');

  ThisThingInListView = require('views/ThingInList');

  ThisThingView = null;

  ThisThingEditView = require('views/BookletEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'booket',
    title: 'Booklet',
    description: 'A collection of related content for distribution as part of an app'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/Html": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/Html');

  ThisThingList = require('models/HtmlList');

  ThisThingListView = require('views/ThingList');

  ThisThingInListView = require('views/ThingInList');

  ThisThingView = require('views/Html');

  ThisThingEditView = require('views/HtmlEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'html',
    title: 'HTML Fragment',
    description: 'A well-formed HTML fragment (actually just a place-holder at the moment!)'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/ThingBuilder": function(exports, require, module) {(function() {
  var ContentType, plugins;

  plugins = require('plugins');

  ContentType = require('models/ContentType');

  module.exports.createThingType = function(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView) {
    var contentType, things;
    things = null;
    contentType = new ContentType(attributes);
    ThisThing.contentType = contentType;
    ThisThing.prototype.getContentType = function() {
      return contentType;
    };
    contentType.getThingView = function(thing) {
      return new ThisThingInListView({
        model: thing
      });
    };
    contentType.createView = function() {
      var thingsView;
      console.log("create " + contentType.id + " view");
      things = new ThisThingList();
      thingsView = new ThisThingListView({
        model: things
      });
      thingsView.render();
      things.fetch();
      return thingsView;
    };
    contentType.createActionView = function(action, id) {
      var thing;
      if (action === 'edit') {
        if (ThisThingEditView == null) {
          alert("Sorry, cannot edit this kind of thing");
          return;
        }
        thing = things.get(id);
        if (thing == null) {
          alert("could not find " + contentType.id + " " + id);
          return;
        }
        return new ThisThingEditView({
          model: thing
        });
      } else if (action === 'view') {
        if (ThisThingView == null) {
          alert("Sorry, cannot view this kind of thing");
          return;
        }
        thing = things.get(id);
        if (thing == null) {
          alert("could not find " + contentType.id + " " + id);
          return;
        }
        return new ThisThingView({
          model: thing
        });
      } else if (action === 'add') {
        if (ThisThingEditView == null) {
          alert("Sorry, cannot add this kind of thing");
          return;
        }
        thing = new ThisThing({
          _id: contentType.id + ':' + uuid()
        });
        console.log("new id " + thing.id);
        return new ThisThingEditView({
          model: thing,
          add: true,
          things: things
        });
      } else {
        return console.log("unknown " + contentType.id + " action " + action + " (id " + id + ")");
      }
    };
    return contentType;
  };

}).call(this);
}, "plugins/Track": function(exports, require, module) {(function() {
  var File, FileEditView, FileInListView, FileList, FileListView, ThingBuilder, ThingView, attributes, contentType, plugins, superCreateView, updateRatings;

  plugins = require('plugins');

  File = require('models/File');

  FileList = require('models/FileList');

  FileListView = require('views/FileList');

  FileInListView = require('views/FileInList');

  ThingView = require('views/Thing');

  FileEditView = require('views/FileEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'file',
    title: 'File/Track',
    description: 'Initial test/development content type - part file, part audio track'
  };

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

  contentType = ThingBuilder.createThingType(attributes, File, FileList, FileListView, FileInListView, ThingView, FileEditView);

  superCreateView = contentType.createView;

  contentType.createView = function() {
    var thingsView;
    thingsView = superCreateView();
    thingsView.model.ratings = {};
    $.ajax(window.mediahubconfig.dburl + '/_design/app/_view/rating?group=true', {
      success: function(ratings) {
        return updateRatings(thingsView.model, ratings);
      },
      dataType: "text",
      error: function(xhr, status, err) {
        return console.log("get ratings error " + xhr.status + ": " + err.message);
      }
    });
    return thingsView;
  };

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "templates/BookletEdit": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(' ');
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push('</h2>\n</div>\n\n<form>\n  <div class="columns large-12">\n\n    <input type="submit" value="');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Save changes'));
    
      __out.push('"/>\n    <input type="reset" value="Clear"/>\n    <input type="button" value="Cancel" class="do-cancel"/>\n\n    <label>Title\n      <input type="text" name="title" placeholder="title" value="');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('"/>\n    </label>\n    <label>Description\n      <textarea name="description" placeholder="description" >');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</textarea>\n    </label>\n    <label>Cover\n      <div class="row">\n        <div class="columns large-4 medium-6 small-12">\n          <div class="image-select-icon">\n            <div class="dummy"></div>\n            <img class="image-select-image" src="');
    
      __out.push(__sanitize(this.data.coverurl));
    
      __out.push('"/>\n          </div>\n        </div>\n        <div class="columns large-4 medium-6 small-12">\n          <a href="#" class="button do-select-cover">Browse server...</a> \n        </div>\n      </div>\n    </label>\n\n    <label>Content\n      <textarea name="htmlcontent">');
    
      __out.push(__sanitize(this.content));
    
      __out.push('</textarea>\n    </label>\n\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ContentTypeInList": function(exports, require, module) {module.exports = function(__obj) {
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
}}, "templates/Html": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push(': ');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('</h2>\n  <p>');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</p>\n  <div class="html-preview clearfix">');
    
      __out.push(this.data.html);
    
      __out.push('</div>\n</div>\n<form>\n  <div class="columns large-12">\n    <input type="button" value="Edit" class="do-edit"/>\n    <input type="button" value="OK" class="do-cancel"/>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/HtmlEdit": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(' ');
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push('</h2>\n</div>\n<form>\n  <div class="columns large-12">\n    <label>Title\n      <input type="text" name="title" placeholder="title" value="');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('"/>\n    </label>\n    <label>Description\n      <textarea name="description" placeholder="description" >');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</textarea>\n    </label>\n    <label>Html\n      <textarea name="htmlfragment" >');
    
      __out.push(__sanitize(this.data.html));
    
      __out.push('</textarea>\n    </label>\n    <input type="submit" value="');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Save changes'));
    
      __out.push('"/>\n    <input type="reset" value="Clear"/>\n    <input type="button" value="Cancel" class="do-cancel"/>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ImageSelect": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<a href="#" class="do-select-file"><!-- do-preview-file -->\n  <div class="image-select-title-holder"><h4 class="image-select-title clearfix">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n    <!-- <a href="#" class="action-button do-select-file right">Select</a> -->\n  </h4></div>\n  <div class="image-select-icon">\n    <div class="dummy"></div>');
    
      __out.push('\n    <img src="');
    
      __out.push(__sanitize(this.imageurl));
    
      __out.push('" class="image-select-image"/>\n  </div>\n</a>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ImageSelectList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n  <div class="columns large-12 small-12">\n    <a href="#" class="button do-cancel">Cancel</a>\n  </div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/Thing": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push(': ');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('</h2>\n  <p>');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</p>\n</div>\n<form>\n  <div class="columns large-12">\n    <input type="button" value="Edit" class="do-edit"/>\n    <input type="button" value="OK" class="do-cancel"/>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingDeleteModal": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <h2>Permanently delete this item?</h2>\n  <p>Do you want to permanently delete ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('?</p>\n  <a class="close-reveal-modal">&#215;</a>\n  <a class="button do-delete">Yes</a>\n  <a class="button do-close">No</a>\n');
    
      __out.push('\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingEdit": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(' ');
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push('</h2>\n</div>\n<form>\n  <div class="columns large-12">\n    <label>Title\n      <input type="text" name="title" placeholder="title" value="');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('"/>\n    </label>\n    <label>Description\n      <textarea name="description" placeholder="description" >');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</textarea>\n    </label>\n    <input type="submit" value="');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Save changes'));
    
      __out.push('"/>\n    <input type="reset" value="Clear"/>\n    <input type="button" value="Cancel" class="do-cancel"/>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingInList": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <a href="#-delete-file" class="action-button do-delete-file right">Delete</a>\n  <a href="#-edit-file" class="action-button do-edit-file right">Edit</a>\n  <a href="#-view-file" class="action-button do-view-file right">View</a>\n</h3>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n  <div class="columns large-12 small-12">\n    <h2>');
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push(' List</h2>\n    <a href="#-add-thing" class="button do-add-thing">Add...</a>\n  </div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "thingDeleter": function(exports, require, module) {(function() {
  var currentModel, templateFileDeleteModal;

  templateFileDeleteModal = require('templates/ThingDeleteModal');

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
}, "views/BookletEdit": function(exports, require, module) {(function() {
  var BookletEditView, ThingEditView, templateBookletEdit,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateBookletEdit = require('templates/BookletEdit');

  ThingEditView = require('views/ThingEdit');

  window.mediahubCallbacks = {};

  window.nextMediahubCallback = 1;

  module.exports = BookletEditView = (function(_super) {
    __extends(BookletEditView, _super);

    function BookletEditView() {
      this.remove = __bind(this.remove, this);
      this.selectCover = __bind(this.selectCover, this);
      this.remove = __bind(this.remove, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return BookletEditView.__super__.constructor.apply(this, arguments);
    }

    BookletEditView.prototype.template = function(d) {
      return templateBookletEdit(_.extend({
        content: ""
      }, d));
    };

    BookletEditView.prototype.render = function() {
      var replace;
      BookletEditView.__super__.render.call(this);
      replace = function() {
        var ckconfig, ix, path;
        console.log("Set up CKEditor...");
        path = window.location.pathname;
        ix = path.lastIndexOf('/');
        ckconfig = {};
        ckconfig.extraPlugins = 'widget,mediahubcolumn';
        return CKEDITOR.replace('htmlcontent', ckconfig);
      };
      return setTimeout(replace, 0);
    };

    BookletEditView.prototype.formToModel = function() {
      var coverurl;
      coverurl = $('.image-select-image', this.$el).attr('src');
      console.log("coverurl = " + coverurl);
      this.model.set({
        coverurl: coverurl
      });
      return BookletEditView.__super__.formToModel.call(this);
    };

    BookletEditView.prototype.remove = function() {
      var editor;
      editor = CKEDITOR.instances['htmlcontent'];
      if (editor) {
        console.log("destroy ckeditor");
        editor.destroy(true);
      }
      return BookletEditView.__super__.remove.call(this);
    };

    BookletEditView.prototype.events = {
      "submit": "submit",
      "click .do-cancel": "cancel",
      "click .do-save": "save",
      "click .do-select-cover": "selectCover"
    };

    BookletEditView.prototype.selectCover = function(ev) {
      var ix, path, self;
      console.log("selectCover...");
      ev.preventDefault();
      path = window.location.pathname;
      ix = path.lastIndexOf('/');
      if (ix < 0) {
        alert("Error in pathname: " + path);
        return false;
      }
      path = path.substring(0, ix + 1);
      this.callback = window.nextMediahubCallback++;
      self = this;
      window.mediahubCallbacks[this.callback] = function(url) {
        console.log("set cover " + url);
        return $('.image-select-image', self.$el).attr('src', url);
      };
      return window.open(path + ("filebrowse.html?type=image%2F&mediahubCallback=" + this.callback), '_blank', "width=" + (0.8 * screen.width) + ", height=" + (0.7 * screen.height) + ", menubar=no, location=no, status=no, toolbar=no");
    };

    BookletEditView.prototype.remove = function() {
      if (this.callback != null) {
        delete window.mediahubCallbacks[this.callback];
      }
      return BookletEditView.__super__.remove.call(this);
    };

    return BookletEditView;

  })(ThingEditView);

}).call(this);
}, "views/ContentTypeInList": function(exports, require, module) {(function() {
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
  var FileInListView, ThingInListView, offline, templateFileInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateFileInList = require('templates/FileInList');

  ThingInListView = require('views/ThingInList');

  offline = require('offline');

  module.exports = FileInListView = (function(_super) {
    __extends(FileInListView, _super);

    function FileInListView() {
      this.testapp = __bind(this.testapp, this);
      this.save = __bind(this.save, this);
      this.template = __bind(this.template, this);
      return FileInListView.__super__.constructor.apply(this, arguments);
    }

    FileInListView.prototype.template = function(d) {
      return templateFileInList(d);
    };

    FileInListView.prototype.events = {
      "click .do-edit-file": "edit",
      "click .do-delete-file": "delete",
      "click .do-save": "save",
      "click .do-testapp": "testapp"
    };

    FileInListView.prototype.save = function(ev) {
      return this.model.download(ev);
    };

    FileInListView.prototype.testapp = function(ev) {
      ev.preventDefault();
      return offline.testFile(this.model);
    };

    return FileInListView;

  })(ThingInListView);

}).call(this);
}, "views/FileList": function(exports, require, module) {(function() {
  var FileListView, ThingListView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ThingListView = require('views/ThingList');

  module.exports = FileListView = (function(_super) {
    __extends(FileListView, _super);

    function FileListView() {
      this.add = __bind(this.add, this);
      return FileListView.__super__.constructor.apply(this, arguments);
    }

    FileListView.prototype.add = function(file) {
      console.log("FileListView add " + file.attributes._id);
      if (file.attributes.ratingCount === 0 && (this.model.ratings[file.id] != null)) {
        console.log("Set ratings on add " + file.id + " " + (JSON.stringify(this.model.ratings[file.id])));
        file.set({
          ratingSum: this.model.ratings[file.id][0],
          ratingCount: this.model.ratings[file.id][1]
        });
      }
      return FileListView.__super__.add.call(this, file);
    };

    return FileListView;

  })(ThingListView);

}).call(this);
}, "views/Html": function(exports, require, module) {(function() {
  var HtmlView, ThingView, templateHtml,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateHtml = require('templates/Html');

  ThingView = require('views/Thing');

  module.exports = HtmlView = (function(_super) {
    __extends(HtmlView, _super);

    function HtmlView() {
      this.template = __bind(this.template, this);
      return HtmlView.__super__.constructor.apply(this, arguments);
    }

    HtmlView.prototype.template = function(d) {
      return templateHtml(d);
    };

    return HtmlView;

  })(ThingView);

}).call(this);
}, "views/HtmlEdit": function(exports, require, module) {(function() {
  var HtmlEditView, ThingEditView, templateHtmlEdit,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateHtmlEdit = require('templates/HtmlEdit');

  ThingEditView = require('views/ThingEdit');

  module.exports = HtmlEditView = (function(_super) {
    __extends(HtmlEditView, _super);

    function HtmlEditView() {
      this.remove = __bind(this.remove, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return HtmlEditView.__super__.constructor.apply(this, arguments);
    }

    HtmlEditView.prototype.template = function(d) {
      return templateHtmlEdit(d);
    };

    HtmlEditView.prototype.render = function() {
      var replace;
      HtmlEditView.__super__.render.call(this);
      replace = function() {
        var ckconfig, ix, path;
        console.log("Set up CKEditor...");
        ckconfig = {};
        path = window.location.pathname;
        ix = path.lastIndexOf('/');
        if (ix < 0) {
          console.log("Location path not valid: " + path);
        } else {
          path = path.substring(0, ix + 1);
          ckconfig.filebrowserBrowseUrl = path + 'filebrowse.html';
          ckconfig.filebrowserImageBrowseUrl = path + 'filebrowse.html?type=image%2F';
        }
        return CKEDITOR.replace('htmlfragment', ckconfig);
      };
      return setTimeout(replace, 0);
    };

    HtmlEditView.prototype.formToModel = function() {
      var html;
      html = $(':input[name="htmlfragment"]', this.$el).val();
      console.log("html = " + html);
      this.model.set('html', html);
      return HtmlEditView.__super__.formToModel.call(this);
    };

    HtmlEditView.prototype.remove = function() {
      var editor;
      editor = CKEDITOR.instances['htmlfragment'];
      if (editor) {
        console.log("destroy ckeditor");
        editor.destroy(true);
      }
      return HtmlEditView.__super__.remove.call(this);
    };

    return HtmlEditView;

  })(ThingEditView);

}).call(this);
}, "views/ImageSelect": function(exports, require, module) {(function() {
  var ImageSelectView, getParams, templateImageSelect,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateImageSelect = require('templates/ImageSelect');

  getParams = require('getParams');

  module.exports = ImageSelectView = (function(_super) {
    __extends(ImageSelectView, _super);

    function ImageSelectView() {
      this.select = __bind(this.select, this);
      this.preview = __bind(this.preview, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ImageSelectView.__super__.constructor.apply(this, arguments);
    }

    ImageSelectView.prototype.tagName = 'div';

    ImageSelectView.prototype.className = 'columns image-select';

    ImageSelectView.prototype.initialize = function() {
      var config;
      config = window.mediahubconfig;
      this.fileUrl = config.dburl + '/' + encodeURIComponent(this.model.id) + '/bytes';
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    ImageSelectView.prototype.template = function(d) {
      return templateImageSelect(d);
    };

    ImageSelectView.prototype.render = function() {
      console.log("render ImageSelect " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template(_.extend({}, this.model.attributes, {
        imageurl: this.fileUrl
      })));
      return this;
    };

    ImageSelectView.prototype.events = {
      "click .do-select-file": "select",
      "click .do-preview-file": "preview"
    };

    ImageSelectView.prototype.preview = function(ev) {
      console.log("preview " + this.model.attributes._id);
      return ev.preventDefault();
    };

    ImageSelectView.prototype.select = function(ev) {
      var err, funcNum, mediahubCallback, params;
      console.log("select " + this.model.attributes._id);
      ev.preventDefault();
      params = getParams();
      mediahubCallback = params['mediahubCallback'];
      funcNum = params['CKEditorFuncNum'];
      if (mediahubCallback != null) {
        console.log("- mediahubCallback " + mediahubCallback + " fileUrl = " + this.fileUrl);
        try {
          window.opener.mediahubCallbacks[mediahubCallback](this.fileUrl);
        } catch (_error) {
          err = _error;
          console.log("error calling mediahubCallback: " + err.message);
        }
        return window.close();
      } else if (funcNum != null) {
        console.log("- ckeditor fileUrl = " + this.fileUrl);
        window.opener.CKEDITOR.tools.callFunction(funcNum, this.fileUrl);
        return window.close();
      } else {
        return alert("Error: could not find parameter CKEditorFuncNum or mediahubCallback");
      }
    };

    return ImageSelectView;

  })(Backbone.View);

}).call(this);
}, "views/ImageSelectList": function(exports, require, module) {(function() {
  var ImageSelectListView, ImageSelectView, ThingListView, templateImageSelectList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateImageSelectList = require('templates/ImageSelectList');

  ThingListView = require('views/ThingList');

  ImageSelectView = require('views/ImageSelect');

  module.exports = ImageSelectListView = (function(_super) {
    __extends(ImageSelectListView, _super);

    function ImageSelectListView() {
      this.add = __bind(this.add, this);
      this.template = __bind(this.template, this);
      return ImageSelectListView.__super__.constructor.apply(this, arguments);
    }

    ImageSelectListView.prototype.template = function(d) {
      return templateImageSelectList(d);
    };

    ImageSelectListView.prototype.add = function(thing) {
      var view;
      console.log("ImageSelectListView add " + thing.id);
      view = new ImageSelectView({
        model: thing
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    ImageSelectListView.prototype.events = {
      "click .do-cancel": "closeWindow"
    };

    ImageSelectListView.prototype.closeWindow = function() {
      console.log("Cancel = close");
      return window.close();
    };

    return ImageSelectListView;

  })(ThingListView);

}).call(this);
}, "views/Thing": function(exports, require, module) {(function() {
  var ThingView, templateThing,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThing = require('templates/Thing');

  module.exports = ThingView = (function(_super) {
    __extends(ThingView, _super);

    function ThingView() {
      this.edit = __bind(this.edit, this);
      this.close = __bind(this.close, this);
      this.cancel = __bind(this.cancel, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingView.__super__.constructor.apply(this, arguments);
    }

    ThingView.prototype.tagName = 'div';

    ThingView.prototype.className = 'row thing';

    ThingView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    ThingView.prototype.template = function(d) {
      return templateThing(d);
    };

    ThingView.prototype.render = function() {
      console.log("render Thing " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template({
        data: this.model.attributes,
        contentType: this.model.getContentType().attributes
      }));
      return this;
    };

    ThingView.prototype.events = {
      "click .do-cancel": "cancel",
      "click .do-edit": "edit"
    };

    ThingView.prototype.cancel = function(ev) {
      ev.preventDefault();
      return this.close();
    };

    ThingView.prototype.close = function() {
      this.remove();
      return window.history.back();
    };

    ThingView.prototype.edit = function(ev) {
      ev.preventDefault();
      return window.router.navigate("#ContentType/" + (this.model.getContentType().id) + "/edit/" + (encodeURIComponent(this.model.attributes._id)), {
        trigger: true
      });
    };

    return ThingView;

  })(Backbone.View);

}).call(this);
}, "views/ThingEdit": function(exports, require, module) {(function() {
  var ThingEditView, templateThingEdit,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingEdit = require('templates/ThingEdit');

  module.exports = ThingEditView = (function(_super) {
    __extends(ThingEditView, _super);

    function ThingEditView(options) {
      this.close = __bind(this.close, this);
      this.cancel = __bind(this.cancel, this);
      this.submit = __bind(this.submit, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      this.add = options.add != null ? options.add : options.add = false;
      this.things = options.things != null ? options.things : options.things = null;
      ThingEditView.__super__.constructor.call(this, options);
    }

    ThingEditView.prototype.tagName = 'div';

    ThingEditView.prototype.className = 'row thing-edit';

    ThingEditView.prototype.cancelled = false;

    ThingEditView.prototype.initialize = function() {};

    ThingEditView.prototype.template = function(d) {
      return templateThingEdit(d);
    };

    ThingEditView.prototype.render = function() {
      var f;
      console.log("render ThingEdit " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template({
        data: this.model.attributes,
        add: this.add,
        contentType: this.model.getContentType().attributes
      }));
      f = function() {
        return $('input[name="title"]', this.$el).focus();
      };
      setTimeout(f, 0);
      return this;
    };

    ThingEditView.prototype.events = {
      "submit": "submit",
      "click .do-cancel": "cancel",
      "click .do-save": "save"
    };

    ThingEditView.prototype.formToModel = function() {
      var description, title;
      title = $('input[name="title"]', this.$el).val();
      description = $(':input[name="description"]', this.$el).val();
      console.log("title=" + title + ", description=" + description);
      this.model.set('title', title);
      return this.model.set('description', description);
    };

    ThingEditView.prototype.submit = function(ev) {
      console.log("submit...");
      ev.preventDefault();
      this.formToModel();
      this.model.save();
      return this.close();
    };

    ThingEditView.prototype.cancel = function() {
      console.log("cancel");
      this.cancelled = true;
      if ((this.model.id != null) && (this.things != null)) {
        console.log("try remove on cancel for " + this.model.id);
      }
      return this.close();
    };

    ThingEditView.prototype.close = function() {
      this.remove();
      return window.history.back();
    };

    return ThingEditView;

  })(Backbone.View);

}).call(this);
}, "views/ThingInList": function(exports, require, module) {(function() {
  var ThingInListView, templateThingInList, thingDeleter,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingInList = require('templates/ThingInList');

  thingDeleter = require('thingDeleter');

  module.exports = ThingInListView = (function(_super) {
    __extends(ThingInListView, _super);

    function ThingInListView() {
      this["delete"] = __bind(this["delete"], this);
      this.edit = __bind(this.edit, this);
      this.view = __bind(this.view, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingInListView.__super__.constructor.apply(this, arguments);
    }

    ThingInListView.prototype.tagName = 'div';

    ThingInListView.prototype.className = 'columns thing-in-list';

    ThingInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    ThingInListView.prototype.template = function(d) {
      return templateThingInList(d);
    };

    ThingInListView.prototype.render = function() {
      console.log("render ThingInList " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    ThingInListView.prototype.events = {
      "click .do-view-file": "view",
      "click .do-edit-file": "edit",
      "click .do-delete-file": "delete"
    };

    ThingInListView.prototype.view = function(ev) {
      console.log("view " + this.model.attributes._id);
      ev.preventDefault();
      return window.router.navigate("#ContentType/" + (this.model.getContentType().id) + "/view/" + (encodeURIComponent(this.model.attributes._id)), {
        trigger: true
      });
    };

    ThingInListView.prototype.edit = function(ev) {
      console.log("edit " + this.model.attributes._id);
      ev.preventDefault();
      return window.router.navigate("#ContentType/" + (this.model.getContentType().id) + "/edit/" + (encodeURIComponent(this.model.attributes._id)), {
        trigger: true
      });
    };

    ThingInListView.prototype["delete"] = function(ev) {
      thingDeleter["delete"](this.model);
      ev.preventDefault();
      return false;
    };

    return ThingInListView;

  })(Backbone.View);

}).call(this);
}, "views/ThingList": function(exports, require, module) {(function() {
  var ThingListView, templateThingList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingList = require('templates/ThingList');

  module.exports = ThingListView = (function(_super) {
    __extends(ThingListView, _super);

    function ThingListView() {
      this.addThing = __bind(this.addThing, this);
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingListView.__super__.constructor.apply(this, arguments);
    }

    ThingListView.prototype.tagName = 'div';

    ThingListView.prototype.className = 'row thing-list top-level-view';

    ThingListView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.add);
      return this.listenTo(this.model, 'remove', this.remove);
    };

    ThingListView.prototype.template = function(d) {
      return templateThingList(d);
    };

    ThingListView.prototype.render = function() {
      var views;
      console.log("render ThingList, contentType=" + this.model.model.contentType.id);
      this.$el.html(this.template({
        contentType: this.model.model.contentType.attributes
      }));
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    ThingListView.prototype.views = [];

    ThingListView.prototype.add = function(thing) {
      var view;
      console.log("ThingListView add " + thing.id);
      view = this.model.model.contentType.getThingView(thing);
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    ThingListView.prototype.remove = function(thing) {
      var i, view, _i, _len, _ref;
      console.log("ThingListView remove " + thing.id);
      _ref = this.views;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        view = _ref[i];
        if (!(view.model.id === thing.id)) {
          continue;
        }
        console.log("remove view");
        view.$el.remove();
        this.views.splice(i, 1);
        return;
      }
    };

    ThingListView.prototype.events = {
      "click .do-add-thing": "addThing"
    };

    ThingListView.prototype.addThing = function(ev) {
      console.log("addThing");
      ev.preventDefault();
      return window.router.navigate("#ContentType/" + this.model.model.contentType.id + "/add", {
        trigger: true
      });
    };

    return ThingListView;

  })(Backbone.View);

}).call(this);
}});
