
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
  var App, BookletCoverView, BookletView, CacheStateWidgetView, HomeView, LocaldbStateListView, Router, SyncState, SyncStateWidgetView, Track, TrackReview, TrackReviewList, TrackView, appcache, checkConfig, checkItem, clientid, currentView, dburl, itemViews, items, loadItem, loadItems, localdb, makeBooklet, makeTrack, refresh, syncState,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  appcache = require('appcache');

  HomeView = require('views/Home');

  CacheStateWidgetView = require('views/CacheStateWidget');

  Track = require('models/Track');

  TrackView = require('views/Track');

  TrackReview = require('models/TrackReview');

  TrackReviewList = require('models/TrackReviewList');

  LocaldbStateListView = require('views/LocaldbStateList');

  SyncState = require('models/SyncState');

  SyncStateWidgetView = require('views/SyncStateWidget');

  BookletCoverView = require('views/BookletCover');

  BookletView = require('views/Booklet');

  localdb = require('localdb');

  itemViews = [];

  dburl = null;

  clientid = null;

  syncState = new SyncState();

  items = {};

  currentView = null;

  Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      return Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "": "entries",
      "#": "entries",
      "booklet/:id": "booklet",
      "booklet/:id/:page": "bookletPage",
      "booklet/:id/:page/": "bookletPage",
      "booklet/:id/:page/:anchor": "bookletPage"
    };

    Router.prototype.removeCurrentView = function() {
      var err;
      if (currentView != null) {
        try {
          currentView.remove();
        } catch (_error) {
          err = _error;
          console.log("error removing current view: " + err.message);
        }
        return currentView = null;
      }
    };

    Router.prototype.entries = function() {
      console.log("router: entries");
      this.removeCurrentView();
      return $('#home').show();
    };

    Router.prototype.booklet = function(id) {
      var booklet;
      console.log("show booklet " + id);
      this.removeCurrentView();
      $('#home').hide();
      booklet = items[id];
      if (booklet == null) {
        alert("Sorry, could not find booklet " + id);
        this.navigate('#', {
          trigger: true,
          replace: true
        });
        return false;
      }
      currentView = new BookletView({
        model: booklet
      });
      $('body').append(currentView.el);
      return true;
    };

    Router.prototype.bookletPage = function(id, page, anchor) {
      if ((currentView == null) || currentView.model.id !== id) {
        if (!this.booklet(id)) {
          return;
        }
      }
      return currentView.showPage(page, anchor);
    };

    return Router;

  })(Backbone.Router);

  makeTrack = function(data) {
    var cid, err, reviewid, track, trackView, trackid;
    try {
      data.url = dburl + "/" + data._id + "/bytes";
      track = new Track(data);
      if (track.id) {
        items[track.id] = track;
      }
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
        db: localdb.currentdb()
      });
      try {
        track.trackReview.fetch();
      } catch (_error) {
        err = _error;
        console.log("error fetching review " + reviewid + ": " + err.message);
      }
      track.trackReviewList = new TrackReviewList();
      track.trackReviewList.sync = BackbonePouch.sync({
        db: localdb.currentdb()
      });
      try {
        track.trackReviewList.fetch();
      } catch (_error) {
        err = _error;
        console.log("error fetching trackreviews: " + err.message);
      }
      trackView = new TrackView({
        model: track
      });
      itemViews.push(trackView);
      return $('#home').append(trackView.el);
    } catch (_error) {
      err = _error;
      return console.log("error making track: " + err.message + ": " + data);
    }
  };

  makeBooklet = function(data) {
    var booklet, err, view;
    try {
      booklet = new Backbone.Model(data);
      if (booklet.id) {
        items[booklet.id] = booklet;
      }
      view = new BookletCoverView({
        model: booklet
      });
      itemViews.push(view);
      return $('#home').append(view.el);
    } catch (_error) {
      err = _error;
      return console.log("error making booklet: " + err.message + ": " + data);
    }
  };

  checkItem = function(instanceid, item, data) {
    var err;
    if (instanceid !== localdb.currentInstanceid()) {
      console.log("Ignore item on load; old instanceid " + instanceid + " vs " + (localdb.currentInstanceid()));
      return;
    }
    console.log("" + item.type + ": " + data);
    try {
      data = JSON.parse(data);
      if (item.type === 'track') {
        return makeTrack(data);
      } else if (item.type === 'booklet') {
        return makeBooklet(data);
      } else {
        return console.log("unknown item type " + item.type + " - ignored");
      }
    } catch (_error) {
      err = _error;
      return console.log("error parsing item: " + err.message + ": " + data);
    }
  };

  loadItem = function(instanceid, item) {
    console.log("load track " + item.id);
    return $.ajax(dburl + "/" + item.id, {
      success: function(data) {
        return checkItem(instanceid, item, data);
      },
      dataType: "text",
      error: function(xhr, status, err) {
        console.log("get track error " + xhr.status + ": " + err.message);
        if (xhr.status === 0 && xhr.responseText) {
          return checkItem(instanceid, item, xhr.responseText);
        }
      }
    });
  };

  loadItems = function(instanceid, data) {
    var item, _i, _len, _ref, _results;
    _ref = data.items;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      if (item.type != null) {
        _results.push(loadItem(instanceid, item));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  checkConfig = function(data) {
    var err, instanceid;
    console.log("config: " + data);
    try {
      data = JSON.parse(data);
      instanceid = data._id + ':' + data._rev;
      localdb.swapdb(dburl, data);
      $('#home').append('<p id="syncing">synchronizing</p>');
      return syncState.doSync(function(success) {
        if (success) {
          $('#syncing').remove();
          return loadItems(instanceid, data);
        } else {
          console.log("Error doing initial synchronization");
          return $('#home').replace('<p id="syncing">Error doing initial synchronization - try reloading this page</p>');
        }
      });
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
      var appcacheWidget, home, ix, localdbStateListView, path, router, syncStateWidgetView;
      home = new HomeView({
        model: {}
      });
      home.el.id = 'home';
      $('body').append(home.el);
      clientid = $('meta[name="mediahub-clientid"]').attr('content');
      console.log("OfflineApp starting... clientid=" + clientid);
      dburl = location.href;
      if (dburl.indexOf('/_design/') >= 0) {
        dburl = dburl.substring(0, dburl.indexOf('/_design/'));
      }
      appcacheWidget = new CacheStateWidgetView({
        model: appcache.state
      });
      $('#home').append(appcacheWidget.el);
      localdbStateListView = new LocaldbStateListView({
        model: localdb.localdbStateList
      });
      $('#home').append(localdbStateListView.el);
      syncStateWidgetView = new SyncStateWidgetView({
        model: syncState
      });
      $('#home').append(syncStateWidgetView.el);
      Backbone.Model.prototype.idAttribute = '_id';
      _.extend(Backbone.Model.prototype, BackbonePouch.attachments());
      router = new Router;
      window.router = router;
      path = window.location.pathname;
      ix = path.lastIndexOf('/');
      if (ix >= 0) {
        path = path.substring(0, ix + 1);
      }
      if (!Backbone.history.start({
        root: path
      })) {
        console.log("invalid initial route");
        router.navigate('#', {
          trigger: true
        });
      }
      $('#home').append('<p id="initialising">initialising</p>');
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
  var CacheState, appCache, lastState, onUpdate, on_cache_event, state, updateState;

  CacheState = require('models/CacheState');

  state = new CacheState();

  module.exports.state = state;

  onUpdate = [];

  module.exports.onUpdate = function(cb) {
    return onUpdate.push(cb);
  };

  appCache = window.applicationCache;

  lastState = -1;

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
    if (appCache.status === lastState) {
      return false;
    }
    lastState = appCache.status;
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
            _results.push(console.log("error calling cache onUpdate fn: " + err.message + " " + err.stack));
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
  var LocaldbState, LocaldbStateList, appcache, config, db, dbcache, getdb, instanceid, localdbStateList, metadb;

  appcache = require('appcache');

  LocaldbState = require('models/LocaldbState');

  LocaldbStateList = require('models/LocaldbStateList');

  dbcache = {};

  getdb = function(url) {
    var db;
    if (dbcache[url] != null) {
      return dbcache[url];
    } else {
      if (window.openDatabase != null) {
        console.log("WARNING: forcing websql");
        return dbcache[url] = db = new PouchDB(url, {
          adapter: 'websql'
        });
      } else {
        console.log("NOTE: using default pouchdb persistence");
        return dbcache[url] = db = new PouchDB(url);
      }
    }
  };

  module.exports.getdb = getdb;

  metadb = getdb('metadata');

  module.exports.metadb = metadb;

  instanceid = 'initial';

  db = getdb('initial');

  config = {};

  module.exports.currentdb = function() {
    return db;
  };

  module.exports.currentInstanceid = function() {
    return instanceid;
  };

  module.exports.currentConfig = function() {
    return config;
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

  module.exports.swapdb = function(dburl, newconfig) {
    var dbchanges, dbname, err, localdbState;
    config = newconfig;
    instanceid = config._id + ":" + config._rev;
    dbname = encodeURIComponent(instanceid);
    console.log("swap local db to " + instanceid);
    if (typeof dbchanges !== "undefined" && dbchanges !== null) {
      dbchanges.cancel();
      dbchanges = null;
    }
    db = getdb(dbname);
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
      localdbState.set({
        hasLocalChanges: localdbState.attributes.syncedSeq < change.seq,
        lastSeq: change.seq,
        maxSeq: (localdbState.attributes.maxSeq == null) || change.seq > localdbState.attributes.maxSeq ? change.seq : localdbState.attributes.maxSeq
      });
      console.log("db " + instanceid + " set hasLocalChanges:true, lastSeq: " + change.seq);
      try {
        return localdbState.save();
      } catch (_error) {
        return console.log("error saving LocaldbState " + instanceid + ": " + err.message);
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
      isCurrent: false,
      lastSeq: 0,
      maxSeq: 0,
      syncedSeq: 0
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
  var SyncState, localdb,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  localdb = require('localdb');

  module.exports = SyncState = (function(_super) {
    __extends(SyncState, _super);

    function SyncState() {
      return SyncState.__super__.constructor.apply(this, arguments);
    }

    SyncState.prototype.defaults = {
      idle: true,
      message: 'idle'
    };

    SyncState.prototype.localdbStatesToCheck = [];

    SyncState.prototype.successfns = [];

    SyncState.prototype.doSync = function(successfn) {
      var ldb, _i, _len, _ref;
      if (successfn != null) {
        this.successfns.push(successfn);
      }
      _ref = localdb.localdbStateList.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ldb = _ref[_i];
        if (true) {
          this.localdbStatesToCheck.push(ldb);
        }
      }
      if (!this.get('idle')) {
        return false;
      }
      this.set({
        idle: false,
        message: 'Attempting to synchronize...'
      });
      return this.checkNextLocaldb();
    };

    SyncState.prototype.checkNextLocaldb = function() {
      var localdbState;
      if (this.localdbStatesToCheck.length === 0) {
        console.log("No more localdbs to check");
        this.set({
          idle: true,
          message: 'Idle (all localdbs checked)'
        });
        return;
      }
      localdbState = (this.localdbStatesToCheck.splice(0, 1))[0];
      this.set({
        idle: false,
        message: "Attempting to synchronize " + localdbState.id + "..."
      });
      return this.syncIncoming(localdbState);
    };

    SyncState.prototype.syncOutgoing = function(localdbState) {
      var dbname, recurse;
      dbname = encodeURIComponent(localdbState.id);
      console.log("replicate " + dbname + " to " + localdbState.attributes.remoteurl + "...");
      recurse = (function(_this) {
        return function() {
          return _this.checkNextLocaldb();
        };
      })(this);
      return PouchDB.replicate(dbname, localdbState.attributes.remoteurl).on('change', function(info) {
        return console.log("- change " + (JSON.stringify(info)));
      }).on('complete', function(info) {
        var err;
        console.log("- complete " + (JSON.stringify(info)));
        if (info.ok && (info.last_seq != null)) {
          console.log("update " + dbname + " syncedSeq: " + info.last_seq + ", lastSeq: " + localdbState.attributes.lastSeq);
          localdbState.set({
            syncedSeq: info.last_seq,
            hasLocalChanges: info.last_seq < localdbState.attributes.lastSeq
          });
          try {
            localdbState.save();
          } catch (_error) {
            err = _error;
            console.log("Error saving localdbState " + localdbState.id + ": " + err.message);
          }
        }
        return setTimeout(recurse, 0);
      }).on('uptodate', function(info) {
        return console.log("- uptodate " + (JSON.stringify(info)));
      }).on('error', function(info) {
        console.log("- error " + (JSON.stringify(info)));
        return setTimeout(recurse, 0);
      });
    };

    SyncState.prototype.syncIncoming = function(localdbState) {
      var callfns, dbname, item, itemIds, query_params, recurse, _i, _len, _ref;
      if (localdbState.id !== localdb.currentInstanceid()) {
        return this.syncOutgoing(localdbState);
      }
      dbname = encodeURIComponent(localdbState.id);
      console.log("replicate " + localdbState.attributes.remoteurl + " to " + dbname + "...");
      recurse = (function(_this) {
        return function() {
          return _this.syncOutgoing(localdbState);
        };
      })(this);
      callfns = this.successfns.splice(0, this.successfns.length);
      _ref = localdb.currentConfig().items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        itemIds = item.id;
      }
      query_params = {
        itemIds: JSON.stringify(itemIds)
      };
      console.log("sync using app/clientsync " + (JSON.stringify(query_params)));
      return PouchDB.replicate(localdbState.attributes.remoteurl, dbname, {
        filter: 'app/clientsync',
        query_params: query_params
      }).on('change', function(info) {
        return console.log("- change " + (JSON.stringify(info)));
      }).on('complete', function(info) {
        var err, fn, _j, _len1;
        console.log("- complete " + (JSON.stringify(info)));
        for (_j = 0, _len1 = callfns.length; _j < _len1; _j++) {
          fn = callfns[_j];
          try {
            fn(info.ok);
          } catch (_error) {
            err = _error;
            console.log("Error calling sync success fn: " + err.message);
          }
        }
        return setTimeout(recurse, 0);
      }).on('uptodate', function(info) {
        return console.log("- uptodate " + (JSON.stringify(info)));
      }).on('error', function(info) {
        console.log("- error " + (JSON.stringify(info)));
        return setTimeout(recurse, 0);
      });
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
      editing: true,
      type: 'trackReview'
    };

    TrackReview.prototype.idAttribute = '_id';

    return TrackReview;

  })(Backbone.Model);

}).call(this);
}, "models/TrackReviewList": function(exports, require, module) {(function() {
  var TrackReview, TrackReviewList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TrackReview = require('models/TrackReview');

  module.exports = TrackReviewList = (function(_super) {
    __extends(TrackReviewList, _super);

    function TrackReviewList() {
      return TrackReviewList.__super__.constructor.apply(this, arguments);
    }

    TrackReviewList.prototype.model = TrackReview;

    TrackReviewList.prototype.pouch = {
      fetch: 'query',
      options: {
        listen: false,
        allDocs: {
          include_docs: true
        },
        query: {
          include_docs: true,
          fun: {
            map: function(doc) {
              if (doc._id.indexOf('trackreview:') === 0) {
                return emit(doc._id, null);
              }
            }
          }
        },
        changes: {
          include_docs: true,
          filter: function(doc) {
            return doc._deleted || doc._id.indexOf('trackreview:') === 0;
          }
        }
      }
    };

    TrackReviewList.prototype.parse = function(result) {
      console.log("parse " + (JSON.stringify(result)));
      return _.pluck(result.rows, 'doc');
    };

    return TrackReviewList;

  })(Backbone.Collection);

}).call(this);
}, "templates/BookletCover": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<div class="columns small-12 medium-6 large-4">\n  <h1>');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</h1>\n  ');
    
      if (this.coverurl != null) {
        __out.push('\n    <p><a href="#" class="do-open">\n      <img src="');
        __out.push(__sanitize(this.coverurl));
        __out.push('" width="80%" height="auto"/>\n    </a></p>\n  ');
      }
    
      __out.push('\n  <p><a href="#" class="button do-open">Open...</a></p>\n  <p>');
    
      __out.push(__sanitize(this.description));
    
      __out.push('</p>\n</div>\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/BookletPage": function(exports, require, module) {module.exports = function(__obj) {
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
      var item, _i, _len, _ref;
    
      __out.push('<nav class="top-bar" data-topbar>\n  <ul class="title-area">\n    <li class="name">\n      <h1><a href="#">');
    
      __out.push(__sanitize(this.booklet.title));
    
      __out.push('</a></h1>\n    </li>\n  </ul>\n</nav>\n<div class="row">\n  <div class="columns large-6 medium-8 small-12 toc">\n    <div class="toc-header"><!--\n      --><div class="toc-button do-back">Back<br></div><!--\n      --><div class="toc-button ');
    
      __out.push(__sanitize(this.prev != null ? "do-prev" : 'disabled'));
    
      __out.push('" ');
    
      __out.push(__sanitize(this.prev != null ? "data-page=" + this.prev : void 0));
    
      __out.push('>Previous<br></div><!--\n      --><div class="toc-button do-toc">Contents<br><div class="toc-hide">Hide</div><div class="toc-show">Show</div></div><!--\n      --><div class="toc-button ');
    
      __out.push(__sanitize(this.next != null ? "do-next" : 'disabled'));
    
      __out.push('" ');
    
      __out.push(__sanitize(this.next != null ? "data-page=" + this.next : void 0));
    
      __out.push('>Next<br></div><!--\n    --></div>\n    <div class="toc-body">\n      ');
    
      _ref = this.toc;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        __out.push('\n        <a href="#');
        __out.push(__sanitize(item.anchor));
        __out.push('" class="toc-link"><p class="toc-level-');
        __out.push(__sanitize(item.level));
        __out.push('">');
        __out.push(__sanitize(item.title));
        __out.push('</p></a>\n      ');
      }
    
      __out.push('\n    </div>\n  </div>\n  <div class="contentholder columns large-6 medium-8 small-12"></div>\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/CacheStateWidget": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n  <div class="columns small-12 large-12">\n    <div data-alert class="alert-box clearfix ');
    
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
}}, "templates/Home": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('  <nav class="top-bar" data-topbar>\n    <ul class="title-area">\n      <li class="name">\n        <h1><a href="#">OfflineApp</a></h1>\n      </li>\n      <!-- Remove the class "menu-icon" to get rid of menu icon. Take out "Menu" to just have icon alone -->\n      <!-- <li class="toggle-topbar menu-icon"><a href="#"><span>Menu</span></a></li> -->\n    </ul>\n  </nav>\n\n');
    
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
    
      __out.push('\n  lastSeq:');
    
      __out.push(__sanitize(this.lastSeq));
    
      __out.push(', maxSeq:');
    
      __out.push(__sanitize(this.maxSeq));
    
      __out.push(', syncedSeq:');
    
      __out.push(__sanitize(this.syncedSeq));
    
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
      __out.push('\n  <div class="columns small-12 large-12">\n    <div data-alert class="alert-box clearfix ');
    
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
      __out.push('\n<div class="columns small-12 large-12">\n  <h1>');
    
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
}}, "templates/TrackReviewInList": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('\n<div class="columns small-12 large-12">\n  <div class="rating">');
    
      __out.push(this.rating > 0 ? '&#9733;' : '&#9734;');
    
      __out.push('<!--\n  -->');
    
      __out.push(this.rating > 1 ? '&#9733;' : '&#9734;');
    
      __out.push('<!--\n  -->');
    
      __out.push(this.rating > 2 ? '&#9733;' : '&#9734;');
    
      __out.push('<!--\n  -->');
    
      __out.push(this.rating > 3 ? '&#9733;' : '&#9734;');
    
      __out.push('<!--\n  -->');
    
      __out.push(this.rating > 4 ? '&#9733;' : '&#9734;');
    
      __out.push('</div>\n  ');
    
      if ((this.comment != null) && this.comment.length > 0) {
        __out.push('\n    <p name="comment">');
        __out.push(__sanitize(this.comment));
        __out.push('</p>\n  ');
      }
    
      __out.push('\n</div>\n\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "views/Booklet": function(exports, require, module) {(function() {
  var BookletView, templateBookletPage,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateBookletPage = require('templates/BookletPage');

  module.exports = BookletView = (function(_super) {
    __extends(BookletView, _super);

    function BookletView() {
      this.showPage = __bind(this.showPage, this);
      this.back = __bind(this.back, this);
      this.showHideToc = __bind(this.showHideToc, this);
      this.nextPrev = __bind(this.nextPrev, this);
      this.tocLink = __bind(this.tocLink, this);
      this.anyLink = __bind(this.anyLink, this);
      this.render = __bind(this.render, this);
      return BookletView.__super__.constructor.apply(this, arguments);
    }

    BookletView.prototype.tagName = 'div';

    BookletView.prototype.initialize = function() {
      return this.render();
    };

    BookletView.prototype.render = function() {
      var $el, ahtml, anchor, anchorPrefix, ei, el, els, err, html, i, nextAnchor, nodeName, page, pages, title, toc, _i, _j, _len, _len1;
      pages = [];
      toc = [];
      try {
        console.log("Booklet: " + this.model.attributes.content);
        html = $.parseHTML(this.model.attributes.content);
        page = [];
        nextAnchor = 0;
        anchorPrefix = this.model.id.replace(':', '_') + '_';
        for (ei = _i = 0, _len = html.length; _i < _len; ei = ++_i) {
          el = html[ei];
          $el = $(el);
          nodeName = el.nodeName != null ? String(el.nodeName).toLowerCase() : el.nodeName;
          if (el.nodeType === 1 && nodeName === 'div' && $el.hasClass('mediahubcolumn')) {
            if (page.length > 0) {
              pages.push(page);
              page = [];
            }
          } else if (el.nodeType === 1 && nodeName === 'div' && $el.hasClass('mediahubcomment')) {

          } else if (el.nodeType === 1 && nodeName === 'h1') {
            title = $el.html();
            anchor = anchorPrefix + (pages.length + 1) + '_' + (nextAnchor++);
            toc.push({
              level: 1,
              title: title,
              page: pages.length,
              anchor: anchor
            });
            ahtml = $.parseHTML("<a id='" + anchor + "'><h1>" + title + "</h1></a>");
            page.push(ahtml[0]);
          } else if (el.nodeType === 1 && nodeName === 'h2') {
            title = $el.html();
            anchor = anchorPrefix + (pages.length + 1) + '_' + (nextAnchor++);
            toc.push({
              level: 2,
              title: title,
              page: pages.length,
              anchor: anchor
            });
            ahtml = $.parseHTML("<a id='" + anchor + "'><h2>" + title + "</h2></a>");
            page.push(ahtml[0]);
          } else if (el.nodeType === 3 && (el.data != null) && el.data.trim().length === 0) {

          } else {
            if (page.length === 0) {
              title = "page " + (pages.length + 1);
              anchor = anchorPrefix + (pages.length + 1) + '_';
              toc.push({
                level: 0,
                title: title,
                page: pages.length,
                anchor: anchor
              });
              ahtml = $.parseHTML("<a id='" + anchor + "'><h1>" + title + "</h1></a>");
              page.push(ahtml[0]);
            }
            page.push(el);
          }
        }
        if (page.length > 0) {
          pages.push(page);
          page = [];
        }
      } catch (_error) {
        err = _error;
        console.log("Error building booklet: " + err.message);
        if (pages.length === 0) {
          pages.push($.parseHTML("<p>Sorry, there was a problem viewing this book; please try downloading it again.</p>"));
        }
      }
      if (pages.length === 0) {
        pages.push($.parseHTML("<p>This booklet has no pages.</p>"));
      }
      for (i = _j = 0, _len1 = pages.length; _j < _len1; i = ++_j) {
        page = pages[i];
        els = templateBookletPage({
          booklet: this.model.attributes,
          toc: toc,
          next: i + 1 < pages.length ? i + 2 : null,
          prev: i > 0 ? i : null
        });
        el = document.createElement('div');
        $el = $(el);
        el.id = "" + (this.model.id.replace(':', '_')) + "_p" + (i + 1);
        $el.addClass('booklet-page');
        if (i > 0) {
          $el.addClass('hide');
        }
        $el.append(els);
        $('.contentholder', $el).append(page);
        console.log("adding page " + $el);
        this.$el.append($el);
      }
      return this;
    };

    BookletView.prototype.events = {
      "click .toc-link": "tocLink",
      "click .do-next": "nextPrev",
      "click .do-prev": "nextPrev",
      "click .do-back": "back",
      "click .do-toc": "showHideToc",
      "click a": "anyLink"
    };

    BookletView.prototype.anyLink = function(ev) {
      return console.log("anyLink " + ($(ev.currentTarget).attr('href')));
    };

    BookletView.prototype.tocLink = function(ev) {
      var hash, href, parts;
      ev.preventDefault();
      href = $(ev.currentTarget).attr('href');
      console.log("toc link " + href);
      parts = href.split('_');
      if (parts.length === 4) {
        hash = '#booklet/' + encodeURIComponent(this.model.id) + '/' + parts[2] + '/' + parts[3];
        if (location.hash === hash) {
          return this.showPage(parts[2], parts[3]);
        } else {
          return window.router.navigate(hash, {
            trigger: true
          });
        }
      } else {
        return console.log("error: badly formed booklet anchor " + href + " - " + parts.length + " parts");
      }
    };

    BookletView.prototype.nextPrev = function(ev) {
      var page;
      page = $(ev.currentTarget).attr('data-page');
      if (page != null) {
        window.router.navigate('#booklet/' + encodeURIComponent(this.model.id) + '/' + page, {
          trigger: true
        });
        return this.showPage(page);
      } else {
        return console.log("next/prev but can't find data-page attribute");
      }
    };

    BookletView.prototype.showHideToc = function() {
      console.log("show/hide TOC");
      return $('.toc', this.$el).toggleClass('toc-toggle');
    };

    BookletView.prototype.back = function() {
      console.log("back");
      return window.history.back();
    };

    BookletView.prototype.showPage = function(page, anchor) {
      console.log("Booklet " + this.model.id + " showPage " + page + " " + anchor);
      $('.booklet-page', this.$el).addClass('hide');
      $('#' + ("" + (this.model.id.replace(':', '_')) + "_p" + page), this.$el).removeClass('hide');
      if (anchor != null) {
        return $('html, body').animate({
          scrollTop: $('#' + ("" + (this.model.id.replace(':', '_')) + "_" + page + "_" + anchor), this.$el).offset().top
        }, 500);
      } else {
        return $('html, body').animate({
          scrollTop: 0
        }, 500);
      }
    };

    return BookletView;

  })(Backbone.View);

}).call(this);
}, "views/BookletCover": function(exports, require, module) {(function() {
  var BookletCoverView, templateBookletCover,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateBookletCover = require('templates/BookletCover');

  module.exports = BookletCoverView = (function(_super) {
    __extends(BookletCoverView, _super);

    function BookletCoverView() {
      this.open = __bind(this.open, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return BookletCoverView.__super__.constructor.apply(this, arguments);
    }

    BookletCoverView.prototype.tagName = 'div';

    BookletCoverView.prototype.className = 'row';

    BookletCoverView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    BookletCoverView.prototype.template = function(d) {
      return templateBookletCover(d);
    };

    BookletCoverView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    BookletCoverView.prototype.events = {
      'click .do-open': 'open'
    };

    BookletCoverView.prototype.open = function(ev) {
      console.log("open booklet " + this.model.id);
      ev.preventDefault();
      return window.router.navigate('#booklet/' + encodeURIComponent(this.model.id), {
        trigger: true
      });
    };

    return BookletCoverView;

  })(Backbone.View);

}).call(this);
}, "views/CacheStateWidget": function(exports, require, module) {(function() {
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
}, "views/Home": function(exports, require, module) {(function() {
  var HomeView, templateHome,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateHome = require('templates/Home');

  module.exports = HomeView = (function(_super) {
    __extends(HomeView, _super);

    function HomeView() {
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return HomeView.__super__.constructor.apply(this, arguments);
    }

    HomeView.prototype.tagName = 'div';

    HomeView.prototype.initialize = function() {
      return this.render();
    };

    HomeView.prototype.template = function(d) {
      return templateHome(d);
    };

    HomeView.prototype.render = function() {
      this.$el.html(this.template(this.model));
      return this;
    };

    return HomeView;

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

    LocaldbStateInListView.prototype.className = 'columns small-12 large-12';

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
        view.remove();
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
      console.log("Sync!");
      ev.preventDefault();
      return this.model.doSync();
    };

    return SyncStateWidget;

  })(Backbone.View);

}).call(this);
}, "views/Track": function(exports, require, module) {(function() {
  var TrackReviewListView, TrackReviewView, TrackView, templateTrack,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateTrack = require('templates/Track');

  TrackReviewView = require('views/TrackReview');

  TrackReviewListView = require('views/TrackReviewList');

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
      this.trackReviewListView = new TrackReviewListView({
        model: this.model.trackReviewList
      });
      return this.render();
    };

    TrackView.prototype.template = function(d) {
      return templateTrack(d);
    };

    TrackView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      this.$el.append(this.trackReviewView.el);
      this.$el.append(this.trackReviewListView.el);
      return this;
    };

    TrackView.prototype.remove = function() {
      this.trackReviewView.remove();
      this.trackReviewListView.remove();
      return TrackView.__super__.remove.call(this);
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

    TrackReviewView.prototype.className = 'columns small-12 large-12';

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
}, "views/TrackReviewInList": function(exports, require, module) {(function() {
  var TrackReviewInListView, templateTrackReviewInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateTrackReviewInList = require('templates/TrackReviewInList');

  module.exports = TrackReviewInListView = (function(_super) {
    __extends(TrackReviewInListView, _super);

    function TrackReviewInListView() {
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return TrackReviewInListView.__super__.constructor.apply(this, arguments);
    }

    TrackReviewInListView.prototype.tagName = 'div';

    TrackReviewInListView.prototype.className = 'row';

    TrackReviewInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    TrackReviewInListView.prototype.template = function(d) {
      return templateTrackReviewInList(d);
    };

    TrackReviewInListView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    return TrackReviewInListView;

  })(Backbone.View);

}).call(this);
}, "views/TrackReviewList": function(exports, require, module) {(function() {
  var TrackReview, TrackReviewInListView, TrackReviewListView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TrackReview = require('models/TrackReview');

  TrackReviewInListView = require('views/TrackReviewInList');

  module.exports = TrackReviewListView = (function(_super) {
    __extends(TrackReviewListView, _super);

    function TrackReviewListView() {
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return TrackReviewListView.__super__.constructor.apply(this, arguments);
    }

    TrackReviewListView.prototype.tagName = 'div';

    TrackReviewListView.prototype.className = 'track-review-list columns large-12 small-12';

    TrackReviewListView.prototype.initialize = function() {
      this.listenTo(this.model, 'add', this.add);
      this.listenTo(this.model, 'remove', this.remove);
      return this.render();
    };

    TrackReviewListView.prototype.template = function(d) {};

    TrackReviewListView.prototype.render = function() {
      var views;
      this.$el.append('<h2>All Reviews</h2>');
      views = [];
      this.model.forEach(this.add);
      return this;
    };

    TrackReviewListView.prototype.views = [];

    TrackReviewListView.prototype.add = function(item) {
      var view;
      console.log("TrackReviewListView add " + item.id);
      view = new TrackReviewInListView({
        model: item
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    TrackReviewListView.prototype.remove = function(item) {
      var i, view, _i, _len, _ref;
      console.log("TrackReviewListView remove " + item.id);
      _ref = this.views;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        view = _ref[i];
        if (!(view.model.id === item.id)) {
          continue;
        }
        console.log("remove view");
        view.remove();
        this.views.splice(i, 1);
        return;
      }
    };

    return TrackReviewListView;

  })(Backbone.View);

}).call(this);
}});
