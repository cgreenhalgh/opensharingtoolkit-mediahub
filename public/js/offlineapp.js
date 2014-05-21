
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
  var App, CacheStateWidgetView, Router, Track, TrackReview, TrackView, appcache, checkConfig, checkTrack, clientid, dburl, itemViews, loadTrack, refresh,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  appcache = require('appcache');

  CacheStateWidgetView = require('views/CacheStateWidget');

  Track = require('models/Track');

  TrackView = require('views/Track');

  TrackReview = require('models/TrackReview');

  itemViews = [];

  dburl = null;

  clientid = null;

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

  checkTrack = function(data) {
    var cid, err, reviewid, track, trackView, trackid;
    console.log("track: " + data);
    try {
      data = JSON.parse(data);
      data.url = dburl + "/" + data._id + "/bytes";
      track = new Track(data);
      trackid = data._id.indexOf(':') >= 0 ? data._id.substring(data._id.indexOf(':') + 1) : data._id;
      cid = clientid.indexOf(':') >= 0 ? clientid.substring(clientid.indexOf(':') + 1) : clientid;
      reviewid = 'trackreview:' + trackid + ':' + cid;
      console.log("add track " + data._id + " review " + reviewid);
      track.trackReview = new TrackReview({
        id: reviewid,
        trackid: data._id,
        clientid: clientid
      });
      try {
        track.trackReview.fetch();
      } catch (_error) {
        err = _error;
        console.log("error fetching review " + reviewid + ": " + err.message);
      }
      trackView = new TrackView({
        model: track
      });
      itemViews.push(trackView);
      return $('body').append(trackView.el);
    } catch (_error) {
      err = _error;
      return console.log("error parsing track: " + err.message + ": " + data);
    }
  };

  loadTrack = function(item) {
    console.log("load track " + item.id);
    return $.ajax(dburl + "/" + item.id, {
      success: checkTrack,
      dataType: "text",
      error: function(xhr, status, err) {
        console.log("get track error " + xhr.status + ": " + err.message);
        if (xhr.status === 0 && xhr.responseText) {
          return checkTrack(xhr.responseText);
        }
      }
    });
  };

  checkConfig = function(data) {
    var err, item, _i, _len, _ref, _results;
    console.log("config: " + data);
    try {
      data = JSON.parse(data);
      _ref = data.items;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (item.type === 'track') {
          _results.push(loadTrack(item));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    } catch (_error) {
      err = _error;
      return console.log("error parsing client config: " + err.message + ": " + data);
    }
  };

  refresh = function() {
    var itemView, oldItemViews, _i, _len;
    console.log("refresh " + dburl + " " + clientid);
    oldItemViews = itemViews;
    itemViews = [];
    for (_i = 0, _len = oldItemViews.length; _i < _len; _i++) {
      itemView = oldItemViews[_i];
      itemView.remove();
    }
    return $.ajax(dburl + "/" + clientid, {
      success: checkConfig,
      dataType: "text",
      error: function(xhr, status, err) {
        console.log("get client config error " + xhr.status + ": " + err.message);
        if (xhr.status === 0 && xhr.responseText) {
          return checkConfig(xhr.responseText);
        }
      }
    });
  };

  App = {
    init: function() {
      var appcacheWidget, router;
      clientid = $('meta[name="mediahub-clientid"]').attr('content');
      console.log("OfflineApp starting... clientid=" + clientid);
      dburl = location.href;
      if (dburl.indexOf('/_design/') >= 0) {
        dburl = dburl.substring(0, dburl.indexOf('/_design/'));
      }
      appcacheWidget = new CacheStateWidgetView({
        model: appcache.state
      });
      $('body').append(appcacheWidget.el);
      Backbone.Model.prototype.idAttribute = '_id';
      _.extend(Backbone.Model.prototype, BackbonePouch.attachments());
      router = new Router;
      Backbone.history.start();
      appcache.onUpdate(function() {
        return refresh(dburl, clientid);
      });
      return refresh(dburl, clientid);
    }
  };

  module.exports = App;

}).call(this);
}, "appcache": function(exports, require, module) {(function() {
  var CacheState, appCache, onUpdate, on_cache_event, state, updateState;

  CacheState = require('models/CacheState');

  state = new CacheState();

  module.exports.state = state;

  onUpdate = [];

  module.exports.onUpdate = function(cb) {
    return onUpdate.push(cb);
  };

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
    var cb, err, _i, _len, _results;
    console.log('AppCache status = ' + appCache.status);
    updateState();
    if (appCache.status === appCache.UPDATEREADY) {
      try {
        appCache.swapCache();
        console.log("Swapped cache!");
        updateState();
        _results = [];
        for (_i = 0, _len = onUpdate.length; _i < _len; _i++) {
          cb = onUpdate[_i];
          try {
            _results.push(cb());
          } catch (_error) {
            err = _error;
            _results.push(console.log("error calling cache onUpdate fn: " + err.message));
          }
        }
        return _results;
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
}, "models/Track": function(exports, require, module) {(function() {
  var Track,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = Track = (function(_super) {
    __extends(Track, _super);

    function Track() {
      return Track.__super__.constructor.apply(this, arguments);
    }

    Track.prototype.defaults = {
      title: '',
      description: '',
      type: 'track'
    };

    return Track;

  })(Backbone.Model);

}).call(this);
}, "models/TrackReview": function(exports, require, module) {(function() {
  var TrackReview,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = TrackReview = (function(_super) {
    __extends(TrackReview, _super);

    function TrackReview() {
      return TrackReview.__super__.constructor.apply(this, arguments);
    }

    TrackReview.prototype.defaults = {
      rating: 0,
      comment: '',
      editing: true
    };

    return TrackReview;

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
      __out.push('\n  <div class="column small-12 large-12">\n    <div data-alert class="alert-box clearfix ');
    
      __out.push(__sanitize(this.alertType));
    
      __out.push('">\n      ');
    
      if (this.updateReady) {
        __out.push('\n        <a href="#" class="button tiny right updateReady ">Reload</a>\n      ');
      }
    
      __out.push('\n      ');
    
      __out.push(__sanitize(this.message));
    
      __out.push('\n      <!-- <a href="#" class="close">&times;</a> -->\n      ');
    
      if (this.bookmark) {
        __out.push('\n        <br/>Bookmark this page to return it\n      ');
      }
    
      __out.push('\n    </div>\n  </div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/Track": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<div class="column small-12 large-12">\n  <h1>');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</h1>\n  <p>');
    
      __out.push(__sanitize(this.description));
    
      __out.push('</p>\n  <audio controls><source type="audio/mp3" src="');
    
      __out.push(__sanitize(this.url));
    
      __out.push('"/></audio>\n</div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/TrackReview": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\nReview...\n\n\n');
    
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
}, "views/Track": function(exports, require, module) {(function() {
  var TrackReviewView, TrackView, templateTrack,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateTrack = require('templates/Track');

  TrackReviewView = require('views/TrackReview');

  module.exports = TrackView = (function(_super) {
    __extends(TrackView, _super);

    function TrackView() {
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return TrackView.__super__.constructor.apply(this, arguments);
    }

    TrackView.prototype.tagName = 'div';

    TrackView.prototype.className = 'row';

    TrackView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      this.trackReviewView = new TrackReviewView({
        model: this.model.trackReview
      });
      return this.render();
    };

    TrackView.prototype.template = function(d) {
      return templateTrack(d);
    };

    TrackView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      this.$el.append(this.trackReviewView.el);
      return this;
    };

    return TrackView;

  })(Backbone.View);

}).call(this);
}, "views/TrackReview": function(exports, require, module) {(function() {
  var TrackReviewView, templateTrackReview,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateTrackReview = require('templates/TrackReview');

  module.exports = TrackReviewView = (function(_super) {
    __extends(TrackReviewView, _super);

    function TrackReviewView() {
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return TrackReviewView.__super__.constructor.apply(this, arguments);
    }

    TrackReviewView.prototype.tagName = 'div';

    TrackReviewView.prototype.className = 'column small-12 large-12';

    TrackReviewView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    TrackReviewView.prototype.template = function(d) {
      return templateTrackReview(d);
    };

    TrackReviewView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    return TrackReviewView;

  })(Backbone.View);

}).call(this);
}});
