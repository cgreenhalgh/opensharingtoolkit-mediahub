
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
}).call(this)({"addTaskConfig": function(exports, require, module) {(function() {
  var TaskConfig, currentModel, templateTaskConfigPathModal;

  templateTaskConfigPathModal = require('templates/TaskConfigPathModal');

  TaskConfig = require('models/TaskConfig');

  currentModel = null;

  $('#taskConfigPathModalHolder').on('closed.fndtn.reveal', function() {
    console.log("taskConfigPathModalHolder closed.fndtn.reveal");
    return currentModel = null;
  });

  $('#taskConfigPathModalHolder').on('opened.fndtn.reveal', function() {
    console.log("taskConfigPathModalHolder opened");
    return $('#taskConfigPathModalHolder input[name=path]').focus();
  });

  $('#taskConfigPathModalHolder').on('submit', function(ev) {
    var path;
    ev.preventDefault();
    path = $('#taskConfigPathModalHolder input[name=path]').val();
    console.log("do-ok " + currentModel._id + " '" + path + "'");
    while ((path.indexOf('/')) === 0) {
      path = path.substring(1);
    }
    while (path.length > 0 && (path.lastIndexOf('/')) === (path.length - 1)) {
      path = path.substring(0, path.length - 1);
    }
    if (path.length === 0) {
      return;
    }
    currentModel.path = path;
    currentModel._id = "taskconfig:" + (encodeURIComponent(path));
    if (currentModel._suffix != null) {
      currentModel._id = currentModel._id + currentModel._suffix;
      delete currentModel._suffix;
    }
    $('#taskConfigPathModalHolder').foundation('reveal', 'close');
    if ((currentModel != null) && currentModel._id) {
      console.log("try #ContentType/taskconfig/add/" + (encodeURIComponent(currentModel._id)) + " with " + (JSON.stringify(currentModel)));
      TaskConfig.addingThings[currentModel._id] = currentModel;
      window.router.navigate("#ContentType/taskconfig/add/" + (encodeURIComponent(currentModel._id)), {
        trigger: true
      });
      return currentModel = null;
    } else {
      return console.log("error: taskConfigPathModalHolder do-ok with null currentModel");
    }
  });

  $('#taskConfigPathModalHolder').on('click', '.do-close', function(ev) {
    console.log("taskConfigPathModalHolder do-close");
    currentModel = null;
    return $('#taskConfigPathModalHolder').foundation('reveal', 'close');
  });

  module.exports.add = function(attributes) {
    console.log("addTaskConfig " + attributes._id);
    currentModel = attributes;
    $('#taskConfigPathModalHolder').html(templateTaskConfigPathModal(attributes));
    return $('#taskConfigPathModalHolder').foundation('reveal', 'open');
  };

}).call(this);
}, "allthings": function(exports, require, module) {(function() {
  var ThingList, server, singleton;

  ThingList = require('models/ThingList');

  server = require('server');

  singleton = null;

  module.exports.get = function() {
    if (singleton == null) {
      console.log("initialising ThingList for allthings");
      singleton = new ThingList();
      server.working('allthings');
      singleton.fetch({
        success: server.success,
        error: server.error
      });
    }
    return singleton;
  };

}).call(this);
}, "app": function(exports, require, module) {(function() {
  var App, ContentTypeList, ContentTypeListView, Router, allthings, config, db, plugins, server, taskstates, tempViews,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ContentTypeList = require('models/ContentTypeList');

  ContentTypeListView = require('views/ContentTypeList');

  db = require('mydb');

  plugins = require('plugins');

  server = require('server');

  allthings = require('allthings');

  taskstates = require('taskstates');

  require('plugins/File');

  require('plugins/Html');

  require('plugins/Booklet');

  require('plugins/Place');

  require('plugins/List');

  require('plugins/App');

  require('plugins/TaskConfig');

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
      $('.reveal-modal.open', document).foundation('reveal', 'close');
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
      server.working('starting up');
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
        contentTypes.add(ct);
        return ct.init();
      });
      contentTypesView = new ContentTypeListView({
        model: contentTypes
      });
      contentTypesView.render();
      $('body').append(contentTypesView.el);
      router = new Router;
      window.router = router;
      Backbone.history.start();
      allthings.get();
      taskstates.get();
      return server.success(null, null, {});
    }
  };

  module.exports = App;

}).call(this);
}, "filebrowse": function(exports, require, module) {(function() {
  var App, ImageList, ImageSelectListView, db, getParams, server;

  ImageList = require('models/ImageList');

  ImageSelectListView = require('views/ImageSelectList');

  getParams = require('getParams');

  server = require('server');

  db = require('mydb');

  require('plugins/File');

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
        server.working('fileList');
        fileList.fetch({
          success: server.success,
          error: server.error
        });
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
}, "models/App": function(exports, require, module) {(function() {
  var App, Thing,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

  module.exports = App = (function(_super) {
    __extends(App, _super);

    function App() {
      return App.__super__.constructor.apply(this, arguments);
    }

    App.prototype.defaults = {
      title: '',
      description: '',
      type: 'app',
      thingIds: []
    };

    App.prototype.idAttribute = '_id';

    return App;

  })(Thing);

}).call(this);
}, "models/AppList": function(exports, require, module) {(function() {
  var App, AppList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  App = require('models/App');

  module.exports = AppList = (function(_super) {
    __extends(AppList, _super);

    function AppList() {
      return AppList.__super__.constructor.apply(this, arguments);
    }

    AppList.prototype.model = App;

    AppList.prototype.pouch = {
      fetch: 'query',
      listen: true,
      options: {
        query: {
          include_docs: true,
          fun: 'app/type',
          startkey: 'app',
          endkey: 'app'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeApp'
        }
      }
    };

    AppList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return AppList;

  })(Backbone.Collection);

}).call(this);
}, "models/Booklet": function(exports, require, module) {(function() {
  var Booklet, Thing,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

  module.exports = Booklet = (function(_super) {
    __extends(Booklet, _super);

    function Booklet() {
      return Booklet.__super__.constructor.apply(this, arguments);
    }

    Booklet.prototype.defaults = {
      title: '',
      description: '',
      type: 'booklet',
      content: ''
    };

    Booklet.prototype.idAttribute = '_id';

    return Booklet;

  })(Thing);

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
  var File, Thing,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

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

    File.prototype.idAttribute = '_id';

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

  })(Thing);

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
  var Html, Thing,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

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

    Html.prototype.idAttribute = '_id';

    return Html;

  })(Thing);

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
}, "models/List": function(exports, require, module) {(function() {
  var Place, Thing,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

  module.exports = Place = (function(_super) {
    __extends(Place, _super);

    function Place() {
      return Place.__super__.constructor.apply(this, arguments);
    }

    Place.prototype.defaults = {
      title: '',
      description: '',
      type: 'list',
      thingsIds: []
    };

    Place.prototype.idAttribute = '_id';

    return Place;

  })(Thing);

}).call(this);
}, "models/ListList": function(exports, require, module) {(function() {
  var List, ListList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  List = require('models/List');

  module.exports = ListList = (function(_super) {
    __extends(ListList, _super);

    function ListList() {
      return ListList.__super__.constructor.apply(this, arguments);
    }

    ListList.prototype.model = List;

    ListList.prototype.pouch = {
      fetch: 'query',
      listen: true,
      options: {
        query: {
          include_docs: true,
          fun: 'app/type',
          startkey: 'list',
          endkey: 'list'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeList'
        }
      }
    };

    ListList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return ListList;

  })(Backbone.Collection);

}).call(this);
}, "models/Place": function(exports, require, module) {(function() {
  var Place, Thing,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

  module.exports = Place = (function(_super) {
    __extends(Place, _super);

    function Place() {
      return Place.__super__.constructor.apply(this, arguments);
    }

    Place.prototype.defaults = {
      title: '',
      description: '',
      type: 'place',
      imageurl: '',
      iconurl: '',
      mapiconurl: '',
      lat: 0,
      lon: 0,
      address: '',
      zoom: 0
    };

    Place.prototype.idAttribute = '_id';

    return Place;

  })(Thing);

}).call(this);
}, "models/PlaceList": function(exports, require, module) {(function() {
  var Place, PlaceList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Place = require('models/Place');

  module.exports = PlaceList = (function(_super) {
    __extends(PlaceList, _super);

    function PlaceList() {
      return PlaceList.__super__.constructor.apply(this, arguments);
    }

    PlaceList.prototype.model = Place;

    PlaceList.prototype.pouch = {
      fetch: 'query',
      listen: true,
      options: {
        query: {
          include_docs: true,
          startkey: 'place',
          endkey: 'place',
          fun: 'app/type'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typePlace'
        }
      }
    };

    PlaceList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return PlaceList;

  })(Backbone.Collection);

}).call(this);
}, "models/TaskConfig": function(exports, require, module) {(function() {
  var TaskConfig, Thing,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

  module.exports = TaskConfig = (function(_super) {
    __extends(TaskConfig, _super);

    function TaskConfig() {
      return TaskConfig.__super__.constructor.apply(this, arguments);
    }

    TaskConfig.prototype.defaults = {
      type: 'taskconfig',
      subjectId: '',
      path: '',
      url: '',
      taskType: '',
      enabled: true,
      lastChanged: null
    };

    TaskConfig.prototype.idAttribute = '_id';

    return TaskConfig;

  })(Thing);

}).call(this);
}, "models/TaskConfigList": function(exports, require, module) {(function() {
  var TaskConfig, TaskConfigList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TaskConfig = require('models/TaskConfig');

  module.exports = TaskConfigList = (function(_super) {
    __extends(TaskConfigList, _super);

    function TaskConfigList() {
      return TaskConfigList.__super__.constructor.apply(this, arguments);
    }

    TaskConfigList.prototype.model = TaskConfig;

    TaskConfigList.prototype.pouch = {
      fetch: 'query',
      listen: true,
      options: {
        query: {
          include_docs: true,
          fun: 'app/type',
          startkey: 'taskconfig',
          endkey: 'taskconfig'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeTaskconfig'
        }
      }
    };

    TaskConfigList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return TaskConfigList;

  })(Backbone.Collection);

}).call(this);
}, "models/TaskStateList": function(exports, require, module) {(function() {
  var TaskStateList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = TaskStateList = (function(_super) {
    __extends(TaskStateList, _super);

    function TaskStateList() {
      this.onChange = __bind(this.onChange, this);
      this.fetch = __bind(this.fetch, this);
      return TaskStateList.__super__.constructor.apply(this, arguments);
    }

    TaskStateList.prototype.pouch = {
      fetch: 'query',
      listen: true,
      options: {
        query: {
          include_docs: true,
          fun: 'app/type',
          startkey: 'taskstate',
          endkey: 'taskstate'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/changesTaskstate'
        }
      }
    };

    TaskStateList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    TaskStateList.prototype.fetch = function(fetchOptions) {
      var poll, pouchOptions, reset;
      pouchOptions = this.sync();
      if (!pouchOptions.db) {
        throw new Error('A "db" property must be specified (TaskStateList.fetch)');
      }
      this.changeOptions = _.extend({}, pouchOptions.options.changes, this.pouch.options.changes, {
        timeout: 0,
        continuous: false
      });
      this.changeOptions.timeout;
      reset = (function(_this) {
        return function() {
          if (_this.pollTimer) {
            clearTimeout(_this.pollTimer);
          }
          return _this.pollTimer = setTimeout(poll, _this.changeOptions.timeout + 1000);
        };
      })(this);
      poll = (function(_this) {
        return function(first) {
          var err;
          if (!first) {
            if (_this.pollTimer) {
              clearTimeout(_this.pollTimer);
            }
            _this.pollTimer = setTimeout(poll, _this.changeOptions.timeout + 1000);
          }
          if (_this.changes) {
            try {
              console.log("Cancel old changes feed on timeout");
              _this.changes.cancel();
            } catch (_error) {
              err = _error;
              console.log("error cancelling changes feed: " + err.message);
            }
          }
          console.log("fetch: changeOptions " + (JSON.stringify(_this.changeOptions)));
          _this.changes = pouchOptions.db.changes(_this.changeOptions);
          _this.changes.on('change', _this.onChange);
          _this.changes.on('error', function(err) {
            console.log("TaskStateList: error: " + err);
            if (first && (fetchOptions.error != null)) {
              fetchOptions.error(_this, err, fetchOptions);
            }
            return reset(true);
          });
          return _this.changes.on('complete', function(resp) {
            console.log("TaskStateList: complete: " + resp + " last_seq " + resp.last_seq);
            if (resp.last_seq == null) {
              return;
            }
            try {
              if (first && (fetchOptions.success != null)) {
                fetchOptions.success(_this, resp, fetchOptions);
              }
              if (resp.last_seq != null) {
                _this.changeOptions.since = resp.last_seq;
              }
              reset(true);
              if (first) {
                _this.changes = null;
                console.log("start continuous fetch...");
                _this.changeOptions.continuous = true;
                _this.changeOptions.timeout = 20000;
                return poll();
              }
            } catch (_error) {
              err = _error;
              return console.log("error handling complete: " + err.message + ", " + err.stack);
            }
          });
        };
      })(this);
      return poll(true);
    };

    TaskStateList.prototype.onChange = function(change) {
      var todo;
      console.log("TaskStateList: change: " + change);
      todo = this.get(change.id);
      if (change.deleted) {
        if (todo) {
          return todo.destroy();
        }
      } else {
        if (todo) {
          return todo.set(change.doc);
        } else {
          return this.add(change.doc);
        }
      }
    };

    return TaskStateList;

  })(Backbone.Collection);

}).call(this);
}, "models/Thing": function(exports, require, module) {(function() {
  var Thing,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = Thing = (function(_super) {
    __extends(Thing, _super);

    function Thing() {
      this.getSortValue = __bind(this.getSortValue, this);
      return Thing.__super__.constructor.apply(this, arguments);
    }

    Thing.prototype.defaults = {
      title: '',
      description: '',
      iconurl: '',
      imageurl: ''
    };

    Thing.prototype.idAttribute = '_id';

    Thing.prototype.getSortValue = function() {
      var ix, typeName;
      typeName = '';
      if (this.id != null) {
        ix = this.id.indexOf(':');
        if (ix >= 0) {
          typeName = this.id.substring(0, ix);
        }
      }
      return "" + typeName + ":" + this.attributes.title;
    };

    return Thing;

  })(Backbone.Model);

}).call(this);
}, "models/ThingList": function(exports, require, module) {(function() {
  var Thing, ThingList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Thing = require('models/Thing');

  module.exports = ThingList = (function(_super) {
    __extends(ThingList, _super);

    function ThingList() {
      return ThingList.__super__.constructor.apply(this, arguments);
    }

    ThingList.prototype.model = Thing;

    ThingList.prototype.pouch = {
      fetch: 'query',
      listen: false,
      options: {
        query: {
          include_docs: true,
          fun: 'app/typeThing'
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: 'app/typeThing'
        }
      }
    };

    ThingList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return ThingList;

  })(Backbone.Collection);

}).call(this);
}, "models/ThingRef": function(exports, require, module) {(function() {
  var ThingRef,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ThingRef = (function(_super) {
    __extends(ThingRef, _super);

    function ThingRef() {
      return ThingRef.__super__.constructor.apply(this, arguments);
    }

    ThingRef.prototype.defaults = {
      thingId: '',
      thing: null
    };

    ThingRef.prototype.sync = function(method, model, options) {
      return console.log("ignore sync for ThingRef");
    };

    return ThingRef;

  })(Backbone.Model);

}).call(this);
}, "models/ThingRefList": function(exports, require, module) {(function() {
  var ThingRef, ThingRefList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ThingRef = require('models/ThingRef');

  module.exports = ThingRefList = (function(_super) {
    __extends(ThingRefList, _super);

    function ThingRefList() {
      return ThingRefList.__super__.constructor.apply(this, arguments);
    }

    ThingRefList.prototype.model = ThingRef;

    return ThingRefList;

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

  module.exports.testBooklet = function(booklet) {
    var clientid;
    console.log("Offline test with booklet " + booklet.id);
    clientid = window.clientid;
    if (clientid.indexOf('client:') !== 0) {
      clientid = 'client:' + clientid;
    }
    return db.get(clientid, function(err, client) {
      var content, coverurl, m, src, srcs;
      if (err != null) {
        console.log("error getting client " + err + " - new?");
        client = {
          _id: clientid
        };
      } else {
        console.log("got client " + client._id + " " + client._rev);
      }
      client.files = [];
      coverurl = booklet.attributes.coverurl;
      if ((coverurl != null) && coverurl !== '') {
        client.files.push({
          url: coverurl,
          title: 'cover'
        });
      }
      content = booklet.attributes.content;
      if (content != null) {
        srcs = /<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/g;
        while (m = srcs.exec(content)) {
          src = m[1];
          if (src.length > 0) {
            client.files.push({
              url: src,
              title: 'img'
            });
          }
        }
      }
      client.items = [];
      client.items.push({
        id: booklet.id,
        type: 'booklet',
        url: config.dburl + "/" + booklet.id
      });
      return db.put(client, function(err, response) {
        if (err != null) {
          return console.log("error setting client " + err);
        } else {
          console.log("set client " + clientid);
          return window.open(config.dburl + "/_design/app/_show/client/" + clientid, '_self');
        }
      });
    });
  };

  module.exports.testApp = function(app) {
    console.log("Offline test with app " + app.id);
    return window.open(config.dburl + "/_design/app/_show/app/" + app.id, '_self');
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
}, "plugins/App": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/App');

  ThisThingList = require('models/AppList');

  ThisThingListView = require('views/ThingList');

  ThisThingInListView = require('views/AppInList');

  ThisThingView = require('views/Thing');

  ThisThingEditView = require('views/AppEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'app',
    title: 'App',
    description: 'A downloadable web-app'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/Booklet": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/Booklet');

  ThisThingList = require('models/BookletList');

  ThisThingListView = require('views/ThingList');

  ThisThingInListView = require('views/BookletInList');

  ThisThingView = null;

  ThisThingEditView = require('views/BookletEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'booklet',
    title: 'Booklet',
    description: 'A collection of related content for distribution as part of an app'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/File": function(exports, require, module) {(function() {
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
    title: 'File',
    description: 'A file to download/use, e.g. image, video, audio, PDF'
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
}, "plugins/List": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/List');

  ThisThingList = require('models/ListList');

  ThisThingListView = require('views/ThingList');

  ThisThingInListView = require('views/ThingInList');

  ThisThingView = require('views/Thing');

  ThisThingEditView = require('views/ListEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'list',
    title: 'List',
    description: 'A list of things'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/Place": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/Place');

  ThisThingList = require('models/PlaceList');

  ThisThingListView = require('views/ThingList');

  ThisThingInListView = require('views/ThingInList');

  ThisThingView = require('views/Thing');

  ThisThingEditView = require('views/PlaceEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'place',
    title: 'Place',
    description: 'A place or location, i.e. somewhere in the world'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/TaskConfig": function(exports, require, module) {(function() {
  var ThingBuilder, ThisThing, ThisThingEditView, ThisThingInListView, ThisThingList, ThisThingListView, ThisThingView, attributes, contentType, plugins;

  plugins = require('plugins');

  ThisThing = require('models/TaskConfig');

  ThisThingList = require('models/TaskConfigList');

  ThisThingListView = require('views/TaskConfigList');

  ThisThingInListView = require('views/TaskConfigInList');

  ThisThingView = require('views/Thing');

  ThisThingEditView = require('views/TaskConfigEdit');

  ThingBuilder = require('plugins/ThingBuilder');

  attributes = {
    id: 'taskconfig',
    title: 'Background Task',
    description: 'A background task on the server, e.g. exporting content'
  };

  contentType = ThingBuilder.createThingType(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView);

  plugins.registerContentType(contentType.id, contentType);

}).call(this);
}, "plugins/ThingBuilder": function(exports, require, module) {(function() {
  var ContentType, allthings, plugins;

  plugins = require('plugins');

  ContentType = require('models/ContentType');

  allthings = require('allthings');

  module.exports.createThingType = function(attributes, ThisThing, ThisThingList, ThisThingListView, ThisThingInListView, ThisThingView, ThisThingEditView) {
    var contentType, things;
    things = null;
    contentType = new ContentType(attributes);
    ThisThing.contentType = contentType;
    ThisThing.prototype.getContentType = function() {
      return contentType;
    };
    ThisThing.addingThings = {};
    contentType.getThingView = function(thing) {
      return new ThisThingInListView({
        model: thing
      });
    };
    things = new ThisThingList();
    contentType.init = function() {
      var addThing, ats, thing, _i, _len, _results;
      ats = allthings.get();
      addThing = function(thing, coll, options) {
        var tt;
        if (thing.attributes.type !== contentType.id) {
          return;
        }
        if (!things.get(thing.id)) {
          console.log("clone " + thing.id + " from allthings to " + contentType.id + " List");
          tt = new ThisThing(thing.attributes);
          things.add(tt);
          return setTimeout((function() {
            coll.remove(thing);
            return coll.add(tt);
          }), 0);
        }
      };
      ats.listenTo(ats, 'add', addThing);
      _results = [];
      for (_i = 0, _len = ats.length; _i < _len; _i++) {
        thing = ats[_i];
        _results.push(addThing(thing));
      }
      return _results;
    };
    contentType.createView = function() {
      var thingsView;
      console.log("create " + contentType.id + " view");
      thingsView = new ThisThingListView({
        model: things
      });
      thingsView.render();
      return thingsView;
    };
    contentType.createActionView = function(action, id) {
      var adding, thing;
      if (action === 'edit') {
        if (ThisThingEditView == null) {
          alert("Sorry, cannot " + action + " this kind of thing");
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
        if (id == null) {
          id = contentType.id + ':' + uuid();
        }
        if (ThisThing.addingThings != null) {
          adding = ThisThing.addingThings[id];
          if (adding != null) {
            adding._id = id;
            console.log("add using addingThing " + adding);
            thing = new ThisThing(adding);
          } else {
            thing = new ThisThing({
              _id: id
            });
          }
        }
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
}, "server": function(exports, require, module) {(function() {
  var templateErrorModal, workingCount;

  templateErrorModal = require('templates/ErrorModal');

  workingCount = 0;

  module.exports.working = function(msg) {
    workingCount++;
    console.log("server working (" + workingCount + ") " + msg + "...");
    return $('#workingModal').removeClass('hide');
  };

  module.exports.success = function() {
    workingCount = Math.max(0, workingCount - 1);
    console.log("server success (" + workingCount + ")");
    if (workingCount <= 0) {
      return $('#workingModal').addClass('hide');
    }
  };

  module.exports.error = function(model, resp, options) {
    var message;
    workingCount = Math.max(0, workingCount - 1);
    message = "" + resp;
    if (options != null ? options.textStatus : void 0) {
      message = "" + message + ", textState " + options.textStatus;
    }
    if (options != null ? options.errorThrown : void 0) {
      message = "" + message + ", errorThrown " + options.errorThrown;
    }
    console.log("server error  (" + workingCount + ") " + message);
    if (workingCount <= 0) {
      $('#workingModal').addClass('hide');
    }
    $('#errorModalHolder').html(templateErrorModal({
      message: message
    }));
    return $('#errorModalHolder').foundation('reveal', 'open');
  };

}).call(this);
}, "taskstates": function(exports, require, module) {(function() {
  var TaskStateList, server, singleton;

  TaskStateList = require('models/TaskStateList');

  server = require('server');

  singleton = null;

  module.exports.get = function() {
    if (singleton == null) {
      console.log("initialising TaskStateList for taskstates");
      singleton = new TaskStateList();
      server.working('taskstates');
      singleton.fetch({
        success: server.success,
        error: server.error
      });
    }
    return singleton;
  };

}).call(this);
}, "templates/AppEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n    <input type="button" value="Prepare for download" class="do-update"/>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/AppInList": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <a href="#" class="action-button do-delete-file right">Delete</a>\n  <a href="#" class="action-button do-edit-file right">Edit</a>\n  <!-- <a href="#" class="action-button do-view-file right">View</a> -->\n  <a href="#" class="action-button do-testapp right">Test Offline</a>\n  <a href="#" class="action-button do-export right">Export...</a>\n</h3>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/BookletEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n    <label>Content\n      <textarea name="htmlcontent">');
    
      __out.push(__sanitize(this.content));
    
      __out.push('</textarea>\n    </label>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/BookletInList": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <a href="#" class="action-button do-delete-file right">Delete</a>\n  <a href="#" class="action-button do-edit-file right">Edit</a>\n  <!-- <a href="#" class="action-button do-view-file right">View</a> -->\n  <a href="#" class="action-button do-testapp right">Test Offline</a>\n</h3>\n');
    
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
}}, "templates/ErrorModal": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <h2>Sorry, there was a problem contacting the server</h2>\n  <p>Consider reloading the page - the information you see may not be correct.</p>\n  ');
    
      if (this.message != null) {
        __out.push('\n    <div class="alert-box warning">');
        __out.push(__sanitize(this.message));
        __out.push('</div>\n  ');
      }
    
      __out.push('\n  <a class="close-reveal-modal">&#215;</a>\n');
    
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
      } else if (this.state === 'downloading') {
        __out.push('\nDownloading URL...\n');
      } else {
        __out.push('\n');
        __out.push(__sanitize(this.size));
        __out.push(' bytes, ');
        __out.push(__sanitize((this.type == null) || this.type === '' ? 'unknown mimetype' : this.type));
        __out.push('\n');
        if (this.state === 'loading') {
          __out.push('\nLoading...\n');
        } else if (this.state === 'unchanged') {
          __out.push('\n<a href="#-save" class="button tiny do-save">Download</a>\n');
        } else if (this.state === 'loaded') {
          __out.push('\n<a href="#-save" class="button tiny do-save">Download (new)</a>\n');
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
}}, "templates/FileEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n    <label>File (note: replacing a file is immediate - no undo!)\n      <input type="file" name="file"/>\n    </label>\n    <!-- often blocked by ajax! <label>URL (note: replacing a file is immediate - no undo!)\n      <input type="text" name="url" placeholder="URL" value=""/>\n      <input type="button" name="do-url" class="do-url" value="Load from URL"/> \n    </label> -->\n    <div class="drop-zone">Drop file here</div>\n    <div class="file-detail">No File<!-- TODO --></div>\n    <label>Image\n    </label>\n      <div class="image-editor hide row">\n        <div class="columns large-6 medium-8 small-12">\n          <img class="image-editor-image"/>\n        </div>\n        <div class="columns large-3 medium-4 small-12">\n          <input type="button" class="do-save-image" name="do-save-image" value="Save edited image"/><br/>\n          <input type="button" class="do-reset-image" name="do-reset-image" value="Reset image"/><br/>\n          <div class="row">\n            <div class="columns large-4 small-4"> \n              <label>Size:</label>\n            </div>\n            <div class="columns large-4 small-4"> \n              <input type="text" size=10 name="image-width" disabled value=""/>\n            </div>\n            <div class="columns large-4 small-4"> \n              <input type="text" size=10 name="image-height" disabled value=""/>          \n            </div>\n          </div>\n          <label>Aspect Ratio\n            <select name="image-aspect">\n              <option value="" selected>Any</option>\n              <option value="fixed" >Fixed</option>\n              <option value="1" >1:1</option>\n              <option value="1.333333" >4:3</option>\n              <option value="1.5" >3:2</option>\n              <option value="0.75" >3:4</option>\n              <option value="0.666666" >2:3</option>\n            </select>\n          <label>\n          <input type="button" class="do-crop-image" name="do-crop-image" value="Crop image"/><br/>\n          <input type="button" class="do-scale-image" name="do-scale-96" value="Scale to 96px"/>\n          <input type="button" class="do-scale-image" name="do-scale-240" value="Scale to 240px"/>\n          <input type="button" class="do-scale-image" name="do-scale-640" value="Scale to 640px"/>\n          <input type="button" class="do-scale-image" name="do-scale-1024" value="Scale to 1024px"/><br/>\n          <input type="button" class="do-rotate-image" name="do-rotate-left" value="Rotate left"/>\n          <input type="button" class="do-rotate-image" name="do-rotate-right" value="Rotate right"/><br/>\n          <input type="button" class="do-flip-image" name="do-flip-horizontal" value="Flip horizontal"/>\n          <input type="button" class="do-flip-image" name="do-flip-vertical" value="Flip vertical"/>\n        </div>\n        <div class="columns large-3 medium-12 small-12"><!-- rest --></div>\n      </div>\n\n');
    
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
}}, "templates/HtmlEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n    <label>Html\n      <textarea name="htmlfragment" >');
    
      __out.push(__sanitize(this.data.html));
    
      __out.push('</textarea>\n    </label>\n\n');
    
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
}}, "templates/ListEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n    <label>Specific Items\n      <div class="thingref-list-holder"></div>\n    </label>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/PlaceEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<div class="row">\n\n  <div class="columns large-6 small-12">\n\n    <label>Address\n      <input type="text" name="address" placeholder="address" value="');
    
      __out.push(__sanitize(this.data.address));
    
      __out.push('"/>\n      <a href="#" class="button small do-lookup-address">Lookup address</a><a href="#" class="button small do-clear-map disabled">Clear map</a>\n    </label>\n    <label>Lat/Lon\n      <input type="number" name="lat" placeholder="latitude" value="');
    
      __out.push(__sanitize(this.data.lat));
    
      __out.push('" min="-90" max="90" step="0.000001" />\n      <input type="number" name="lon" placeholder="longitude" value="');
    
      __out.push(__sanitize(this.data.lon));
    
      __out.push('" min="-180" max="180" step="0.000001" />\n      <input type="number" name="zoom" placeholder="zoom" value="');
    
      __out.push(__sanitize(this.data.zoom));
    
      __out.push('" min="0" max="19" step="1" />\n      <a href="#" class="button small do-show-latlon">Show on map</a>\n    </label>\n\n  </div>\n  <div class="columns large-6 small-12">\n    <label>Map\n      <a id="map"><div class="map" tabindex="0"></div></a> \n    </label>\n\n  </div>\n  <div class="columns large-4 medium-6 small-12">\n    <label>Map icon\n      <div>\n        <div class="image-select-icon">\n          <div class="dummy"></div>\n          <img class="image-select-image image-mapicon" src="');
    
      __out.push(__sanitize(this.data.mapiconurl));
    
      __out.push('"/>\n        </div>\n      </div>\n      <div>\n        <a href="#" class="button small do-select-mapicon">Browse server...</a> \n      </div>\n    </label>\n  </div>\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TaskConfigEdit": function(exports, require, module) {module.exports = function(__obj) {
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
      var appurl, file, tarfile, upload;
    
      __out.push('\n<div class="columns large-12">\n  <h2>');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Edit'));
    
      __out.push(' Background Task</h2>\n</div>\n<form>\n  <div class="columns large-12">\n');
    
      if (this.taskType === 'exportapp') {
        __out.push('\n    <h4>Publish app to webserver</h4>\n');
        __out.push('\n');
        appurl = "" + window.mediahubconfig.publicurl + "/" + this.path + "/_design/app/_show/app/" + this.subjectId + ".html";
        __out.push('\n');
        tarfile = "" + window.mediahubconfig.publicurl + "/" + this.path + ".tgz";
        __out.push('\n    <p>Will export app to <a target="_blank" href="');
        __out.push(__sanitize(appurl));
        __out.push('">');
        __out.push(__sanitize(appurl));
        __out.push('</a> (Tar file <a target="_blank" href="');
        __out.push(__sanitize(tarfile));
        __out.push('">');
        __out.push(__sanitize(tarfile));
        __out.push('</a>)</p>\n\n');
      } else if (this.taskType === 'tar') {
        __out.push('\n    <h4>Tar webserver directory</h4>\n');
        __out.push('\n');
        tarfile = "" + window.mediahubconfig.publicurl + "/" + this.path + ".tgz";
        __out.push('\n    <p>Will create tarfile <a target="_blank" href="');
        __out.push(__sanitize(tarfile));
        __out.push('">');
        __out.push(__sanitize(tarfile));
        __out.push('</a></p>\n\n');
      } else if (this.taskType === 'rm') {
        __out.push('\n    <h4>Delete webserver directory/file</h4>\n');
        __out.push('\n    <p>Will delete file/directory ');
        __out.push(__sanitize(this.path));
        __out.push('</p>\n\n');
      } else if (this.taskType === 'backup') {
        __out.push('\n    <h4>Backup main Couch database to webserver directory</h4>\n');
        __out.push('\n');
        file = "" + window.mediahubconfig.publicurl + "/" + this.path + "/mediahub.couch";
        __out.push('\n');
        tarfile = "" + window.mediahubconfig.publicurl + "/" + this.path + ".tgz";
        __out.push('\n    <p>Will create DB file <a target="_blank" href="');
        __out.push(__sanitize(file));
        __out.push('">');
        __out.push(__sanitize(file));
        __out.push('</a> (Tar file <a target="_blank" href="');
        __out.push(__sanitize(tarfile));
        __out.push('">');
        __out.push(__sanitize(tarfile));
        __out.push('</a>)</p>\n\n');
      } else if (this.taskType === 'checkpoint') {
        __out.push('\n    <h4>Update checkpoint of editable content in webserver directory</h4>\n');
        __out.push('\n');
        file = "" + window.mediahubconfig.publicurl + "/" + this.path + "/";
        __out.push('\n');
        tarfile = "" + window.mediahubconfig.publicurl + "/" + this.path + ".tgz";
        __out.push('\n    <p>Will update checkpoint in directory <a target="_blank" href="');
        __out.push(__sanitize(file));
        __out.push('">');
        __out.push(__sanitize(file));
        __out.push('</a> (Tar file <a target="_blank" href="');
        __out.push(__sanitize(tarfile));
        __out.push('">');
        __out.push(__sanitize(tarfile));
        __out.push('</a>)</a></p>\n\n');
      } else if (this.taskType === 'import') {
        __out.push('\n    <h4>Import checkpoint of editable content</h4>\n');
        __out.push('\n');
        upload = "" + window.mediahubconfig.uploadurl + "/" + (encodeURIComponent(this._id));
        __out.push('\n');
        file = "" + window.mediahubconfig.publicurl + "/" + this.path + "/";
        __out.push('\n');
        tarfile = "" + window.mediahubconfig.publicurl + "/" + this.path + ".tgz";
        __out.push('\n    <p>Will upload and import a checkpoint in directory <a target="_blank" href="');
        __out.push(__sanitize(file));
        __out.push('">');
        __out.push(__sanitize(file));
        __out.push('</a> (Tar file <a target="_blank" href="');
        __out.push(__sanitize(tarfile));
        __out.push('">');
        __out.push(__sanitize(tarfile));
        __out.push('</a>)</a></p>\n    <p>Use upload form <a target="_blank" href="');
        __out.push(__sanitize(upload));
        __out.push('">');
        __out.push(__sanitize(upload));
        __out.push('</a></p>\n\n');
      } else {
        __out.push('\n     <h4>');
        __out.push(__sanitize(this.taskType));
        __out.push('</h4>\n     <p>(Whatever that is)</p>\n');
      }
    
      __out.push('\n    ');
    
      if ((this.subjectId != null) && this.subjectId.length > 0) {
        __out.push('\n      <div class="subject-holder">');
        __out.push(this.subjectHtml != null ? this.subjectHtml : void 0);
        __out.push(__sanitize(this.subjectHtml == null ? "(" + this.subjectId + ")" : void 0));
        __out.push('</div>\n    ');
      }
    
      __out.push('\n    <p>');
    
      __out.push(__sanitize(this.lastChanged != null ? "Task was last updated/requested " + (new Date(this.lastChanged).toUTCString()) : "Task is new"));
    
      __out.push('</p>\n    <div class="state-holder">');
    
      __out.push(this.stateHtml != null ? this.stateHtml : void 0);
    
      __out.push('</div>\n    <label>Active\n      <input type="checkbox" name="enabled" value="enabled" ');
    
      __out.push(__sanitize(this.enabled ? 'checked' : ''));
    
      __out.push('/>\n    </label>\n    <input type="submit" value="');
    
      __out.push(__sanitize(this.add ? 'Create' : 'Update'));
    
      __out.push('"/>\n    <input type="reset" value="Clear"/>\n    <input type="button" value="Cancel" class="do-cancel"/>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TaskConfigEditState": function(exports, require, module) {module.exports = function(__obj) {
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
      if ((this.created == null) || this.created !== this.configCreated) {
        __out.push('\n  <!-- TaskState is for old config (');
        __out.push(__sanitize(this.configCreated));
        __out.push(' vs ');
        __out.push(__sanitize(this.created));
        __out.push(') --> \n');
      } else {
        __out.push('<h4>Task status:</h4>\n<div data-alert class="alert-box ');
        __out.push(__sanitize(this.state === 'done' ? ((this.lastChanged != null) && this.lastChanged > this.lastConfigChanged ? 'warning' : 'success') : this.state === 'disabled' ? 'secondary' : this.state === 'starting' ? 'info' : this.state === 'error' ? 'alert' : 'warning'));
        __out.push('">\n  ');
        __out.push(__sanitize(this.message));
        __out.push('<br/>\n  (Last update: ');
        __out.push(__sanitize(this.lastUpdate != null ? new Date(this.lastUpdate).toUTCString() : void 0));
        __out.push(')\n</div>\n<!-- <p>State: ');
        __out.push(__sanitize(this.state));
        __out.push('</p> -->\n<p>');
        __out.push(__sanitize(this.lastConfigChanged == null ? 'Not yet done' : (this.lastChanged != null) && this.lastChanged > this.lastConfigChanged ? 'Out of date; last done for request ' : 'Up to date with '));
        __out.push(__sanitize(this.lastConfigChanged != null ? new Date(this.lastConfigChanged).toUTCString() : void 0));
        __out.push('</p>\n');
      }
    
      __out.push('\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TaskConfigEditSubject": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('<p>Subject: ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</p>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TaskConfigInList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<h4 class="clearfix">\n  ');
    
      __out.push(__sanitize((this.path != null) && this.path.length > 0 ? "" + this.path + ": " : void 0));
    
      __out.push('\n  ');
    
      __out.push(__sanitize(this.taskType));
    
      __out.push('\n  ');
    
      __out.push(__sanitize(this.subject.title ? this.subject.title : this.subjectId));
    
      __out.push('\n  <a href="#" class="action-button do-delete-file right">Delete</a>\n  <a href="#" class="action-button do-edit-file right">Edit</a>\n  <!--<a href="#" class="action-button do-view right">View</a>-->\n</h4>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TaskConfigList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n  <div class="columns large-12 small-12">\n    <h2>Background Task List</h2>\n    <!-- <a href="#" class="button do-add-task-tar">Tar...</a> -->\n    <a href="#" class="button do-add-task-backup">Backup...</a>\n    <a href="#" class="button do-add-task-checkpoint">Checkpoint...</a>\n    <a href="#" class="button do-add-task-import">Import...</a>\n  </div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TaskConfigPathModal": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <h2>Please specify the web server sub-directory</h2>\n  <form>\n    <input name="path" type="text" size="30" placeholder="directory name/path"/>\n    <input type="submit" value="OK"/>\n  </form>\n  <a class="close-reveal-modal">&#215;</a>\n');
    
      __out.push('\n\n');
    
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
      var i, tab, _i, _j, _len, _len1, _ref, _ref1;
    
      __out.push('\n<div class="columns large-12">\n  <h2>');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Edit'));
    
      __out.push(' ');
    
      __out.push(__sanitize(this.contentType.title));
    
      __out.push('</h2>\n</div>\n<form>\n  <div class="columns large-12">\n    <input type="submit" value="');
    
      __out.push(__sanitize(this.add ? 'Add' : 'Save changes'));
    
      __out.push('"/>\n    <input type="reset" value="Clear"/>\n    <input type="button" value="Cancel" class="do-cancel"/>\n  </div>\n  <div class="columns large-12">\n    <ul class="tabs" data-tab>\n      ');
    
      _ref = this.tabs;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        tab = _ref[i];
        __out.push('\n        <li class="tab-title ');
        __out.push(__sanitize(i === 0 ? 'active' : void 0));
        __out.push('"><a href="#');
        __out.push(__sanitize(i));
        __out.push('">');
        __out.push(__sanitize(tab.title));
        __out.push('</a></li>\n      ');
      }
    
      __out.push('\n    </ul>\n    <div class="tabs-content">\n      ');
    
      _ref1 = this.tabs;
      for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
        tab = _ref1[i];
        __out.push('\n        <div class="content ');
        __out.push(__sanitize(i === 0 ? 'active' : void 0));
        __out.push(' thing-tab-');
        __out.push(__sanitize(i));
        __out.push('">');
        __out.push(tab.template(this));
        __out.push('</div>\n      ');
      }
    
      __out.push('      \n    </div>\n  </div>\n</form>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingEditTab": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<label>Title\n  <input type="text" name="title" placeholder="title" value="');
    
      __out.push(__sanitize(this.data.title));
    
      __out.push('"/>\n</label>\n<label>Description\n  <textarea name="description" placeholder="description" >');
    
      __out.push(__sanitize(this.data.description));
    
      __out.push('</textarea>\n</label>\n<div class="row">\n  <div class="columns large-4 medium-6 small-12">\n    <label>Image\n      <div>\n        <div class="image-select-icon">\n          <div class="dummy"></div>\n          <img class="image-select-image image-image" src="');
    
      __out.push(__sanitize(this.data.imageurl));
    
      __out.push('"/>\n        </div>\n      </div>\n      <div>\n        <a href="#" class="button small do-select-image">Browse server...</a> \n      </div>\n    </label>\n  </div>\n  <div class="columns large-4 medium-6 small-12">    \n    <label>Icon\n      <div>\n        <div class="image-select-icon">\n          <div class="dummy"></div>\n          <img class="image-select-image image-icon" src="');
    
      __out.push(__sanitize(this.data.iconurl));
    
      __out.push('"/>\n        </div>\n      </div>\n      <div>\n        <a href="#" class="button do-select-icon">Browse server...</a> \n      </div>\n    </label>\n  </div>\n</div>\n\n');
    
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
    
      __out.push('\n  <a href="#-delete-file" class="action-button do-delete-file right">Delete</a>\n  <a href="#-edit-file" class="action-button do-edit-file right">Edit</a>\n  <a href="#-view-file" class="action-button do-view-file right">View</a>\n</h4>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingInMultiselect": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<h4 class="clearfix"><input type="checkbox" name="');
    
      __out.push(__sanitize(this._id));
    
      __out.push('"/> ');
    
      __out.push(__sanitize(this.typeName));
    
      __out.push(': ');
    
      __out.push(__sanitize(this.title));
    
      __out.push('\n  <a href="#" class="action-button do-preview-thing right">Preview</a>\n</h4>\n');
    
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
}}, "templates/ThingMultiselectModal": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push('\n  <h2>Select items to add</h2>\n  <div>\n    <a class="button do-ok disabled">OK</a><!--\n    --><a class="button do-close">Cancel</a>\n  </div>\n\n  <div class="thing-list row"></div>\n\n  <a class="close-reveal-modal">&#215;</a>\n');
    
      __out.push('\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingRefInList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<h4 class="clearfix">\n  <input type="checkbox" name="');
    
      __out.push(__sanitize(this._id));
    
      __out.push('"/>\n  <a href="#" class="button tiny do-add-below">Add below...</a><!--\n    --><a href="#" class="button tiny do-move-below disabled">Move below</a><!--\n    --><a href="#" class="button tiny do-remove-thingref">Remove</a>\n  ');
    
      __out.push(__sanitize(this.typeName));
    
      __out.push(': ');
    
      __out.push(__sanitize((this.thing != null) && (this.thing.attributes.title != null) ? this.thing.attributes.title : this.thingId));
    
      __out.push('\n  <a href="#" class="action-button do-preview-thing right ');
    
      __out.push(__sanitize(this.thing == null ? 'disabled' : void 0));
    
      __out.push('">Preview</a>\n</h4>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/ThingRefList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n  <div class="columns large-12 small-12">\n    <a href="#" class="button tiny do-add-below">Add below...</a><!--\n    --><a href="#" class="button tiny do-move-below disabled">Move below</a><!--\n    --><a href="#" class="button tiny do-select-all">Select all</a><!--\n    --><a href="#" class="button tiny do-select-none">Select none</a><!--\n    --><a href="#" class="button tiny do-remove-thingrefs disabled">Remove selected</a>\n  </div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "thingDeleter": function(exports, require, module) {(function() {
  var currentModel, server, templateFileDeleteModal;

  templateFileDeleteModal = require('templates/ThingDeleteModal');

  server = require('server');

  currentModel = null;

  $('#deleteModalHolder').on('closed', '[data-reveal]', function() {
    console.log("deleteModalHolder closed");
    return currentModel = null;
  });

  $('#deleteModalHolder').on('click', '.do-delete', function(ev) {
    console.log("do-delete " + currentModel.id);
    if (currentModel != null) {
      server.working('destroy (delete)');
      if (false === currentModel.destroy({
        success: server.success,
        error: server.error
      })) {
        console.log("destroy (delete) " + currentModel.id + " returned false");
        server.success(currentModel, null, {});
      }
      currentModel = null;
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
}, "views/AppEdit": function(exports, require, module) {(function() {
  var AppEditView, ListEditView, allthings, config, defaultZoom, lat2tile, lon2tile, maxZoom, maxZoomIn, maxZoomOut, templateAppEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ListEditView = require('views/ListEdit');

  templateAppEditTab = require('templates/AppEditTab');

  allthings = require('allthings');

  config = window.mediahubconfig;

  maxZoom = 19;

  defaultZoom = 16;

  maxZoomIn = 2;

  maxZoomOut = 5;

  lon2tile = function(lon, zoom) {
    return (lon + 180) / 360 * Math.pow(2, zoom);
  };

  lat2tile = function(lat, zoom) {
    return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
  };

  module.exports = AppEditView = (function(_super) {
    __extends(AppEditView, _super);

    function AppEditView() {
      this.checkThings = __bind(this.checkThings, this);
      this.addFile = __bind(this.addFile, this);
      this.update = __bind(this.update, this);
      this.formToModel = __bind(this.formToModel, this);
      return AppEditView.__super__.constructor.apply(this, arguments);
    }

    AppEditView.prototype.tabs = function() {
      return AppEditView.__super__.tabs.call(this).concat([
        {
          title: 'App',
          template: templateAppEditTab
        }
      ]);
    };

    AppEditView.prototype.formToModel = function() {
      return AppEditView.__super__.formToModel.call(this);
    };

    AppEditView.prototype.events = function() {
      return _.extend({}, AppEditView.__super__.events.call(this), {
        "click .do-update": "update"
      });
    };

    AppEditView.prototype.update = function(ev) {
      var files, item, items, thingIds;
      ev.preventDefault();
      console.log("Update app for download...");
      this.formToModel();
      items = {};
      item = {
        type: this.model.attributes.type,
        id: this.model.id,
        url: config.dburl + "/" + encodeURIComponent(this.model.id)
      };
      items[item.url] = item;
      files = {};
      thingIds = this.model.attributes.thingIds;
      return this.checkThings(thingIds, items, files);
    };

    AppEditView.prototype.addUrl = function(files, url, title) {
      var file;
      if ((url != null) && url !== '') {
        file = {
          url: url,
          title: title
        };
        return files[file.url] = file;
      }
    };

    AppEditView.prototype.addHtml = function(files, html) {
      var file, m, src, srcs, _results;
      if (html != null) {
        srcs = /<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/g;
        _results = [];
        while (m = srcs.exec(html)) {
          src = m[1];
          if (src.length > 0) {
            src = src.replace(/[&]amp[;]/g, '&');
            file = {
              url: src,
              title: 'img'
            };
            _results.push(files[file.url] = file);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    AppEditView.prototype.addFile = function(files, thing) {
      var file;
      if (thing.attributes.fileType != null) {
        file = {
          url: config.dburl + "/" + thing.id + "/bytes",
          type: thing.get('fileType'),
          title: thing.get('title')
        };
        return files[file.url] = file;
      }
    };

    AppEditView.prototype.checkThings = function(thingIds, items, files) {
      var file, item, thing, thingId, url;
      while (thingIds.length > 0) {
        thingId = (thingIds.splice(0, 1))[0];
        console.log("update for thing " + thingId + "...");
        thing = allthings.get().get(thingId);
        if (thing == null) {
          console.log("- could not find " + thingId);
        } else {
          item = {
            type: thing.attributes.type,
            id: thing.id,
            url: config.dburl + "/" + encodeURIComponent(thingId)
          };
          items[item.url] = item;
          console.log("thing: " + (JSON.stringify(thing.attributes)));
          this.addUrl(files, thing.attributes.coverurl, 'cover');
          this.addUrl(files, thing.attributes.iconurl, 'icon');
          this.addUrl(files, thing.attributes.mapiconurl, 'mapicon');
          this.addUrl(files, thing.attributes.imageurl, 'image');
          this.addHtml(files, thing.attributes.content);
          this.addHtml(files, thing.attributes.html);
          this.addHtml(files, thing.attributes.description);
          if (thing.attributes.type === 'place' && (thing.attributes.lat != null) && (thing.attributes.lon != null)) {
            this.addPlace(files, thing.attributes.lat, thing.attributes.lon, thing.attributes.zoom);
          }
          if (thing.attributes.thingIds != null) {
            this.checkThings(thing.attributes.thingIds, items, files);
          }
          if (thing.attributes.type === 'file') {
            this.addFile(files, thing);
          }
        }
      }
      items = (function() {
        var _results;
        _results = [];
        for (url in items) {
          item = items[url];
          _results.push(item);
        }
        return _results;
      })();
      files = (function() {
        var _results;
        _results = [];
        for (url in files) {
          file = files[url];
          _results.push(file);
        }
        return _results;
      })();
      console.log("Checked all things, found " + items.length + " items and " + files.length + " files");
      return this.model.set({
        items: items,
        files: files
      });
    };

    AppEditView.prototype.addPlace = function(files, lat, lon, zoom) {
      var file, latTile0, lonTile0, mapUrl, minZoom, mzoom, s, subdomains, tileRange, url, x, x1, x2, xmax, y, y1, y2, z, _i, _results;
      console.log("add place " + lat + "," + lon + "," + zoom);
      if (zoom == null) {
        zoom = defaultZoom;
      }
      if (zoom > maxZoom) {
        zoom = maxZoom;
      }
      mapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
      subdomains = ['a', 'b', 'c'];
      latTile0 = lat2tile(lat, 0);
      lonTile0 = lon2tile(lon, 0);
      console.log("-> " + latTile0 + "," + lonTile0);
      mzoom = zoom + maxZoomIn;
      minZoom = zoom - maxZoomOut;
      if (mzoom > maxZoom) {
        mzoom = maxZoom;
      }
      tileRange = 0.5 * 400 / 256;
      xmax = 1;
      _results = [];
      for (z = _i = 0; 0 <= mzoom ? _i <= mzoom : _i >= mzoom; z = 0 <= mzoom ? ++_i : --_i) {
        y1 = Math.max(0, Math.floor(latTile0 - tileRange));
        y2 = Math.min(xmax - 1, Math.floor(latTile0 + tileRange));
        x1 = Math.max(0, Math.floor(lonTile0 - tileRange));
        x2 = Math.min(xmax - 1, Math.floor(lonTile0 + tileRange));
        xmax = xmax * 2;
        latTile0 = latTile0 * 2;
        lonTile0 = lonTile0 * 2;
        console.log("tiles zoom " + z + " (0-" + (xmax - 1) + ") " + x1 + ":" + x2 + ", " + y1 + ":" + y2);
        if (z >= minZoom) {
          _results.push((function() {
            var _j, _results1;
            _results1 = [];
            for (x = _j = x1; x1 <= x2 ? _j <= x2 : _j >= x2; x = x1 <= x2 ? ++_j : --_j) {
              _results1.push((function() {
                var _k, _results2;
                _results2 = [];
                for (y = _k = y1; y1 <= y2 ? _k <= y2 : _k >= y2; y = y1 <= y2 ? ++_k : --_k) {
                  s = subdomains[Math.abs(x + y) % subdomains.length];
                  url = mapUrl.replace('{s}', s).replace('{z}', z).replace('{x}', x).replace('{y}', y);
                  file = {
                    url: url,
                    title: 'map tile'
                  };
                  _results2.push(files[file.url] = file);
                }
                return _results2;
              })());
            }
            return _results1;
          })());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return AppEditView;

  })(ListEditView);

}).call(this);
}, "views/AppInList": function(exports, require, module) {(function() {
  var AppInListView, TaskConfig, ThingInListView, addTaskConfig, offline, templateAppInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateAppInList = require('templates/AppInList');

  ThingInListView = require('views/ThingInList');

  TaskConfig = require('models/TaskConfig');

  addTaskConfig = require('addTaskConfig');

  offline = require('offline');

  module.exports = AppInListView = (function(_super) {
    __extends(AppInListView, _super);

    function AppInListView() {
      this["export"] = __bind(this["export"], this);
      this.testapp = __bind(this.testapp, this);
      this.template = __bind(this.template, this);
      return AppInListView.__super__.constructor.apply(this, arguments);
    }

    AppInListView.prototype.template = function(d) {
      return templateAppInList(d);
    };

    AppInListView.prototype.events = {
      "click .do-edit-file": "edit",
      "click .do-delete-file": "delete",
      "click .do-save": "save",
      "click .do-testapp": "testapp",
      "click .do-export": "export"
    };

    AppInListView.prototype.testapp = function(ev) {
      ev.preventDefault();
      return offline.testApp(this.model);
    };

    AppInListView.prototype["export"] = function(ev) {
      var id, ix, model;
      ev.preventDefault();
      console.log("Export app " + this.model.id);
      id = this.model.id;
      ix = id.indexOf(':');
      if (ix >= 0) {
        id = id.substring(ix + 1);
      }
      id = 'taskconfig:' + id;
      model = {
        _id: id,
        subjectId: this.model.id,
        taskType: 'exportapp',
        enabled: true
      };
      return addTaskConfig.add(model);
    };

    return AppInListView;

  })(ThingInListView);

}).call(this);
}, "views/BookletEdit": function(exports, require, module) {(function() {
  var BookletEditView, ThingEditView, templateBookletEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateBookletEditTab = require('templates/BookletEditTab');

  ThingEditView = require('views/ThingEdit');

  module.exports = BookletEditView = (function(_super) {
    __extends(BookletEditView, _super);

    function BookletEditView() {
      this.remove = __bind(this.remove, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return BookletEditView.__super__.constructor.apply(this, arguments);
    }

    BookletEditView.prototype.tabs = function() {
      return BookletEditView.__super__.tabs.call(this).concat([
        {
          title: 'Booklet',
          template: templateBookletEditTab
        }
      ]);
    };

    BookletEditView.prototype.contentToHtml = function(content) {
      if (content != null) {
        return content;
      } else {
        return '';
      }
    };

    BookletEditView.prototype.htmlToContent = function(html) {
      return html;
    };

    BookletEditView.prototype.template = function(d) {
      return BookletEditView.__super__.template.call(this, _.extend({
        content: this.contentToHtml(this.model.attributes.content)
      }, d));
    };

    BookletEditView.prototype.render = function() {
      var replace;
      BookletEditView.__super__.render.call(this);
      replace = function() {
        var ckconfig;
        console.log("Set up CKEditor 'htmlcontent'...");
        ckconfig = {};
        ckconfig.customConfig = '../../ckeditor_config_booklet.js';
        ckconfig.filebrowserBrowseUrl = 'filebrowse.html';
        ckconfig.filebrowserImageBrowseUrl = 'filebrowse.html?type=image%2F';
        return CKEDITOR.replace('htmlcontent', ckconfig);
      };
      return setTimeout(replace, 0);
    };

    BookletEditView.prototype.formToModel = function() {
      var html;
      html = $(':input[name="htmlcontent"]', this.$el).val();
      console.log("contenthtml = " + html);
      this.model.set('content', this.htmlToContent(html));
      return BookletEditView.__super__.formToModel.call(this);
    };

    BookletEditView.prototype.remove = function() {
      var editor;
      editor = CKEDITOR.instances['htmlcontent'];
      if (editor) {
        console.log("destroy ckeditor 'htmlcontent'");
        editor.destroy(true);
      }
      return BookletEditView.__super__.remove.call(this);
    };

    return BookletEditView;

  })(ThingEditView);

}).call(this);
}, "views/BookletInList": function(exports, require, module) {(function() {
  var BookletInListView, ThingInListView, offline, templateBookletInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateBookletInList = require('templates/BookletInList');

  ThingInListView = require('views/ThingInList');

  offline = require('offline');

  module.exports = BookletInListView = (function(_super) {
    __extends(BookletInListView, _super);

    function BookletInListView() {
      this.testapp = __bind(this.testapp, this);
      this.template = __bind(this.template, this);
      return BookletInListView.__super__.constructor.apply(this, arguments);
    }

    BookletInListView.prototype.template = function(d) {
      return templateBookletInList(d);
    };

    BookletInListView.prototype.events = {
      "click .do-edit-file": "edit",
      "click .do-delete-file": "delete",
      "click .do-save": "save",
      "click .do-testapp": "testapp"
    };

    BookletInListView.prototype.testapp = function(ev) {
      ev.preventDefault();
      return offline.testBooklet(this.model);
    };

    return BookletInListView;

  })(ThingInListView);

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
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ContentTypeListView.__super__.constructor.apply(this, arguments);
    }

    ContentTypeListView.prototype.tagName = 'div';

    ContentTypeListView.prototype.className = 'row content-type-list top-level-view';

    ContentTypeListView.prototype.initialize = function() {
      this.views = [];
      this.listenTo(this.model, 'add', this.addItem);
      return this.listenTo(this.model, 'remove', this.removeItem);
    };

    ContentTypeListView.prototype.template = function(d) {
      return templateContentTypeList(d);
    };

    ContentTypeListView.prototype.render = function() {
      console.log("render ContentTypeList with template");
      this.$el.html(this.template(this.model.attributes));
      this.model.forEach(this.addItem);
      return this;
    };

    ContentTypeListView.prototype.addItem = function(item) {
      var view;
      console.log("ContentTypeListView add " + item.id);
      view = new ContentTypeInListView({
        model: item
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    ContentTypeListView.prototype.removeItem = function(item) {
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
  var FileEditView, ThingEditView, allthings, server, templateFileDetail, templateFileEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateFileEditTab = require('templates/FileEditTab');

  templateFileDetail = require('templates/FileDetail');

  ThingEditView = require('views/ThingEdit');

  server = require('server');

  allthings = require('allthings');

  module.exports = FileEditView = (function(_super) {
    __extends(FileEditView, _super);

    function FileEditView() {
      this.imageAspect = __bind(this.imageAspect, this);
      this.imageRotate = __bind(this.imageRotate, this);
      this.imageScale = __bind(this.imageScale, this);
      this.imageFlip = __bind(this.imageFlip, this);
      this.imageTransform = __bind(this.imageTransform, this);
      this.imageCrop = __bind(this.imageCrop, this);
      this.imageReset = __bind(this.imageReset, this);
      this.imageSave = __bind(this.imageSave, this);
      this.imageEdit = __bind(this.imageEdit, this);
      this.nocrop = __bind(this.nocrop, this);
      this.crop = __bind(this.crop, this);
      this.removeJcrop = __bind(this.removeJcrop, this);
      this.doUrl = __bind(this.doUrl, this);
      this.save = __bind(this.save, this);
      this.renderFileDetails = __bind(this.renderFileDetails, this);
      this.loadBlob = __bind(this.loadBlob, this);
      this.listFiles = __bind(this.listFiles, this);
      this.handleFileSelect = __bind(this.handleFileSelect, this);
      this.handleDrop = __bind(this.handleDrop, this);
      this.close = __bind(this.close, this);
      this.remove = __bind(this.remove, this);
      this.cancel = __bind(this.cancel, this);
      this.formToModel = __bind(this.formToModel, this);
      this.click = __bind(this.click, this);
      this.render = __bind(this.render, this);
      return FileEditView.__super__.constructor.apply(this, arguments);
    }

    FileEditView.prototype.initialize = function() {
      FileEditView.__super__.initialize.call(this);
      this.fileState = 'unchanged';
      this.cancelled = false;
      return this.created = false;
    };

    FileEditView.prototype.tabs = function() {
      return FileEditView.__super__.tabs.call(this).concat([
        {
          title: 'File',
          template: templateFileEditTab
        }
      ]);
    };

    FileEditView.prototype.render = function() {
      console.log("render FileEdit " + this.model.attributes._id + ": " + this.model.attributes.title);
      FileEditView.__super__.render.call(this);
      this.renderFileDetails();
      return this;
    };

    FileEditView.prototype.events = function() {
      return _.extend({}, FileEditView.__super__.events.call(this), {
        "click .do-url": "doUrl",
        "click .do-save-image": "imageSave",
        "click .do-reset-image": "imageReset",
        "click .do-crop-image": "imageCrop",
        "click .do-scale-image": "imageScale",
        "click .do-flip-image": "imageFlip",
        "click .do-rotate-image": "imageRotate",
        "dragover .drop-zone": "handleDragOver",
        "drop .drop-zone": "handleDrop",
        "dragenter .drop-zone": "handleDragEnter",
        "dragleave .drop-zone": "handleDragLeave",
        "dragend .drop-zone": "handleDragLeave",
        'change input[name="file"]': "handleFileSelect",
        "click .do-save": "save",
        "click": "click",
        "change select[name=image-aspect]": "imageAspect"
      });
    };

    FileEditView.prototype.click = function(ev) {
      return console.log("click " + ev.target + " classes " + ($(ev.target).attr('class')));
    };

    FileEditView.prototype.formToModel = function() {
      var atts;
      FileEditView.__super__.formToModel.call(this);
      atts = this.model.attachments();
      return this.model.set('hasFile', atts.indexOf("bytes") >= 0);
    };

    FileEditView.prototype.cancel = function() {
      if (this.created && (this.model.id != null)) {
        console.log("try destroy on cancel for " + this.model.id);
        server.working('destroy (cancel)');
        if (false === this.model.destroy({
          success: server.success,
          error: server.error
        })) {
          console.log("destroy (cancel) " + this.model.id + " returned false");
          server.success(this.model, null, {});
        }
      }
      return FileEditView.__super__.cancel.call(this);
    };

    FileEditView.prototype.remove = function() {
      this.removeJcrop();
      return FileEditView.__super__.remove.call(this);
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
        blob = file.slice(0, file.size, file.type);
        if ((file.name != null) && $('input[name="title"]', this.$el).val() === '') {
          $('input[name="title"]', this.$el).val(file.name);
        }
        return this.loadBlob(blob, file);
      }
    };

    FileEditView.prototype.loadBlob = function(blob, file) {
      this.newblob = blob;
      this.fileState = 'loading';
      if (this.add) {
        this.created = true;
      }
      $('input[type=submit]', this.$el).prop('disabled', true);
      server.working('attach');
      this.model.attach(blob, "bytes", blob.type, (function(_this) {
        return function(err, result) {
          if (err != null) {
            server.error(_this.model, err, {});
          } else {
            server.success(_this.model, result, {});
          }
          $('input[type=submit]', _this.$el).prop('disabled', false);
          if (_this.cancelled) {
            console.log("attach on cancelled " + _this.model.id);
            server.working('destroy (loadBlob cancelled)');
            if (false === _this.model.destroy({
              success: server.success,
              error: server.error
            })) {
              console.log("destroy (loadBlob cancelled) " + _this.model.id + " returned false");
              server.success(_this.model, null, {});
            }
            return;
          }
          if (err != null) {
            console.log("Error attaching blob " + blob.name + ": " + err);
            _this.fileState = 'error';
            return _this.renderFileDetails();
          } else {
            console.log("Attached blob to " + _this.model.id + ": " + (JSON.stringify(result)));
            _this.fileState = 'loaded';
            _this.model.set('hasFile', true);
            _this.model.set('fileSize', blob.size);
            _this.model.set('fileType', blob.type);
            if ((file != null) && (file.lastModified != null)) {
              _this.model.set('fileLastModified', file.lastModified);
            } else {
              _this.model.unset('fileLastModified');
            }
            server.working('save File (loadBlob)');
            if (false === _this.model.save(null, {
              success: function(model, resp, options) {
                console.log("save File (loadBlob) ok: " + (JSON.stringify(resp)));
                return server.success(model, resp, options);
              },
              error: server.error
            })) {
              server.error(_this.model, 'Save validation error (File, loadBlob)');
            }
            return _this.renderFileDetails();
          }
        };
      })(this));
      return this.renderFileDetails();
    };

    FileEditView.prototype.renderFileDetails = function() {
      var data, hasBytes, imageOk, type;
      console.log("renderFileDetails, " + this.fileState + " _rev=" + (this.model.get('_rev')));
      hasBytes = (this.model.get('hasFile')) || false;
      imageOk = false;
      if (!hasBytes && this.fileState === 'unchanged') {
        data = {
          'state': 'nofile'
        };
      } else if (this.fileState === 'loading') {
        data = {
          'state': this.fileState,
          'type': this.newblob.type,
          'size': this.newblob.size
        };
      } else {
        type = this.model.get('fileType');
        data = {
          'state': this.fileState,
          'type': this.model.get('fileType'),
          'size': this.model.get('fileSize')
        };
        if ((type != null) && type.indexOf('image/') === 0) {
          console.log("imageOk");
          imageOk = true;
          setTimeout(this.imageEdit, 0);
        }
      }
      if (!imageOk) {
        $('.do-edit-image', this.$el).prop('disabled', true);
        $('.image-editor', this.$el).addClass('hide');
      }
      return $('.file-detail', this.$el).html(templateFileDetail(data));
    };

    FileEditView.prototype.save = function(ev) {
      return this.model.download(ev);
    };

    FileEditView.prototype.doUrl = function(ev) {
      var url;
      ev.preventDefault();
      url = $('input[name="url"]', this.$el).val();
      console.log("doUrl " + url);
      this.fileState = 'downloading';
      this.renderFileDetails();
      $('input[type=submit]', this.$el).prop('disabled', true);
      $('input[name=do-url]', this.$el).prop('disabled', true);
      return $.ajax(url, {
        method: 'GET',
        processData: false,
        crossDomain: true,
        error: (function(_this) {
          return function(xhr, status, error) {
            console.log("Error getting " + url + ": " + status + " (" + error + ")");
            _this.fileState = 'error';
            alert("Error getting " + url + ": " + status + " (" + error + ")");
            _this.renderFileDetails();
            $('input[type=submit]', _this.$el).prop('disabled', false);
            return $('input[name=do-url]', _this.$el).prop('disabled', false);
          };
        })(this),
        success: (function(_this) {
          return function(data, status, xhr) {
            console.log("Got " + url + " as " + (typeof data) + " length " + data.length + " (" + status + ")");
            _this.fileState = 'loading';
            _this.renderFileDetails();
            $('input[type=submit]', _this.$el).prop('disabled', false);
            return $('input[name=do-url]', _this.$el).prop('disabled', false);
          };
        })(this)
      });
    };

    FileEditView.prototype.removeJcrop = function() {
      var err;
      console.log("remove jcrop " + this.jcrop);
      if (this.jcrop) {
        try {
          this.jcrop.destroy();
        } catch (_error) {
          err = _error;
          console.log("error destroying jcrop: " + err.message);
        }
        return this.jcrop = null;
      }
    };

    FileEditView.prototype.crop = function(c) {
      console.log("crop " + c.x + "," + c.y + " " + c.x2 + "," + c.y2 + "; image " + this.img.width + "x" + this.img.height);
      this.cropCoords = {
        x: Math.floor(c.x),
        y: Math.floor(c.y),
        x2: Math.floor(c.x2),
        y2: Math.floor(c.y2)
      };
      $('input[name=image-width]', this.$el).val("" + (this.cropCoords.x2 - this.cropCoords.x + 1));
      $('input[name=image-height]', this.$el).val("" + (this.cropCoords.y2 - this.cropCoords.y + 1));
      return $('input[name=do-crop-image]', this.$el).prop('disabled', false);
    };

    FileEditView.prototype.nocrop = function() {
      console.log("nocrop");
      if (this.trueSize != null) {
        $('input[name=image-width]', this.$el).val("" + this.trueSize[0]);
        $('input[name=image-height]', this.$el).val("" + this.trueSize[1]);
      }
      this.cropCoords = null;
      return $('input[name=do-crop-image]', this.$el).prop('disabled', true);
    };

    FileEditView.prototype.imageEdit = function(ev, url) {
      var fileurl, oldImage, self;
      console.log("imageEdit");
      if (ev != null) {
        ev.preventDefault();
      }
      this.removeJcrop();
      this.cropCoords = null;
      oldImage = this.img != null ? this.img : $('.image-editor-image', this.$el).get(0);
      fileurl = "../../../../" + (encodeURIComponent(this.model.id)) + "/bytes";
      this.img = new Image();
      self = this;
      this.img.onload = (function(_this) {
        return function() {
          var init;
          console.log("Image real size " + _this.img.width + "x" + _this.img.height);
          _this.trueSize = [_this.img.width, _this.img.height];
          $('input[name=image-width]', _this.$el).val("" + _this.trueSize[0]);
          $('input[name=image-height]', _this.$el).val("" + _this.trueSize[1]);
          $(oldImage).replaceWith(_this.img);
          init = function() {
            console.log("init jcrop");
            return $(_this.img).Jcrop({
              boxWidth: 600,
              boxHeight: 600,
              trueSize: _this.trueSize,
              onSelect: function(c) {
                return self.crop(c);
              },
              onRelease: function() {
                return self.nocrop();
              }
            }, function() {
              self.jcrop = this;
              return console.log("set @jcrop " + this);
            });
          };
          return setTimeout(init, 0);
        };
      })(this);
      if (url == null) {
        this.img.src = fileurl;
        $('input[name=do-save-image]', this.$el).prop('disabled', true);
        $('input[name=do-reset-image]', this.$el).prop('disabled', true);
      } else {
        this.img.src = url;
        $('input[name=do-save-image]', this.$el).prop('disabled', false);
        $('input[name=do-reset-image]', this.$el).prop('disabled', false);
      }
      $('input[name=do-crop-image]', this.$el).prop('disabled', true);
      return $('.image-editor', this.$el).removeClass('hide');
    };

    FileEditView.prototype.dataURItoBlob = function(dataURI) {
      var byteString, content, err, i, mimestring, _i, _ref;
      try {
        if (dataURI.split(',')[0].indexOf('base64') !== -1) {
          byteString = atob(dataURI.split(',')[1]);
        } else {
          byteString = decodeURI(dataURI.split(',')[1]);
        }
        mimestring = dataURI.split(',')[0].split(':')[1].split(';')[0];
        content = new Array();
        for (i = _i = 0, _ref = byteString.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          content[i] = byteString.charCodeAt(i);
        }
        return new Blob([new Uint8Array(content)], {
          type: mimestring
        });
      } catch (_error) {
        err = _error;
        console.log("Error doing dataURItoBlob: " + err.message + " " + err.stack);
        return null;
      }
    };

    FileEditView.prototype.imageSave = function(ev) {
      var blob, data, err;
      console.log("image save");
      ev.preventDefault();
      if (this.img != null) {
        data = this.img.src;
        if ((data.indexOf('data:')) === 0) {
          try {
            blob = this.dataURItoBlob(data);
            if (blob == null) {
              console.log("Could not get blob");
              return;
            }
            this.loadBlob(blob);
            return console.log("initiated load blob");
          } catch (_error) {
            err = _error;
            return console.log("error saving edited image: " + err.message + " " + err.stack);
          }
        } else {
          return console.log("image src is not data url: " + data);
        }
      } else {
        return console.log("img element not found");
      }
    };

    FileEditView.prototype.imageReset = function(ev) {
      ev.preventDefault();
      console.log("imageReset");
      return this.imageEdit();
    };

    FileEditView.prototype.imageCrop = function(ev) {
      var canvas, context, data, err, h, type, w;
      ev.preventDefault();
      if ((this.img != null) && (this.cropCoords != null)) {
        console.log("Crop " + (JSON.stringify(this.cropCoords)));
        type = this.model.get('fileType');
        if (type == null) {
          console.log("Using default image type");
          type = "image/png";
        }
        try {
          canvas = document.createElement("canvas");
          w = this.cropCoords.x2 - this.cropCoords.x + 1;
          h = this.cropCoords.y2 - this.cropCoords.y + 1;
          canvas.width = w;
          canvas.height = h;
          context = canvas.getContext("2d");
          context.drawImage(this.img, this.cropCoords.x, this.cropCoords.y, w, h, 0, 0, w, h);
          console.log("try to save as " + type);
          data = canvas.toDataURL(type);
          if (data == null) {
            console.log("Could not get dataURL");
            return;
          }
          console.log("update image with dataurl");
          return this.imageEdit(ev, data);
        } catch (_error) {
          err = _error;
          return console.log("error doing crop: " + err.message + " " + err.stack);
        }
      } else {
        return console.log("warning: imageCrop without img and/or cropCoords");
      }
    };

    FileEditView.prototype.imageTransform = function(cw, ch, a, b, c, d, e, f) {
      var canvas, context, data, err, type;
      if ((this.img != null) && (this.trueSize != null)) {
        type = this.model.get('fileType');
        if (type == null) {
          console.log("Using default image type");
          type = "image/png";
        }
        try {
          canvas = document.createElement("canvas");
          canvas.width = cw;
          canvas.height = ch;
          context = canvas.getContext("2d");
          context.transform(a, b, c, d, e, f);
          context.drawImage(this.img, 0, 0);
          console.log("try to save as " + type);
          data = canvas.toDataURL(type);
          if (data == null) {
            console.log("Could not get dataURL");
            return;
          }
          console.log("update image with dataurl");
          return this.imageEdit(null, data);
        } catch (_error) {
          err = _error;
          return console.log("error doing " + name + ": " + err.message + " " + err.stack);
        }
      }
    };

    FileEditView.prototype.imageFlip = function(ev) {
      var name;
      ev.preventDefault();
      name = $(ev.target).attr('name');
      console.log("imageFlip " + name);
      if ((this.img != null) && (this.trueSize != null)) {
        if ((name.indexOf('horizontal')) >= 0) {
          return this.imageTransform(this.trueSize[0], this.trueSize[1], -1, 0, 0, 1, this.trueSize[0], 0);
        } else {
          return this.imageTransform(this.trueSize[0], this.trueSize[1], 1, 0, 0, -1, 0, this.trueSize[1]);
        }
      }
    };

    FileEditView.prototype.imageScale = function(ev) {
      var ix, name, sh, sw;
      ev.preventDefault();
      name = $(ev.target).attr('name');
      console.log("imageScale " + name);
      ix = name.lastIndexOf('-');
      sw = Number(name.substring(ix + 1));
      if ((this.img != null) && (this.trueSize != null)) {
        sh = Math.round(sw * this.trueSize[1] / this.trueSize[0]);
        console.log("Scale to " + sw + "x" + sh);
        return this.imageTransform(sw, sh, sw / this.trueSize[0], 0, 0, sh / this.trueSize[1], 0, 0);
      }
    };

    FileEditView.prototype.imageRotate = function(ev) {
      var name;
      ev.preventDefault();
      name = $(ev.target).attr('name');
      console.log("imageRotate " + name);
      if ((this.img != null) && (this.trueSize != null)) {
        if ((name.indexOf('left')) >= 0) {
          return this.imageTransform(this.trueSize[1], this.trueSize[0], 0, -1, 1, 0, 0, this.trueSize[0]);
        } else {
          return this.imageTransform(this.trueSize[1], this.trueSize[0], 0, 1, -1, 0, this.trueSize[1], 0);
        }
      }
    };

    FileEditView.prototype.imageAspect = function(ev) {
      var aspect, err;
      ev.preventDefault();
      aspect = $(ev.target).val();
      console.log("aspect " + aspect);
      if (this.jcrop == null) {
        console.log("jcrop not set in imageAspect");
        if (aspect !== '') {
          $(ev.target).val('');
        }
        return false;
      }
      if (aspect === 'fixed') {
        if (!this.trueSize) {
          console.log("truSize not set in imageAspect fixed");
          $(ev.target).val('');
          return false;
        }
        aspect = this.trueSize[0] / this.trueSize[1];
      } else if (aspect === '') {
        aspect = null;
      } else {
        aspect = Number(aspect);
      }
      console.log("set image aspect ratio to " + aspect);
      try {
        return this.jcrop.setOptions({
          aspectRatio: aspect
        });
      } catch (_error) {
        err = _error;
        return console.log("error setting aspect ratio to " + aspect + ": " + err.message + " " + err.stack);
      }
    };

    return FileEditView;

  })(ThingEditView);

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
  var HtmlEditView, ThingEditView, templateHtmlEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateHtmlEditTab = require('templates/HtmlEditTab');

  ThingEditView = require('views/ThingEdit');

  module.exports = HtmlEditView = (function(_super) {
    __extends(HtmlEditView, _super);

    function HtmlEditView() {
      this.remove = __bind(this.remove, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      return HtmlEditView.__super__.constructor.apply(this, arguments);
    }

    HtmlEditView.prototype.tabs = function() {
      return HtmlEditView.__super__.tabs.call(this).concat([
        {
          title: 'HTML',
          template: templateHtmlEditTab
        }
      ]);
    };

    HtmlEditView.prototype.render = function() {
      var replace;
      HtmlEditView.__super__.render.call(this);
      replace = function() {
        var ckconfig;
        console.log("Set up CKEditor...");
        ckconfig = {};
        ckconfig.filebrowserBrowseUrl = 'filebrowse.html';
        ckconfig.filebrowserImageBrowseUrl = 'filebrowse.html?type=image%2F';
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
      this.fileUrl = "../../../../" + (encodeURIComponent(this.model.id)) + "/bytes";
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
      this.addItem = __bind(this.addItem, this);
      this.template = __bind(this.template, this);
      return ImageSelectListView.__super__.constructor.apply(this, arguments);
    }

    ImageSelectListView.prototype.template = function(d) {
      return templateImageSelectList(d);
    };

    ImageSelectListView.prototype.addItem = function(thing) {
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
}, "views/ListEdit": function(exports, require, module) {(function() {
  var ListEditView, ThingEditView, ThingRef, ThingRefList, ThingRefListView, templateListEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateListEditTab = require('templates/ListEditTab');

  ThingEditView = require('views/ThingEdit');

  ThingRefList = require('models/ThingRefList');

  ThingRef = require('models/ThingRef');

  ThingRefListView = require('views/ThingRefList');

  module.exports = ListEditView = (function(_super) {
    __extends(ListEditView, _super);

    function ListEditView() {
      this.remove = __bind(this.remove, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      return ListEditView.__super__.constructor.apply(this, arguments);
    }

    ListEditView.prototype.tabs = function() {
      return ListEditView.__super__.tabs.call(this).concat([
        {
          title: 'List',
          template: templateListEditTab
        }
      ]);
    };

    ListEditView.prototype.render = function() {
      var i, thingId, things, _i, _len, _ref;
      ListEditView.__super__.render.call(this);
      things = [];
      if (this.model.attributes.thingIds != null) {
        _ref = this.model.attributes.thingIds;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          thingId = _ref[i];
          things.push(new ThingRef({
            thingId: thingId,
            _id: uuid()
          }));
        }
      }
      this.thingRefList = new ThingRefList(things);
      this.thingRefListView = new ThingRefListView({
        model: this.thingRefList
      });
      return $('.thingref-list-holder', this.$el).append(this.thingRefListView.el);
    };

    ListEditView.prototype.formToModel = function() {
      var thingIds, tr, _i, _len, _ref;
      thingIds = [];
      _ref = this.thingRefList.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tr = _ref[_i];
        if (tr.attributes.thingId) {
          thingIds.push(tr.attributes.thingId);
        } else {
          console.log("error: missing thingId in ThingRef " + tr.id);
        }
      }
      console.log("thingIds = " + thingIds);
      this.model.set({
        thingIds: thingIds
      });
      return ListEditView.__super__.formToModel.call(this);
    };

    ListEditView.prototype.remove = function() {
      console.log("remove ListEdit " + this.model.id);
      this.thingRefListView.remove();
      return ListEditView.__super__.remove.call(this);
    };

    return ListEditView;

  })(ThingEditView);

}).call(this);
}, "views/PlaceEdit": function(exports, require, module) {(function() {
  var PlaceEditView, ThingEditView, geocoder, maxZoom, myIcon, templatePlaceEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templatePlaceEditTab = require('templates/PlaceEditTab');

  ThingEditView = require('views/ThingEdit');

  window.lastGeocodeCallback = 0;

  geocoder = new google.maps.Geocoder();

  myIcon = L.icon({
    iconUrl: '../../vendor/leaflet/images/my-icon.png',
    iconRetinaUrl: '../../vendor/leaflet/images/my-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    shadowUrl: '../../vendor/leaflet/images/marker-shadow.png'
  });

  maxZoom = 19;

  module.exports = PlaceEditView = (function(_super) {
    __extends(PlaceEditView, _super);

    function PlaceEditView() {
      this.remove = __bind(this.remove, this);
      this.showLatlon = __bind(this.showLatlon, this);
      this.showTab = __bind(this.showTab, this);
      this.useLatlon = __bind(this.useLatlon, this);
      this.useAddress = __bind(this.useAddress, this);
      this.lookupAddress = __bind(this.lookupAddress, this);
      this.clearMap = __bind(this.clearMap, this);
      this.selectMapicon = __bind(this.selectMapicon, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      return PlaceEditView.__super__.constructor.apply(this, arguments);
    }

    PlaceEditView.prototype.tabs = function() {
      return PlaceEditView.__super__.tabs.call(this).concat([
        {
          title: 'Place',
          template: templatePlaceEditTab
        }
      ]);
    };

    PlaceEditView.prototype.render = function() {
      var err, f;
      PlaceEditView.__super__.render.call(this);
      f = (function(_this) {
        return function() {
          var layer, mapEl;
          mapEl = $('.map', _this.$el).get(0);
          _this.map = L.map(mapEl).setView([_this.model.attributes.lat, _this.model.attributes.lon], _this.model.attributes.zoom);
          layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            maxZoom: maxZoom,
            keyboard: false
          });
          layer.addTo(_this.map);
          _this.marker = L.marker([_this.model.attributes.lat, _this.model.attributes.lon], {
            icon: myIcon
          });
          _this.marker.bindPopup("Current Lat/Lon");
          _this.marker.addTo(_this.map);
          _this.addressMarkers = [];
          _this.map.on('click', function(ev) {
            var lat, lon;
            console.log("clicked the map at " + String(ev.latlng.lat) + "," + String(ev.latlng.lng));
            lat = Number(ev.latlng.lat).toFixed(6);
            lon = Number(ev.latlng.lng).toFixed(6);
            if (_this.latlonPopup == null) {
              _this.latlonPopup = L.popup();
            }
            _this.latlonPopup.setLatLng(ev.latlng).setContent("" + lat + "," + lon + "<br/><a href='#' class='button tiny do-use-latlon' data-latlon='" + lat + "," + lon + "' >Use</a>");
            return _this.latlonPopup.openOn(_this.map);
          });
          return console.log("(hopefully) created map");
        };
      })(this);
      if (this.map) {
        try {
          this.map.remove();
          this.map = null;
        } catch (_error) {
          err = _error;
          console.log("error removing place map: " + err.message);
        }
      }
      return setTimeout(f, 0);
    };

    PlaceEditView.prototype.formToModel = function() {
      var address, err, lat, lon, mapiconurl, zoom;
      mapiconurl = $('.image-mapicon', this.$el).attr('src');
      address = $('input[name=address]', this.$el).val();
      lat = $('input[name=lat]', this.$el).val();
      try {
        lat = Number(lat);
      } catch (_error) {
        err = _error;
        console.log("Error in lat as Number: " + lat + " " + err.message);
      }
      lon = $('input[name=lon]', this.$el).val();
      try {
        lon = Number(lon);
      } catch (_error) {
        err = _error;
        console.log("Error in lon as Number: " + lon + " " + err.message);
      }
      console.log("mapiconurl = " + mapiconurl + ", address=" + address + ", lat=" + lat + ", lon=" + lon);
      this.model.set({
        mapiconurl: mapiconurl,
        address: address,
        lat: lat,
        lon: lon
      });
      if (this.map != null) {
        zoom = this.map.getZoom();
        if (zoom != null) {
          console.log("zoom = " + zoom);
          this.model.set({
            zoom: zoom
          });
        }
      }
      return PlaceEditView.__super__.formToModel.call(this);
    };

    PlaceEditView.prototype.events = function() {
      return _.extend({}, PlaceEditView.__super__.events.call(this), {
        "click .do-select-mapicon": "selectMapicon",
        "click .do-lookup-address": "lookupAddress",
        "click .do-clear-map": "clearMap",
        "click .do-show-latlon": "showLatlon",
        "click .do-use-address": "useAddress",
        "click .do-use-latlon": "useLatlon"
      });
    };

    PlaceEditView.prototype.selectMapicon = function(ev) {
      return this.selectImage(ev, '.image-mapicon');
    };

    PlaceEditView.prototype.clearMap = function(ev) {
      var marker, _i, _len, _ref;
      console.log("clear map");
      ev.preventDefault();
      $('.do-clear-map', this.$el).addClass('disabled');
      _ref = this.addressMarkers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
        this.map.removeLayer(marker);
      }
      return this.addressMarkers = [];
    };

    PlaceEditView.prototype.lookupAddress = function(ev) {
      var address, geocodeCallback;
      ev.preventDefault();
      address = $('input[name=address]', this.$el).val().trim();
      if (address.length === 0) {
        console.log("lookupAddress with empty address");
        return;
      }
      this.clearMap(ev);
      window.lastGeocodeCallback++;
      geocodeCallback = window.lastGeocodeCallback;
      console.log("lookupAddress " + address + "... (request " + geocodeCallback + ")");
      $('.do-lookup-address', this.$el).addClass('disabled');
      return geocoder.geocode({
        'address': address
      }, (function(_this) {
        return function(results, status) {
          var bounds, err, i, marker, result, _i, _len;
          if (geocodeCallback !== window.lastGeocodeCallback) {
            console.log("ignore old geocode response " + geocodeCallback);
            return;
          }
          $('.do-lookup-address', _this.$el).removeClass('disabled');
          $('.do-clear-map', _this.$el).removeClass('disabled');
          console.log("geocode result " + status + " " + results);
          if (status === google.maps.GeocoderStatus.OK) {
            bounds = null;
            for (i = _i = 0, _len = results.length; _i < _len; i = ++_i) {
              result = results[i];
              try {
                marker = L.marker([result.geometry.location.lat(), result.geometry.location.lng()]);
                if (bounds != null) {
                  bounds.extend(marker.getLatLng());
                } else {
                  bounds = L.latLngBounds(marker.getLatLng(), marker.getLatLng());
                }
                marker.addTo(_this.map);
                console.log("added marker " + marker);
                marker.bindPopup("" + result.formatted_address + "<br/><a href='#' class='button tiny do-use-address' data-address-marker='" + i + "' >Use</a>");
                _this.addressMarkers.push(marker);
              } catch (_error) {
                err = _error;
                alert("Sorry, did not get find any matching addresses (" + err.message + ")");
              }
            }
            if (bounds != null) {
              _this.map.fitBounds(bounds);
            }
            return $('.map', _this.$el).focus();
          } else {
            return console.log("Geocode was not successful for the following reason: " + status);
          }
        };
      })(this));
    };

    PlaceEditView.prototype.useAddress = function(ev) {
      var i, latLng, marker;
      ev.preventDefault();
      console.log("use address " + ($(ev.target).attr('data-address-marker')));
      i = $(ev.target).attr('data-address-marker');
      if (i != null) {
        i = Number(i);
      }
      marker = this.addressMarkers[i];
      if (marker == null) {
        console.log("Could not find address marker " + i + " - should have " + this.addressMarker.length);
        return;
      }
      marker.closePopup();
      latLng = marker.getLatLng();
      this.marker.setLatLng(latLng);
      $('input[name=lat]', this.$el).val(Number(latLng.lat).toFixed(6));
      $('input[name=lon]', this.$el).val(Number(latLng.lng).toFixed(6));
      $('input[name=zoom]', this.$el).val(String(this.map.getZoom()));
      return this.clearMap(ev);
    };

    PlaceEditView.prototype.useLatlon = function(ev) {
      var latlon, ll;
      ev.preventDefault();
      console.log("use latlon " + ($(ev.target).attr('data-latlon')));
      if (this.latlonPopup != null) {
        this.map.closePopup(this.latlonPopup);
      }
      latlon = $(ev.target).attr('data-latlon');
      ll = latlon.split(',');
      this.marker.setLatLng([ll[0], ll[1]]);
      $('input[name=lat]', this.$el).val(ll[0]);
      $('input[name=lon]', this.$el).val(ll[1]);
      return $('input[name=zoom]', this.$el).val(String(this.map.getZoom()));
    };

    PlaceEditView.prototype.showTab = function(ev) {
      var f;
      PlaceEditView.__super__.showTab.call(this, ev);
      if (this.map) {
        f = (function(_this) {
          return function() {
            console.log("Map: invalidateSize");
            return _this.map.invalidateSize();
          };
        })(this);
        return setTimeout(f, 0);
      }
    };

    PlaceEditView.prototype.showLatlon = function(ev) {
      var err, lat, lon, zoom;
      ev.preventDefault();
      lat = $('input[name=lat]', this.$el).val();
      try {
        lat = Number(lat);
      } catch (_error) {
        err = _error;
        console.log("Error in lat as Number: " + lat + " " + err.message);
      }
      lon = $('input[name=lon]', this.$el).val();
      try {
        lon = Number(lon);
      } catch (_error) {
        err = _error;
        console.log("Error in lon as Number: " + lon + " " + err.message);
      }
      zoom = $('input[name=zoom]', this.$el).val();
      try {
        zoom = Number(zoom);
      } catch (_error) {
        err = _error;
        console.log("Error in zoom as Number: " + zoom + " " + err.message);
      }
      if (this.map != null) {
        return this.map.setView([lat, lon], zoom);
      }
    };

    PlaceEditView.prototype.remove = function() {
      var err;
      window.lastGeocodeCallback++;
      if (this.map) {
        try {
          this.map.remove();
          this.map = null;
        } catch (_error) {
          err = _error;
          console.log("error removing place map: " + err.message);
        }
      }
      return PlaceEditView.__super__.remove.call(this);
    };

    return PlaceEditView;

  })(ThingEditView);

}).call(this);
}, "views/TaskConfigEdit": function(exports, require, module) {(function() {
  var TaskConfigEditView, allthings, server, taskstates, templateTaskConfigEdit, templateTaskConfigEditState, templateTaskConfigEditSubject,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateTaskConfigEdit = require('templates/TaskConfigEdit');

  templateTaskConfigEditSubject = require('templates/TaskConfigEditSubject');

  templateTaskConfigEditState = require('templates/TaskConfigEditState');

  allthings = require('allthings');

  taskstates = require('taskstates');

  server = require('server');

  module.exports = TaskConfigEditView = (function(_super) {
    __extends(TaskConfigEditView, _super);

    function TaskConfigEditView(options) {
      this.remove = __bind(this.remove, this);
      this.close = __bind(this.close, this);
      this.cancel = __bind(this.cancel, this);
      this.submit = __bind(this.submit, this);
      this.formToModel = __bind(this.formToModel, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      this.templateState = __bind(this.templateState, this);
      this.renderState = __bind(this.renderState, this);
      this.addState = __bind(this.addState, this);
      this.addThing = __bind(this.addThing, this);
      this.addToEdit = __bind(this.addToEdit, this);
      this.addThis = __bind(this.addThis, this);
      this.initialize = __bind(this.initialize, this);
      this.add = options.add != null ? options.add : options.add = false;
      this.things = options.things != null ? options.things : options.things = null;
      TaskConfigEditView.__super__.constructor.call(this, options);
    }

    TaskConfigEditView.prototype.tagName = 'div';

    TaskConfigEditView.prototype.className = 'row thing-edit';

    TaskConfigEditView.prototype.cancelled = false;

    TaskConfigEditView.prototype.initialize = function() {
      var ix, thing;
      TaskConfigEditView.__super__.initialize.call(this);
      if (this.add && !this.model.attributes.taskType) {
        console.log("Block TaskConfig add without taskType (i.e. with addingThings data)");
        setTimeout(this.remove, 0);
        alert("Sorry, there is not enough information to add a new task");
        return;
      }
      if (this.add && (this.things != null)) {
        if ((thing = this.things.get(this.model.id)) != null) {
          console.log("Add TaskConfigEdit -> edit (already exists)");
          this.addToEdit(thing);
          return;
        }
        console.log("Add TaskConfigEdit - listening in case exist");
        this.listenTo(this.things, 'add', this.addThis);
      } else {
        console.log("TaskConfigEdit - Edit or real add? add=" + this.add + ", things=" + this.things);
      }
      this.allthings = allthings.get();
      if (this.model.attributes.subjectId) {
        this.subject = this.allthings.get(this.model.attributes.subjectId);
        if (this.subject == null) {
          console.log("Could not find subject " + this.model.attributes.subjectId + " on start-up; listening...");
          this.listenTo(this.allthings, 'add', this.addThing);
        } else {
          console.log("taskconfig subject = " + this.subject);
        }
      }
      this.taskstates = taskstates.get();
      ix = this.model.id.indexOf(':');
      this.taskstateid = 'taskstate:' + this.model.id.substring(ix + 1);
      this.taskstate = this.taskstates.get(this.taskstateid);
      if (this.taskstate == null) {
        console.log("Could not find taskstate " + this.taskstateid + " on start-up; listening...");
        return this.listenTo(this.taskstates, 'add', this.addState);
      } else {
        console.log("taskconfig state = " + this.taskstate);
        return this.listenTo(this.taskstate, 'change', this.renderState);
      }
    };

    TaskConfigEditView.prototype.addThis = function(thing) {
      if (thing.id === this.model.id) {
        console.log("Found self in add " + thing.id);
        return this.addToEdit(thing);
      }
    };

    TaskConfigEditView.prototype.addToEdit = function(thing) {
      setTimeout(this.remove, 0);
      window.router.navigate("#ContentType/taskconfig/edit/" + (encodeURIComponent(this.model.id)), {
        trigger: true,
        replace: true
      });
      if (thing.attributes.taskType !== this.model.attributes.taskType || thing.attributes.subjectId !== this.model.attributes.subjectId) {
        return alert("Sorry, that path is already assigned to this task");
      }
    };

    TaskConfigEditView.prototype.addThing = function(thing) {
      if ((this.subject == null) && thing.id === this.model.attributes.subjectId) {
        console.log("Found subject " + thing.id);
        this.subject = thing;
        $('.subject-holder', this.$el).html(templateTaskConfigEditSubject(this.subject.attributes));
        return this.stopListening(this.allthings);
      }
    };

    TaskConfigEditView.prototype.addState = function(state) {
      if ((this.taskstate == null) && state.id === this.taskstateid) {
        console.log("Found state " + state.id);
        this.taskstate = state;
        this.stopListening(this.taskstates);
        this.listenTo(this.taskstate, 'change', this.renderState);
        return this.renderState();
      } else {
        return console.log("Igore new state " + state.id + " (@taskstatid=" + this.taskstateid + ", @taskstate=" + this.taskstate + ")");
      }
    };

    TaskConfigEditView.prototype.renderState = function() {
      console.log("renderState " + this.taskstate.id);
      if (this.taskstate) {
        return $('.state-holder', this.$el).html(this.templateState(this.taskstate.attributes));
      }
    };

    TaskConfigEditView.prototype.templateState = function(d) {
      return templateTaskConfigEditState(_.extend({
        lastChanged: this.model.attributes.lastChanged,
        created: this.model.attributes.created
      }, d));
    };

    TaskConfigEditView.prototype.template = function(d) {
      return templateTaskConfigEdit(d);
    };

    TaskConfigEditView.prototype.render = function() {
      var stateHtml, subjectHtml;
      console.log("render TaskConfigEdit " + this.model.attributes._id);
      subjectHtml = null;
      if (this.subject != null) {
        subjectHtml = templateTaskConfigEditSubject(this.subject.attributes);
      }
      stateHtml = null;
      if (this.taskstate != null) {
        stateHtml = this.templateState(this.taskstate.attributes);
      }
      return this.$el.html(this.template(_.extend({
        add: this.add,
        subjectHtml: subjectHtml,
        stateHtml: stateHtml
      }, this.model.attributes)));
    };

    TaskConfigEditView.prototype.events = {
      "submit": "submit",
      "click .do-cancel": "cancel"
    };

    TaskConfigEditView.prototype.formToModel = function() {
      var enabled, time;
      enabled = $('input[name=enabled]').prop('checked');
      time = new Date().getTime();
      this.model.set({
        enabled: enabled,
        lastChanged: time
      });
      if (this.add) {
        return this.model.set({
          created: time
        });
      }
    };

    TaskConfigEditView.prototype.submit = function(ev) {
      console.log("submit...");
      if (this.things) {
        this.stopListening(this.things);
      }
      ev.preventDefault();
      this.formToModel();
      server.working('save TaskConfigEdit');
      if (false === this.model.save(null, {
        success: server.success,
        error: server.error
      })) {
        server.error(this.model, 'Save validation error (TaskConfigEdit)', {});
      }
      if (this.add) {
        if (this.things) {
          this.things.add(this.model);
        }
        allthings.get().add(this.model);
        return setTimeout((function(_this) {
          return function() {
            return window.router.navigate("#ContentType/taskconfig/edit/" + (encodeURIComponent(_this.model.id)), {
              trigger: true,
              replace: true
            });
          };
        })(this), 0);
      } else {
        return this.render();
      }
    };

    TaskConfigEditView.prototype.cancel = function() {
      console.log("cancel");
      this.cancelled = true;
      if ((this.model.id != null) && (this.things != null)) {
        console.log("try remove on cancel for " + this.model.id);
      }
      return this.close();
    };

    TaskConfigEditView.prototype.close = function() {
      return window.history.back();
    };

    TaskConfigEditView.prototype.remove = function() {
      return TaskConfigEditView.__super__.remove.call(this);
    };

    return TaskConfigEditView;

  })(Backbone.View);

}).call(this);
}, "views/TaskConfigInList": function(exports, require, module) {(function() {
  var TaskConfigInListView, ThingInListView, allthings, templateTaskConfigInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ThingInListView = require('views/ThingInList');

  templateTaskConfigInList = require('templates/TaskConfigInList');

  allthings = require('allthings');

  module.exports = TaskConfigInListView = (function(_super) {
    __extends(TaskConfigInListView, _super);

    function TaskConfigInListView() {
      this.template = __bind(this.template, this);
      return TaskConfigInListView.__super__.constructor.apply(this, arguments);
    }

    TaskConfigInListView.prototype.initialize = function() {
      return TaskConfigInListView.__super__.initialize.call(this);
    };

    TaskConfigInListView.prototype.template = function(d) {
      var things;
      if (!this.subject) {
        if (this.model.attributes.subjectId != null) {
          things = allthings.get();
          this.subject = things.get(this.model.attributes.subjectId);
        }
      }
      console.log("template TaskConfigInList subject=" + this.subject);
      return templateTaskConfigInList(_.extend({
        subject: this.subject != null ? this.subject.attributes : {}
      }, d));
    };

    return TaskConfigInListView;

  })(ThingInListView);

}).call(this);
}, "views/TaskConfigList": function(exports, require, module) {(function() {
  var TaskConfigList, ThingListView, addTaskConfig, templateTaskConfigList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ThingListView = require('views/ThingList');

  templateTaskConfigList = require('templates/TaskConfigList');

  addTaskConfig = require('addTaskConfig');

  module.exports = TaskConfigList = (function(_super) {
    __extends(TaskConfigList, _super);

    function TaskConfigList() {
      this.addTaskImport = __bind(this.addTaskImport, this);
      this.addTaskCheckpoint = __bind(this.addTaskCheckpoint, this);
      this.addTaskBackup = __bind(this.addTaskBackup, this);
      this.addTaskRm = __bind(this.addTaskRm, this);
      this.addTaskTar = __bind(this.addTaskTar, this);
      this.template = __bind(this.template, this);
      return TaskConfigList.__super__.constructor.apply(this, arguments);
    }

    TaskConfigList.prototype.template = function(d) {
      return templateTaskConfigList(d);
    };

    TaskConfigList.prototype.events = {
      "click .do-add-task-tar": "addTaskTar",
      "click .do-add-task-rm": "addTaskRm",
      "click .do-add-task-backup": "addTaskBackup",
      "click .do-add-task-checkpoint": "addTaskCheckpoint",
      "click .do-add-task-import": "addTaskImport"
    };

    TaskConfigList.prototype.addTask = function(ev, taskType, _suffix) {
      var model;
      ev.preventDefault();
      model = {
        taskType: taskType,
        enabled: true,
        _suffix: _suffix
      };
      return addTaskConfig.add(model);
    };

    TaskConfigList.prototype.addTaskTar = function(ev) {
      return this.addTask(ev, 'tar', ':tar');
    };

    TaskConfigList.prototype.addTaskRm = function(ev) {
      return this.addTask(ev, 'rm', ':rm');
    };

    TaskConfigList.prototype.addTaskBackup = function(ev) {
      return this.addTask(ev, 'backup');
    };

    TaskConfigList.prototype.addTaskCheckpoint = function(ev) {
      return this.addTask(ev, 'checkpoint');
    };

    TaskConfigList.prototype.addTaskImport = function(ev) {
      return this.addTask(ev, 'import');
    };

    return TaskConfigList;

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
  var ThingEditView, allthings, server, templateThingEdit, templateThingEditTab,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingEdit = require('templates/ThingEdit');

  templateThingEditTab = require('templates/ThingEditTab');

  server = require('server');

  allthings = require('allthings');

  window.mediahubCallbacks = {};

  window.nextMediahubCallback = 1;

  module.exports = ThingEditView = (function(_super) {
    __extends(ThingEditView, _super);

    function ThingEditView(options) {
      this.remove = __bind(this.remove, this);
      this.selectImage = __bind(this.selectImage, this);
      this.close = __bind(this.close, this);
      this.cancel = __bind(this.cancel, this);
      this.selectIcon = __bind(this.selectIcon, this);
      this.selectThingImage = __bind(this.selectThingImage, this);
      this.submit = __bind(this.submit, this);
      this.showTab = __bind(this.showTab, this);
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

    ThingEditView.prototype.tabs = function() {
      return [
        {
          title: 'Overview',
          template: templateThingEditTab
        }
      ];
    };

    ThingEditView.prototype.render = function() {
      var f;
      console.log("render ThingEdit " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template({
        data: this.model.attributes,
        add: this.add,
        contentType: this.model.getContentType().attributes,
        tabs: this.tabs()
      }));
      f = function() {
        var ckconfig;
        $('input[name="title"]', this.$el).focus();
        console.log("Set up CKEditor 'description'...");
        ckconfig = {};
        ckconfig.customConfig = '../../ckeditor_config_description.js';
        return CKEDITOR.replace('description', ckconfig);
      };
      setTimeout(f, 0);
      return this;
    };

    ThingEditView.prototype.events = function() {
      return {
        "submit": "submit",
        "click .do-cancel": "cancel",
        "click .do-save": "save",
        "click .do-select-image": "selectThingImage",
        "click .do-select-icon": "selectIcon",
        "click .tab-title > a": "showTab"
      };
    };

    ThingEditView.prototype.formToModel = function() {
      var description, iconurl, imageurl, title;
      title = $('input[name="title"]', this.$el).val();
      description = $(':input[name="description"]', this.$el).val();
      imageurl = $('.image-image', this.$el).attr('src');
      iconurl = $('.image-icon', this.$el).attr('src');
      console.log("title=" + title + ", description=" + description + ", imageurl=" + imageurl + ", iconurl=" + iconurl);
      return this.model.set({
        title: title,
        description: description,
        imageurl: imageurl,
        iconurl: iconurl
      });
    };

    ThingEditView.prototype.showTab = function(ev) {
      var ix, tab;
      console.log("show tab " + ev.target.href);
      ev.preventDefault();
      tab = ev.target.href;
      if ((ix = tab.indexOf('#')) >= 0) {
        tab = tab.substring(ix + 1);
      }
      $('.tab-title', this.$el).removeClass('active');
      $(ev.target).parent().addClass('active');
      $('.tabs-content > .content', this.$el).removeClass('active');
      return $(".thing-tab-" + tab, this.$el).addClass('active');
    };

    ThingEditView.prototype.submit = function(ev) {
      console.log("submit...");
      ev.preventDefault();
      this.formToModel();
      if (!this.model.isValid()) {
        console.log("submit not valid: " + this.model.validationError);
      }
      server.working('save Thing');
      if (false === this.model.save(null, {
        success: server.success,
        error: server.error
      })) {
        server.error(this.model, 'Save validation error (save Thing)');
      }
      if (this.add) {
        if (this.things) {
          this.things.add(this.model);
        }
        allthings.get().add(this.model);
      }
      return this.close();
    };

    ThingEditView.prototype.selectThingImage = function(ev) {
      return this.selectImage(ev, '.image-image');
    };

    ThingEditView.prototype.selectIcon = function(ev) {
      return this.selectImage(ev, '.image-icon');
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
      return window.history.back();
    };

    ThingEditView.prototype.selectImage = function(ev, selector) {
      var self;
      console.log("selectImage " + selector + "...");
      ev.preventDefault();
      this.callback = window.nextMediahubCallback++;
      self = this;
      window.mediahubCallbacks[this.callback] = function(url) {
        console.log("set image " + url);
        return $(selector, self.$el).attr('src', url);
      };
      return window.open("filebrowse.html?type=image%2F&mediahubCallback=" + this.callback, '_blank', "width=" + (0.8 * screen.width) + ", height=" + (0.7 * screen.height) + ", menubar=no, location=no, status=no, toolbar=no");
    };

    ThingEditView.prototype.remove = function() {
      var editor;
      if (this.callback != null) {
        delete window.mediahubCallbacks[this.callback];
      }
      editor = CKEDITOR.instances['description'];
      if (editor) {
        console.log("destroy ckeditor 'description'");
        editor.destroy(true);
      }
      return ThingEditView.__super__.remove.call(this);
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
}, "views/ThingInMultiselect": function(exports, require, module) {(function() {
  var ThingInMultiselectView, templateThingInMultiselect,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingInMultiselect = require('templates/ThingInMultiselect');

  module.exports = ThingInMultiselectView = (function(_super) {
    __extends(ThingInMultiselectView, _super);

    function ThingInMultiselectView() {
      this.preview = __bind(this.preview, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingInMultiselectView.__super__.constructor.apply(this, arguments);
    }

    ThingInMultiselectView.prototype.tagName = 'div';

    ThingInMultiselectView.prototype.className = 'columns thing-in-list';

    ThingInMultiselectView.prototype.initialize = function() {};

    ThingInMultiselectView.prototype.template = function(d) {
      var id, ix, typeName;
      id = this.model.id;
      ix = id.indexOf(':');
      typeName = ix > 0 ? id.substring(0, ix) : 'unknown';
      return templateThingInMultiselect(_.extend({
        typeName: typeName
      }, d));
    };

    ThingInMultiselectView.prototype.render = function() {
      console.log("render ThingInMultiselectView " + this.model.attributes._id + ": " + this.model.attributes.title);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    ThingInMultiselectView.prototype.events = {
      "click .do-preview-thing": "preview"
    };

    ThingInMultiselectView.prototype.preview = function(ev) {
      console.log("preview " + this.model.attributes._id);
      return ev.preventDefault();
    };

    return ThingInMultiselectView;

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
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingListView.__super__.constructor.apply(this, arguments);
    }

    ThingListView.prototype.tagName = 'div';

    ThingListView.prototype.className = 'row thing-list top-level-view';

    ThingListView.prototype.initialize = function() {
      this.views = [];
      this.listenTo(this.model, 'add', this.addItem);
      return this.listenTo(this.model, 'remove', this.removeItem);
    };

    ThingListView.prototype.template = function(d) {
      return templateThingList(d);
    };

    ThingListView.prototype.render = function() {
      console.log("render ThingList, contentType=" + this.model.model.contentType.id);
      this.$el.html(this.template({
        contentType: this.model.model.contentType.attributes
      }));
      this.model.forEach(this.addItem);
      return this;
    };

    ThingListView.prototype.addItem = function(thing) {
      var view;
      console.log("ThingListView add " + thing.id);
      view = this.model.model.contentType.getThingView(thing);
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    ThingListView.prototype.removeItem = function(thing) {
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

    ThingListView.prototype.remove = function() {
      var view, _i, _len, _ref;
      _ref = this.views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        view.remove();
      }
      return ThingListView.__super__.remove.call(this);
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
}, "views/ThingMultiselectModal": function(exports, require, module) {(function() {
  var ThingInMultiselectView, ThingMultiselectModalView, templateThingMultiselectModal,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingMultiselectModal = require('templates/ThingMultiselectModal');

  ThingInMultiselectView = require('views/ThingInMultiselect');

  module.exports = ThingMultiselectModalView = (function(_super) {
    __extends(ThingMultiselectModalView, _super);

    function ThingMultiselectModalView() {
      this.show = __bind(this.show, this);
      this.remove = __bind(this.remove, this);
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.doClose = __bind(this.doClose, this);
      this.doOk = __bind(this.doOk, this);
      this.checkSelect = __bind(this.checkSelect, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingMultiselectModalView.__super__.constructor.apply(this, arguments);
    }

    ThingMultiselectModalView.prototype.id = 'ThingMultiselectModalView';

    ThingMultiselectModalView.prototype.tagName = 'div';

    ThingMultiselectModalView.prototype.className = 'reveal-modal add-thingrefs-modal';

    ThingMultiselectModalView.prototype.attributes = {
      'data-reveal': ''
    };

    ThingMultiselectModalView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.addItem);
      return this.listenTo(this.model, 'remove', this.removeItem);
    };

    ThingMultiselectModalView.prototype.template = function(d) {
      return templateThingMultiselectModal(d);
    };

    ThingMultiselectModalView.prototype.render = function() {
      this.$el.html(this.template({}));
      this.views = [];
      this.model.forEach(this.addItem);
      return this;
    };

    ThingMultiselectModalView.prototype.inited = false;

    ThingMultiselectModalView.prototype.events = {
      'click .do-ok': 'doOk',
      'click .do-close': 'doClose',
      'change input[type=checkbox]': 'checkSelect'
    };

    ThingMultiselectModalView.prototype.checkSelect = function(ev) {
      var selected;
      console.log("checkSelect...");
      selected = $('input:checked', this.$el).length > 0;
      if (selected) {
        return $('.do-ok', this.$el).removeClass('disabled');
      } else {
        return $('.do-ok', this.$el).addClass('disabled');
      }
    };

    ThingMultiselectModalView.prototype.doOk = function(ev) {
      var el, err, id, thingIds, _i, _len, _ref;
      ev.preventDefault();
      if ($(ev.target).hasClass('disabled')) {
        console.log("ignore ok - disabled");
        return;
      }
      this.$el.foundation('reveal', 'close');
      thingIds = [];
      _ref = $('input:checked', this.$el);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        id = $(el).attr('name');
        console.log("selected " + id);
        thingIds.push(id);
      }
      try {
        return this.callback(thingIds);
      } catch (_error) {
        err = _error;
        console.log("error calling ThingMultiselect callback: " + err.message);
        return console.log("at " + err.stack);
      }
    };

    ThingMultiselectModalView.prototype.doClose = function(ev) {
      ev.preventDefault();
      return this.$el.foundation('reveal', 'close');
    };

    ThingMultiselectModalView.prototype.addItem = function(thing) {
      var i, ix, sortValue, sv, v, view, _i, _len, _ref, _ref1;
      console.log("ThingMultiselectModalView add " + thing.id);
      view = new ThingInMultiselectView({
        model: thing
      });
      view.render();
      if (thing.getSortValue != null) {
        sortValue = String(thing.getSortValue());
      } else {
        console.log("ThingMultiselectModalView no getSortValue: " + ((_ref = thing.constructor) != null ? _ref.name : void 0) + " " + (JSON.stringify(thing.attributes)));
        sortValue = thing.id;
        thing.getSortValue = function() {
          return sortValue;
        };
      }
      ix = this.views.length;
      _ref1 = this.views;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        v = _ref1[i];
        sv = v.model.getSortValue();
        if ((sortValue.localeCompare(String(sv))) < 0) {
          ix = i;
          break;
        }
      }
      if (ix < this.views.length) {
        console.log("insert Thing at " + ix + " / " + this.views.length + " (" + sortValue + ")");
        this.views[ix].$el.before(view.$el);
        return this.views.splice(ix, 0, view);
      } else {
        $('.thing-list', this.$el).append(view.$el);
        return this.views.push(view);
      }
    };

    ThingMultiselectModalView.prototype.removeItem = function(thing) {
      var i, view, _i, _len, _ref;
      console.log("ThingMultiselectModalView remove " + thing.id);
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

    ThingMultiselectModalView.prototype.remove = function() {
      var view, _i, _len, _ref;
      _ref = this.views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        view.remove();
      }
      return ThingMultiselectModalView.__super__.remove.call(this);
    };

    ThingMultiselectModalView.prototype.show = function(cb) {
      var err;
      if (!this.inited) {
        this.inited = true;
        try {
          this.$el.foundation('reveal', 'init');
        } catch (_error) {
          err = _error;
          console.log("error doing reveal init: " + err.message);
        }
      }
      $('input[type=checkbox]').attr('checked', false);
      this.callback = cb;
      return this.$el.foundation('reveal', 'open');
    };

    return ThingMultiselectModalView;

  })(Backbone.View);

}).call(this);
}, "views/ThingRefInList": function(exports, require, module) {(function() {
  var ThingRefInListView, server, templateThingRefInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingRefInList = require('templates/ThingRefInList');

  server = require('server');

  module.exports = ThingRefInListView = (function(_super) {
    __extends(ThingRefInListView, _super);

    function ThingRefInListView() {
      this.removeFromList = __bind(this.removeFromList, this);
      this.preview = __bind(this.preview, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingRefInListView.__super__.constructor.apply(this, arguments);
    }

    ThingRefInListView.prototype.tagName = 'div';

    ThingRefInListView.prototype.className = 'columns thing-in-list';

    ThingRefInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    ThingRefInListView.prototype.template = function(d) {
      var id, ix, typeName;
      id = this.model.attributes.thingId;
      ix = id.indexOf(':');
      typeName = ix > 0 ? id.substring(0, ix) : 'unknown';
      return templateThingRefInList(_.extend({
        typeName: typeName
      }, d));
    };

    ThingRefInListView.prototype.render = function() {
      console.log("render ThingRefInList " + this.model.attributes._id + ": " + this.model.attributes.thingId);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    ThingRefInListView.prototype.events = {
      "click .do-preview-thing": "preview",
      "click .do-remove-thingref": "removeFromList"
    };

    ThingRefInListView.prototype.preview = function(ev) {
      console.log("preview " + this.model.attributes._id);
      return ev.preventDefault();
    };

    ThingRefInListView.prototype.removeFromList = function(ev) {
      ev.preventDefault();
      console.log("remove " + this.model.attributes._id);
      server.working('destroy (removeFromList)');
      if (false === this.model.destroy({
        success: server.success,
        error: server.error
      })) {
        console.log("destroy (removeFromList) " + this.model.attributes._id + " returned false");
        return server.success(this.model, null, {});
      }
    };

    return ThingRefInListView;

  })(Backbone.View);

}).call(this);
}, "views/ThingRefList": function(exports, require, module) {(function() {
  var ThingMultiselectModalView, ThingRef, ThingRefInListView, ThingRefListView, allthings, server, templateThingRefList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingRefList = require('templates/ThingRefList');

  ThingRefInListView = require('views/ThingRefInList');

  ThingMultiselectModalView = require('views/ThingMultiselectModal');

  ThingRef = require('models/ThingRef');

  allthings = require('allthings');

  server = require('server');

  module.exports = ThingRefListView = (function(_super) {
    __extends(ThingRefListView, _super);

    function ThingRefListView() {
      this.moveBelow = __bind(this.moveBelow, this);
      this.onAddBelow = __bind(this.onAddBelow, this);
      this.addBelow = __bind(this.addBelow, this);
      this.getIndex = __bind(this.getIndex, this);
      this.removeSelected = __bind(this.removeSelected, this);
      this.getSelectedModels = __bind(this.getSelectedModels, this);
      this.checkSelect = __bind(this.checkSelect, this);
      this.selectNone = __bind(this.selectNone, this);
      this.selectAll = __bind(this.selectAll, this);
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.addThing = __bind(this.addThing, this);
      this.remove = __bind(this.remove, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingRefListView.__super__.constructor.apply(this, arguments);
    }

    ThingRefListView.prototype.tagName = 'div';

    ThingRefListView.prototype.className = 'row';

    ThingRefListView.prototype.initialize = function() {
      this.views = [];
      this.allthings = allthings.get();
      this.listenTo(this.model, 'add', this.addItem);
      this.listenTo(this.model, 'remove', this.removeItem);
      this.listenTo(this.allthings, 'add', this.addThing);
      return this.render();
    };

    ThingRefListView.prototype.template = function(d) {
      return templateThingRefList(d);
    };

    ThingRefListView.prototype.render = function() {
      var views;
      console.log("render ThingRefList");
      this.$el.html(this.template({}));
      views = [];
      this.model.forEach((function(_this) {
        return function(item) {
          return _this.addItem(item, _this.model, {});
        };
      })(this));
      return this;
    };

    ThingRefListView.prototype.remove = function() {
      var view, _i, _len, _ref;
      _ref = this.views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        view.remove();
      }
      return ThingRefListView.__super__.remove.call(this);
    };

    ThingRefListView.prototype.addThing = function(thing) {
      var tr, _i, _len, _ref, _results;
      console.log("found Thing " + thing.id + " (" + this.model.models.length + " models)");
      _ref = this.model.models;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tr = _ref[_i];
        if (tr.attributes.thingId === thing.id) {
          console.log("Found thingRef " + tr.id + " Thing " + thing.id + " on addThing");
          _results.push(tr.set({
            thing: thing
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    ThingRefListView.prototype.addItem = function(thing, collection, options) {
      var ix, t, view;
      ix = collection.indexOf(thing);
      if (thing.attributes.thingId && (thing.attributes.thing == null)) {
        t = this.allthings.get(thing.attributes.thingId);
        if (t != null) {
          thing.set({
            thing: t
          });
        }
      }
      view = new ThingRefInListView({
        model: thing
      });
      if (ix >= 0 && ix < this.views.length) {
        console.log("add ThingRef " + view.el + " before " + this.views[ix].el + " ix " + ix);
        $(this.views[ix].el).before(view.el);
        return this.views.splice(ix, 0, view);
      } else {
        console.log("append ThingRef " + view.el + " to " + this.$el);
        this.$el.append(view.el);
        return this.views.push(view);
      }
    };

    ThingRefListView.prototype.removeItem = function(thing) {
      var i, view, _i, _len, _ref;
      console.log("ThingRefListView remove " + thing.id);
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

    ThingRefListView.prototype.events = {
      "click .do-remove-thingrefs": "removeSelected",
      "click .do-add-below": "addBelow",
      "click .do-move-below": "moveBelow",
      'change input[type=checkbox]': 'checkSelect',
      "click .do-select-all": "selectAll",
      "click .do-select-none": "selectNone"
    };

    ThingRefListView.prototype.selectAll = function(ev) {
      ev.preventDefault();
      return $('input[type=checkbox]', this.$el).prop('checked', true);
    };

    ThingRefListView.prototype.selectNone = function(ev) {
      ev.preventDefault();
      return $('input[type=checkbox]', this.$el).prop('checked', false);
    };

    ThingRefListView.prototype.checkSelect = function(ev) {
      var selected;
      console.log("checkSelect...");
      selected = $('input:checked', this.$el).length > 0;
      if (selected) {
        $('.do-move-below', this.$el).removeClass('disabled');
        return $('.do-remove-thingrefs', this.$el).removeClass('disabled');
      } else {
        $('.do-move-below', this.$el).addClass('disabled');
        return $('.do-remove-thingrefs', this.$el).addClass('disabled');
      }
    };

    ThingRefListView.prototype.getSelectedModels = function() {
      var el, id, models, tr, _i, _len, _ref;
      models = [];
      _ref = $('input:checked', this.$el);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        id = $(el).attr('name');
        console.log("selected " + id);
        tr = this.model.get(id);
        if (tr != null) {
          models.push(tr);
        } else {
          console.log("Could not find selected thingRef " + id);
        }
      }
      return models;
    };

    ThingRefListView.prototype.removeSelected = function(ev) {
      var tr, _i, _len, _ref, _results;
      ev.preventDefault();
      _ref = this.getSelectedModels();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tr = _ref[_i];
        console.log("remove selected ThingRef " + tr.id);
        server.working('destroy (removeSelected)');
        if (false === tr.destroy({
          success: server.success,
          error: server.error
        })) {
          console.log("destroy (removeSelected) " + tr.id + " returned false");
          _results.push(server.success(tr, null, {}));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    ThingRefListView.prototype.getIndex = function(ev) {
      var i, id, input, ix, model, parent, _i, _len, _ref;
      ix = 0;
      parent = $(ev.target).parent();
      if (parent != null) {
        input = $('input[type=checkbox]', parent).get(0);
        if (input != null) {
          id = $(input).attr('name');
          _ref = this.model.models;
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            model = _ref[i];
            if (model.id === id) {
              ix = i + 1;
            }
          }
          console.log("add/move on " + id + " at " + ix);
        }
      }
      return ix;
    };

    ThingRefListView.prototype.addBelow = function(ev) {
      var ix, thingList;
      ev.preventDefault();
      ix = this.getIndex(ev);
      console.log("addBelow " + ix + "...");
      if (this.multiseletModal == null) {
        thingList = allthings.get();
        this.multiselectModal = new ThingMultiselectModalView({
          model: thingList
        });
        this.multiselectModal.render();
        this.$el.append(this.multiselectModal.el);
      }
      return this.multiselectModal.show((function(_this) {
        return function(thingIds) {
          return _this.onAddBelow(thingIds, ix);
        };
      })(this));
    };

    ThingRefListView.prototype.onAddBelow = function(thingIds, ix) {
      var i, thingId, _i, _len, _results;
      console.log("onAddBelow: " + thingIds.length + " items at " + ix);
      _results = [];
      for (i = _i = 0, _len = thingIds.length; _i < _len; i = ++_i) {
        thingId = thingIds[i];
        _results.push(this.model.add(new ThingRef({
          thingId: thingId,
          _id: uuid()
        }), {
          at: (ix != null ? ix : 0) + i
        }));
      }
      return _results;
    };

    ThingRefListView.prototype.moveBelow = function(ev) {
      var i, ix, m, models, _i, _j, _len, _len1, _results;
      ev.preventDefault();
      ix = this.getIndex(ev);
      console.log("moveBelow " + ix + "...");
      models = this.getSelectedModels();
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        m = models[_i];
        if ((this.model.indexOf(m)) < ix) {
          ix = ix - 1;
        }
      }
      _results = [];
      for (i = _j = 0, _len1 = models.length; _j < _len1; i = ++_j) {
        m = models[i];
        console.log("move ThingRef " + m.id + " to " + (ix + i));
        this.model.remove(m);
        _results.push(this.model.add(m, {
          at: ix + i
        }));
      }
      return _results;
    };

    return ThingRefListView;

  })(Backbone.View);

}).call(this);
}});
