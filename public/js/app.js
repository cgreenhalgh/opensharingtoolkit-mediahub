
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
  var App, File, FileList, FileListView, Router,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  File = require('models/File');

  FileList = require('models/FileList');

  FileListView = require('views/FileList');

  Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      return Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "": "entries"
    };

    Router.prototype.entries = function() {
      return console.log("router: entries");
    };

    return Router;

  })(Backbone.Router);

  App = {
    init: function() {
      var err, files, filesView, router, t1;
      console.log("App starting...");
      Backbone.sync = BackbonePouch.sync({
        db: PouchDB('http://127.0.0.1:5984/mydb')
      });
      Backbone.Model.prototype.idAttribute = '_id';
      files = new FileList();
      filesView = new FileListView({
        model: files
      });
      $('body').append(filesView.el);
      files.fetch();
      t1 = new File({
        _id: '1234',
        title: 'test file'
      });
      try {
        t1.save();
      } catch (_error) {
        err = _error;
        console.log("save error " + err.message);
      }
      router = new Router;
      return Backbone.history.start();
    }
  };

  module.exports = App;

}).call(this);
}, "models/File": function(exports, require, module) {(function() {
  var File,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = File = (function(_super) {
    __extends(File, _super);

    function File() {
      return File.__super__.constructor.apply(this, arguments);
    }

    File.prototype.defaults = {
      title: 'Unnamed file',
      description: ''
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
      listen: true,
      options: {
        query: {
          include_docs: true,
          fun: {
            map: function(doc) {
              return emit(doc.title, null);
            }
          }
        },
        changes: {
          include_docs: true,
          continuous: true,
          filter: function(doc) {
            return doc._deleted || true;
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
}, "templates/FileInList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<p>');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</p>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "views/FileInList": function(exports, require, module) {(function() {
  var FileInListView, templateFileInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateFileInList = require('templates/FileInList');

  module.exports = FileInListView = (function(_super) {
    __extends(FileInListView, _super);

    function FileInListView() {
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

    return FileInListView;

  })(Backbone.View);

}).call(this);
}, "views/FileList": function(exports, require, module) {(function() {
  var FileInListView, FileListView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FileInListView = require('views/FileInList');

  module.exports = FileListView = (function(_super) {
    __extends(FileListView, _super);

    function FileListView() {
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      return FileListView.__super__.constructor.apply(this, arguments);
    }

    FileListView.prototype.tagName = 'div';

    FileListView.prototype.className = 'file-list';

    FileListView.prototype.initialize = function() {
      return this.listenTo(this.model, 'add', this.add);
    };

    FileListView.prototype.render = function() {
      var views;
      this.$el.empty();
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    FileListView.prototype.views = [];

    FileListView.prototype.add = function(file, filelist) {
      var view;
      console.log("FileListView add " + file.attributes._id);
      view = new FileInListView({
        model: file
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    return FileListView;

  })(Backbone.View);

}).call(this);
}});
