
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
  var App, CacheStateWidgetView, LocaldbStateListView, Router, SyncState, SyncStateWidgetView, Track, TrackReview, TrackView, appcache, checkConfig, checkTrack, clientid, dburl, itemViews, loadTrack, localdb, refresh,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  appcache = require('appcache');

  CacheStateWidgetView = require('views/CacheStateWidget');

  Track = require('models/Track');

  TrackView = require('views/Track');

  TrackReview = require('models/TrackReview');

  LocaldbStateListView = require('views/LocaldbStateList');

  SyncState = require('models/SyncState');

  SyncStateWidgetView = require('views/SyncStateWidget');

  localdb = require('localdb');

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
        _id: reviewid,
        trackid: data._id,
        clientid: clientid
      });
      track.trackReview.sync = BackbonePouch.sync({
        db: localdb.getdb()
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
      localdb.swapdb(dburl, data);
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
      return console.log("error parsing client config: " + err.message + ": " + data + " - " + err.stack);
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
      var appcacheWidget, localdbStateListView, router, syncState, syncStateWidgetView;
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
      localdbStateListView = new LocaldbStateListView({
        model: localdb.localdbStateList
      });
      $('body').append(localdbStateListView.el);
      syncState = new SyncState();
      syncStateWidgetView = new SyncStateWidgetView({
        model: syncState
      });
      $('body').append(syncStateWidgetView.el);
      Backbone.Model.prototype.idAttribute = '_id';
      _.extend(Backbone.Model.prototype, BackbonePouch.attachments());
      router = new Router;
      Backbone.history.start();
      $('body').append('<p id="initialising">initialising</p>');
      return localdb.init(function() {
        $('#initialising').remove();
        appcache.onUpdate(function() {
          return refresh(dburl, clientid);
        });
        return refresh(dburl, clientid);
      });
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
    console.log("update appcache state: " + (JSON.stringify(newState)));
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
}, "localdb": function(exports, require, module) {(function() {
  var LocaldbState, LocaldbStateList, appcache, db, localdbStateList, metadb;

  appcache = require('appcache');

  LocaldbState = require('models/LocaldbState');

  LocaldbStateList = require('models/LocaldbStateList');

  metadb = new PouchDB('metadata', {
    adapter: 'websql'
  });

  module.exports.metadb = metadb;

  db = new PouchDB('initial', {
    adapter: 'websql'
  });

  module.exports.getdb = function() {
    return db;
  };

  LocaldbState.prototype.sync = BackbonePouch.sync({
    db: metadb
  });

  localdbStateList = new LocaldbStateList();

  localdbStateList.sync = BackbonePouch.sync({
    db: metadb
  });

  module.exports.init = function(cb) {
    var call;
    call = function() {
      var err;
      try {
        return cb();
      } catch (_error) {
        err = _error;
        return console.log("Error calling localdb.init callback: " + err.message + " " + err.stack);
      }
    };
    return localdbStateList.fetch({
      success: function(collection, response, options) {
        console.log("LocaldbState fetched - calling back");
        return call();
      },
      error: function(collection, response, options) {
        console.log("LocaldbState fetch failed! - " + response);
        return call();
      }
    });
  };

  module.exports.localdbStateList = localdbStateList;

  module.exports.swapdb = function(dburl, config) {
    var dbchanges, dbname, err, instanceid, localdbState;
    instanceid = config._id + ":" + config._rev;
    dbname = encodeURIComponent(instanceid);
    console.log("swap local db to " + instanceid);
    if (typeof dbchanges !== "undefined" && dbchanges !== null) {
      dbchanges.cancel();
      dbchanges = null;
    }
    db = new PouchDB(dbname, {
      adapter: 'websql'
    });
    localdbState = localdbStateList.get(instanceid);
    if (localdbState == null) {
      console.log("Create LocaldbState " + instanceid);
      localdbState = new LocaldbState({
        _id: instanceid,
        remoteurl: dburl
      });
      try {
        localdbState.save();
      } catch (_error) {
        err = _error;
        console.log("error saving LocaldbState " + instanceid + ": " + err.message);
      }
      localdbStateList.add(localdbState);
    } else if (localdbState.attributes.remoteurl == null) {
      console.log("initialise localdb remoteurl " + dburl);
      localdbState.set({
        remoteurl: dburl
      });
      try {
        localdbState.save();
      } catch (_error) {
        err = _error;
        console.log("error saving LocaldbState (set remoteurl) " + instanceid + ": " + err.message);
      }
    } else if (localdbState.attributes.remoteurl !== dburl) {
      console.log("WARNING: new dburl does not match localdb remoteurl: " + dburl + " vs " + localdbState.attributes.remoteurl);
    }
    dbchanges = db.changes({
      include_docs: false,
      since: 'now',
      live: true,
      returnDocs: false
    });
    return dbchanges.on('change', function(change) {
      console.log("change to db " + instanceid + " id=" + change.id + " seq=" + change.seq + ": " + (JSON.stringify(change)));
      if (localdbState.get('hasLocalChanges') === false) {
        localdbState.set({
          hasLocalChanges: true
        });
        console.log("db " + instanceid + " set hasLocalChanges");
        try {
          return localdbState.save();
        } catch (_error) {
          return console.log("error saving LocaldbState " + instanceid + ": " + err.message);
        }
      }
    });
  };

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
}, "models/LocaldbState": function(exports, require, module) {(function() {
  var LocaldbState,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = LocaldbState = (function(_super) {
    __extends(LocaldbState, _super);

    function LocaldbState() {
      return LocaldbState.__super__.constructor.apply(this, arguments);
    }

    LocaldbState.prototype.defaults = {
      hasLocalChanges: false,
      type: 'LocaldbState',
      isCurrent: false
    };

    LocaldbState.prototype.idAttribute = '_id';

    return LocaldbState;

  })(Backbone.Model);

}).call(this);
}, "models/LocaldbStateList": function(exports, require, module) {(function() {
  var LocaldbState, LocaldbStateList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  LocaldbState = require('models/LocaldbState');

  module.exports = LocaldbStateList = (function(_super) {
    __extends(LocaldbStateList, _super);

    function LocaldbStateList() {
      return LocaldbStateList.__super__.constructor.apply(this, arguments);
    }

    LocaldbStateList.prototype.model = LocaldbState;

    LocaldbStateList.prototype.pouch = {
      fetch: 'allDocs',
      options: {
        listen: false,
        allDocs: {
          include_docs: true
        }
      }
    };

    LocaldbStateList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return LocaldbStateList;

  })(Backbone.Collection);

}).call(this);
}, "models/SyncState": function(exports, require, module) {(function() {
  var SyncState,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = SyncState = (function(_super) {
    __extends(SyncState, _super);

    function SyncState() {
      return SyncState.__super__.constructor.apply(this, arguments);
    }

    SyncState.prototype.defaults = {
      idle: true,
      message: 'idle'
    };

    return SyncState;

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

    TrackReview.prototype.idAttribute = '_id';

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
    
      __out.push('\n      ');
    
      if (this.unsavedLocaldbs) {
        __out.push('\n        <br/>Unsaved changes in ');
        __out.push(__sanitize(JSON.stringify(this.unsavedLocaldbs)));
        __out.push('\n      ');
      }
    
      __out.push('\n    </div>\n  </div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/LocaldbStateInList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<div data-alert class="alert-box ');
    
      __out.push(__sanitize(this.hasLocalChanges ? 'warning' : ''));
    
      __out.push('">\n  Localdb ');
    
      __out.push(__sanitize(this._id));
    
      __out.push(' \n  ');
    
      __out.push(__sanitize(this.hasLocalChanges ? '(has local changes)' : '(no local changes)'));
    
      __out.push('\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/SyncStateWidget": function(exports, require, module) {module.exports = function(__obj) {
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
    
      __out.push(__sanitize(!this.idle ? 'warning' : ''));
    
      __out.push('">\n        <a href="#" class="button tiny right doSync" ');
    
      __out.push(__sanitize(!this.idle ? 'disabled' : ''));
    
      __out.push('>Sync Now</a>\n        Synchronisation...<br/>\n        ');
    
      __out.push(__sanitize(this.message));
    
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
      __out.push('\n<form>\n  <div class="row">\n    <div class="columns large-12">\n      <h2>Your Review</h2>\n      <label>Rating</label>\n      <div><a href="#" class="rating rating1 ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">');
    
      __out.push(this.rating > 0 ? '&#9733;' : '&#9734;');
    
      __out.push('</a><!--\n        --><a href="#" class="rating rating2 ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">');
    
      __out.push(this.rating > 1 ? '&#9733;' : '&#9734;');
    
      __out.push('</a><!--\n        --><a href="#" class="rating rating3 ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">');
    
      __out.push(this.rating > 2 ? '&#9733;' : '&#9734;');
    
      __out.push('</a><!--\n        --><a href="#" class="rating rating4 ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">');
    
      __out.push(this.rating > 3 ? '&#9733;' : '&#9734;');
    
      __out.push('</a><!--\n        --><a href="#" class="rating rating5 ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">');
    
      __out.push(this.rating > 4 ? '&#9733;' : '&#9734;');
    
      __out.push('</a><div>\n      <label>Comment</label>\n      <textarea name="comment" ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('>');
    
      __out.push(__sanitize(this.comment));
    
      __out.push('</textarea>\n      <ul class="button-group">\n        <li><a href="#" class="button do-save ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">Save</a></li>\n        <li><a href="#" class="button do-edit ');
    
      __out.push(__sanitize(this.editing ? 'disabled' : void 0));
    
      __out.push('">Edit</a></li>\n        <li><a href="#" class="button do-cancel ');
    
      __out.push(__sanitize(!this.editing ? 'disabled' : void 0));
    
      __out.push('">Cancel</a></li>\n      </ul> \n    </div>\n  </div>\n</form>\n\n\n\n\n');
    
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
      console.log("render CacheStateWidget " + this.model.attributes);
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
}, "views/LocaldbStateInList": function(exports, require, module) {(function() {
  var LocaldbStateInListView, templateLocaldbStateInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateLocaldbStateInList = require('templates/LocaldbStateInList');

  module.exports = LocaldbStateInListView = (function(_super) {
    __extends(LocaldbStateInListView, _super);

    function LocaldbStateInListView() {
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return LocaldbStateInListView.__super__.constructor.apply(this, arguments);
    }

    LocaldbStateInListView.prototype.tagName = 'div';

    LocaldbStateInListView.prototype.className = 'column small-12 large-12';

    LocaldbStateInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    LocaldbStateInListView.prototype.template = function(d) {
      return templateLocaldbStateInList(d);
    };

    LocaldbStateInListView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    return LocaldbStateInListView;

  })(Backbone.View);

}).call(this);
}, "views/LocaldbStateList": function(exports, require, module) {(function() {
  var LocaldbState, LocaldbStateInListView, LocaldbStateListView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  LocaldbState = require('models/LocaldbState');

  LocaldbStateInListView = require('views/LocaldbStateInList');

  module.exports = LocaldbStateListView = (function(_super) {
    __extends(LocaldbStateListView, _super);

    function LocaldbStateListView() {
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return LocaldbStateListView.__super__.constructor.apply(this, arguments);
    }

    LocaldbStateListView.prototype.tagName = 'div';

    LocaldbStateListView.prototype.className = 'localdb-state-list row';

    LocaldbStateListView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.add);
      return this.listenTo(this.model, 'remove', this.remove);
    };

    LocaldbStateListView.prototype.template = function(d) {};

    LocaldbStateListView.prototype.render = function() {
      var views;
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    LocaldbStateListView.prototype.views = [];

    LocaldbStateListView.prototype.add = function(file) {
      var view;
      console.log("LocaldbStateListView add " + file.attributes._id);
      view = new LocaldbStateInListView({
        model: file
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    LocaldbStateListView.prototype.remove = function(file) {
      var i, view, _i, _len, _ref;
      console.log("LocaldbStateListView remove " + file.attributes._id);
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

    return LocaldbStateListView;

  })(Backbone.View);

}).call(this);
}, "views/SyncStateWidget": function(exports, require, module) {(function() {
  var SyncStateWidget, templateSyncStateWidget,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateSyncStateWidget = require('templates/SyncStateWidget');

  module.exports = SyncStateWidget = (function(_super) {
    __extends(SyncStateWidget, _super);

    function SyncStateWidget() {
      this.doSync = __bind(this.doSync, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return SyncStateWidget.__super__.constructor.apply(this, arguments);
    }

    SyncStateWidget.prototype.tagName = 'div';

    SyncStateWidget.prototype.className = 'row';

    SyncStateWidget.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    SyncStateWidget.prototype.template = function(d) {
      return templateSyncStateWidget(d);
    };

    SyncStateWidget.prototype.render = function() {
      console.log("render SyncStateWidget " + this.model.attributes);
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    SyncStateWidget.prototype.events = {
      'click .doSync': "doSync"
    };

    SyncStateWidget.prototype.doSync = function(ev) {
      if (!this.model.attributes.idle) {
        return false;
      }
      console.log("Sync!");
      ev.preventDefault();
      this.model.set({
        idle: false,
        message: 'Attempting to synchronize... (not really)'
      });
      return false;
    };

    return SyncStateWidget;

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
      this.onCancel = __bind(this.onCancel, this);
      this.onEdit = __bind(this.onEdit, this);
      this.onSave = __bind(this.onSave, this);
      this.onClickRating = __bind(this.onClickRating, this);
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

    TrackReviewView.prototype.events = {
      'click .rating': 'onClickRating',
      'click .do-save': 'onSave',
      'click .do-edit': 'onEdit',
      'click .do-cancel': 'onCancel'
    };

    TrackReviewView.prototype.onClickRating = function(ev) {
      var rating;
      ev.preventDefault();
      if (!this.model.attributes.editing) {
        return false;
      }
      rating = 0;
      if ($(ev.target).hasClass('rating1')) {
        rating = 1;
      } else if ($(ev.target).hasClass('rating2')) {
        rating = 2;
      }
      if ($(ev.target).hasClass('rating3')) {
        rating = 3;
      }
      if ($(ev.target).hasClass('rating4')) {
        rating = 4;
      }
      if ($(ev.target).hasClass('rating5')) {
        rating = 5;
      }
      console.log("rating " + rating);
      return this.model.set({
        rating: rating
      });
    };

    TrackReviewView.prototype.onSave = function(ev) {
      var comment, err;
      comment = $('textarea[name=comment]', this.$el).val();
      console.log("save, comment=" + comment);
      ev.preventDefault();
      this.model.set({
        comment: comment,
        editing: false
      });
      try {
        return this.model.save();
      } catch (_error) {
        err = _error;
        return console.log("error saving review: " + err.message);
      }
    };

    TrackReviewView.prototype.onEdit = function(ev) {
      console.log('edit');
      ev.preventDefault();
      return this.model.set({
        editing: true
      });
    };

    TrackReviewView.prototype.onCancel = function(ev) {
      var err;
      console.log('cancel');
      ev.preventDefault();
      try {
        return this.model.fetch();
      } catch (_error) {
        err = _error;
        return console.log("error cancelling review edit: " + err.message);
      }
    };

    return TrackReviewView;

  })(Backbone.View);

}).call(this);
}});
