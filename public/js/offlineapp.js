
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
  var App, CacheStateWidgetView, Router, appcache,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  appcache = require('appcache');

  CacheStateWidgetView = require('views/CacheStateWidget');

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
      var appcacheWidget, router;
      console.log("OfflineApp starting...");
      appcacheWidget = new CacheStateWidgetView({
        model: appcache.state
      });
      $('body').append(appcacheWidget.el);
      Backbone.Model.prototype.idAttribute = '_id';
      _.extend(Backbone.Model.prototype, BackbonePouch.attachments());
      router = new Router;
      return Backbone.history.start();
    }
  };

  module.exports = App;

}).call(this);
}, "appcache": function(exports, require, module) {(function() {
  var CacheState, appCache, on_cache_event, state, updateState;

  CacheState = require('models/CacheState');

  state = new CacheState();

  module.exports.state = state;

  appCache = window.applicationCache;

  updateState = function() {
    var newState;
    newState = (function() {
      switch (appCache.status) {
        case appCache.UNCACHED:
          return {
            alertType: 'warning',
            message: 'This page is not saved; you will need Internet access to view it again'
          };
        case appCache.IDLE:
          return {
            alertType: 'success',
            bookmark: true,
            message: 'Saved for off-Internet use'
          };
        case appCache.UPDATEREADY:
          return {
            alertType: 'info',
            bookmark: true,
            message: 'A new version has been downloaded',
            updateReady: true
          };
        case appCache.CHECKING:
        case appCache.DOWNLOADING:
          return {
            alertType: 'info',
            message: 'Checking for a new version'
          };
        case appCache.OBSOLETE:
          return {
            alertType: 'warning',
            message: 'obsolete'
          };
        default:
          return {
            alertType: 'warning',
            message: 'State unknown (' + appCache.status + ')'
          };
      }
    })();
    newState = _.extend({
      bookmark: false,
      alertType: '',
      updateReady: false,
      state: appCache.status
    }, newState);
    return state.set(newState);
  };

  on_cache_event = function(ev) {
    var err;
    console.log('AppCache status = ' + appCache.status);
    updateState();
    if (appCache.status === appCache.UPDATEREADY && false) {
      try {
        appCache.swapCache();
        console.log("Swapped cache!");
        return updateState();
      } catch (_error) {
        err = _error;
        return console.log("cache swap error: " + err.message);
      }
    }
  };

  $(appCache).bind("cached checking downloading error noupdate obsolete progress updateready", on_cache_event);

  on_cache_event();

}).call(this);
}, "models/CacheState": function(exports, require, module) {(function() {
  var OfflineState,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = OfflineState = (function(_super) {
    __extends(OfflineState, _super);

    function OfflineState() {
      return OfflineState.__super__.constructor.apply(this, arguments);
    }

    OfflineState.prototype.defaults = {
      state: 0,
      message: 'This page is not saved; you will need Internet access to view it again',
      bookmark: true,
      alertType: '',
      updateReady: false
    };

    return OfflineState;

  })(Backbone.Model);

}).call(this);
}, "templates/CacheStateWidget": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<div class="row">\n  <div class="column small-12 large-12">\n    <div data-alert class="alert-box clearfix ');
    
      __out.push(__sanitize(this.alertType));
    
      __out.push('">\n      ');
    
      if (this.updateReady) {
        __out.push('\n        <a href="#" class="button tiny left updateReady ">Reload</a>\n      ');
      }
    
      __out.push('\n      ');
    
      __out.push(__sanitize(this.message));
    
      __out.push('\n      <!-- <a href="#" class="close">&times;</a> -->\n      ');
    
      if (this.bookmark) {
        __out.push('\n        <br/>Bookmark this page to return it\n      ');
      }
    
      __out.push('\n    </div>\n  </div>\n</div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "views/CacheStateWidget": function(exports, require, module) {(function() {
  var CacheStateWidget, templateCacheStateWidget,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateCacheStateWidget = require('templates/CacheStateWidget');

  module.exports = CacheStateWidget = (function(_super) {
    __extends(CacheStateWidget, _super);

    function CacheStateWidget() {
      this.doUpdate = __bind(this.doUpdate, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return CacheStateWidget.__super__.constructor.apply(this, arguments);
    }

    CacheStateWidget.prototype.tagName = 'div';

    CacheStateWidget.prototype.className = 'row';

    CacheStateWidget.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    CacheStateWidget.prototype.template = function(d) {
      return templateCacheStateWidget(d);
    };

    CacheStateWidget.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    CacheStateWidget.prototype.events = {
      'click .updateReady': "doUpdate"
    };

    CacheStateWidget.prototype.doUpdate = function(ev) {
      console.log("Update!");
      ev.preventDefault();
      location.reload();
      return false;
    };

    return CacheStateWidget;

  })(Backbone.View);

}).call(this);
}});
