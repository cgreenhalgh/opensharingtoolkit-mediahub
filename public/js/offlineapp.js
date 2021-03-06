
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
  var App, BookletView, CacheStateWidgetView, HomeView, HtmlView, ListView, PlaceView, Router, ThingListView, ThingView, appcache, appid, checkConfig, checkThing, currentView, dburl, items, loadThing, loadThings, localdb, makeThing, refresh, topLevelThings,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  appcache = require('appcache');

  HomeView = require('views/Home');

  CacheStateWidgetView = require('views/CacheStateWidget');

  BookletView = require('views/Booklet');

  ThingView = require('views/Thing');

  PlaceView = require('views/Place');

  HtmlView = require('views/Html');

  ListView = require('views/List');

  ThingListView = require('views/ThingList');

  localdb = require('localdb');

  appid = null;

  dburl = null;

  items = {};

  currentView = null;

  topLevelThings = new Backbone.Collection();

  Router = (function(_super) {
    __extends(Router, _super);

    function Router() {
      return Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "": "entries",
      "#": "entries",
      "thing/:id": "thing",
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

    Router.prototype.thing = function(id) {
      var thing;
      console.log("show thing " + id);
      this.removeCurrentView();
      $('#home').hide();
      thing = items[id];
      if (thing == null) {
        alert("Sorry, could not find thing " + id);
        this.navigate('#', {
          trigger: true,
          replace: true
        });
        return false;
      }
      if (thing.attributes.type === 'booklet') {
        currentView = new BookletView({
          model: thing
        });
      } else if (thing.attributes.type === 'place') {
        currentView = new PlaceView({
          model: thing
        });
      } else if (thing.attributes.type === 'html') {
        currentView = new HtmlView({
          model: thing
        });
      } else if (thing.attributes.type === 'list') {
        currentView = new ListView({
          model: thing
        });
      } else if (thing.attributes.type != null) {
        currentView = new ThingView({
          model: thing
        });
      } else {
        alert("Sorry, not sure how to display " + id);
        this.navigate('#', {
          trigger: true,
          replace: true
        });
        return false;
      }
      $('body').append(currentView.el);
      return true;
    };

    Router.prototype.bookletPage = function(id, page, anchor) {
      if ((currentView == null) || currentView.model.id !== id) {
        if (!this.thing(id)) {
          return;
        }
      }
      return currentView.showPage(page, anchor);
    };

    return Router;

  })(Backbone.Router);

  makeThing = function(data, collection) {
    var err, thing;
    try {
      thing = new Backbone.Model(data);
      if (thing.id) {
        items[thing.id] = thing;
      }
      collection.add(thing);
      if (data.thingIds != null) {
        console.log("create new thing collection for " + thing.id);
        thing.things = new Backbone.Collection();
        return loadThings(data, thing.things);
      }
    } catch (_error) {
      err = _error;
      return console.log("error making thing: " + err.message + ": " + data + "\n" + err.stack);
    }
  };

  checkThing = function(data, collection) {
    var err;
    try {
      data = JSON.parse(data);
      if (data.type != null) {
        return makeThing(data, collection);
      } else {
        return console.log("unknown item type " + data.type + " - ignored");
      }
    } catch (_error) {
      err = _error;
      return console.log("error parsing thing: " + err.message + ": " + data);
    }
  };

  loadThing = function(thingId, collection) {
    console.log("load thing " + thingId);
    return $.ajax(dburl + "/" + encodeURIComponent(thingId), {
      success: function(data) {
        return checkThing(data, collection);
      },
      dataType: "text",
      error: function(xhr, status, err) {
        console.log("get thing error " + xhr.status + ": " + err.message);
        if (xhr.status === 0 && xhr.responseText) {
          return checkThing(xhr.responseText, collection);
        }
      }
    });
  };

  loadThings = function(app, collection) {
    var thingId, _i, _len, _ref, _results;
    _ref = app.thingIds;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      thingId = _ref[_i];
      _results.push(loadThing(thingId, collection));
    }
    return _results;
  };

  checkConfig = function(app) {
    var err;
    console.log("config(app): " + app);
    try {
      app = JSON.parse(app);
      return loadThings(app, topLevelThings);
    } catch (_error) {
      err = _error;
      return console.log("error parsing app config: " + err.message + ": " + app + " - " + err.stack);
    }
  };

  refresh = function() {
    console.log("refresh " + dburl + " " + appid);
    topLevelThings.reset();
    return $.ajax(dburl + "/" + encodeURIComponent(appid), {
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
      var appcacheWidget, exported, home, ix, path, router, topLevelThingsView;
      home = new HomeView({
        model: {}
      });
      home.el.id = 'home';
      $('body').append(home.el);
      appid = $('meta[name="mediahub-appid"]').attr('content');
      exported = $('meta[name="mediahub-exported"]').attr('content');
      console.log("OfflineApp starting... app.id=" + appid + ", exported=" + exported);
      dburl = location.href;
      if (dburl.indexOf('/_design/') >= 0) {
        dburl = dburl.substring(0, dburl.indexOf('/_design/'));
      }
      if (exported === 'true') {
        $.ajaxSetup({
          beforeSend: function(xhr, options) {
            var eix, six;
            if ((options.url != null) && options.url.indexOf(dburl) === 0) {
              six = options.url.lastIndexOf('/');
              eix = options.url.lastIndexOf('.');
              if (eix < 0 || eix < six) {
                console.log("exported, beforeSend " + options.type + " " + options.url + ", try .json");
                options.url = options.url + '.json';
              }
            } else if (options.url != null) {
              console.log("unchanged ajax url " + options.url);
            }
            return true;
          }
        });
      }
      appcacheWidget = new CacheStateWidgetView({
        model: appcache.state
      });
      $('#home').append(appcacheWidget.el);
      topLevelThingsView = new ThingListView({
        model: topLevelThings
      });
      topLevelThingsView.render();
      $('#home').append(topLevelThingsView.el);
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
      $('#loading-alert').hide();
      return refresh(dburl, appid);
    }
  };

  module.exports = App;

}).call(this);
}, "appcache": function(exports, require, module) {(function() {
  var CacheState, appCache, check_for_update, event, lastState, onUpdate, on_cache_event, state, updateState, _i, _len, _ref;

  CacheState = require('models/CacheState');

  state = new CacheState();

  module.exports.state = state;

  onUpdate = [];

  module.exports.onUpdate = function(cb) {
    onUpdate.push(cb);
    return check_for_update();
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
            message: 'A new version has been downloaded; reload this page to use it',
            updateReady: true
          };
        case appCache.CHECKING:
          return {
            alertType: 'info',
            message: 'Checking for a new version'
          };
        case appCache.DOWNLOADING:
          return {
            alertType: 'info',
            message: 'Downloading a new version'
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
    if (appCache.status === lastState) {
      return false;
    }
    lastState = appCache.status;
    console.log('AppCache status = ' + appCache.status);
    updateState();
    return check_for_update();
  };

  check_for_update = function() {
    var cb, err, _i, _len, _results;
    if (onUpdate.length > 0 && appCache.status === appCache.UPDATEREADY) {
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

  _ref = "cached downloading checking error noupdate obsolete progress updateready".split(' ');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    appCache.addEventListener(event, on_cache_event, false);
  }

  on_cache_event();

}).call(this);
}, "client": function(exports, require, module) {(function() {
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
    
      __out.push('</a></h1>\n    </li>\n  </ul>\n</nav>\n<div class="row">\n  <div class="columns large-6 medium-8 small-12 toc">\n    <div class="toc-header"><!--\n      --><div class="toc-button do-back"><img src="../../icons/back-black.png"/>Back</div><!--\n      --><div class="toc-button ');
    
      __out.push(__sanitize(this.prev != null ? "do-prev" : 'disabled'));
    
      __out.push('" ');
    
      __out.push(__sanitize(this.prev != null ? "data-page=" + this.prev : void 0));
    
      __out.push('><img src="../../icons/arrow-l-black.png"/>Previous</div><!--\n      --><div class="toc-button do-toc"><img src="../../icons/bars-black.png"/><div class="toc-fixed">Contents</div><div class="toc-hide">Hide TOC</div><div class="toc-show">Show TOC</div></div><!--\n      --><div class="toc-button ');
    
      __out.push(__sanitize(this.next != null ? "do-next" : 'disabled'));
    
      __out.push('" ');
    
      __out.push(__sanitize(this.next != null ? "data-page=" + this.next : void 0));
    
      __out.push('><img src="../../icons/arrow-r-black.png"/>Next<br></div><!--\n    --></div>\n    <div class="toc-body">\n      ');
    
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
      __out.push('<nav class="top-bar" data-topbar>\n  <ul class="title-area">\n    <li class="name">\n      <h1><a href="#">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</a></h1>\n    </li>\n  </ul>\n</nav>\n<div class="row">\n  <div class="columns large-12 small-12">\n    ');
    
      __out.push(this.html);
    
      __out.push('\n  </div>\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "templates/List": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('<nav class="top-bar" data-topbar>\n  <ul class="title-area">\n    <li class="name">\n      <h1><a href="#">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</a></h1>\n    </li>\n  </ul>\n</nav>\n<div class="row">\n  <div class="columns large-12 small-12">\n    ');
    
      __out.push(this.description);
    
      __out.push('\n  </div>\n</div>\n<div class="list-holder"></div>\n');
    
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
}}, "templates/Place": function(exports, require, module) {module.exports = function(__obj) {
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
      __out.push('<nav class="top-bar" data-topbar>\n  <ul class="title-area">\n    <li class="name">\n      <h1><a href="#">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</a></h1>\n    </li>\n  </ul>\n</nav>\n<div class="row">\n  <div class="columns large-4 medium-6 small-12">\n    <div class="stretch-100 map-parent"><div class="stretch-child"><div class="place-map" tabindex="0"></div></div></div>\n  </div>\n  <div class="columns large-8 medium-6 small-12">\n    <div class="place-address">');
    
      __out.push(__sanitize(this.address));
    
      __out.push('</div>\n    ');
    
      __out.push(this.description);
    
      __out.push('\n  </div>\n</div>\n');
    
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
      __out.push('<nav class="top-bar" data-topbar>\n  <ul class="title-area">\n    <li class="name">\n      <h1><a href="#">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</a></h1>\n    </li>\n  </ul>\n</nav>\n<div class="row">\n  <div class="columns large-12 small-12">\n    ');
    
      __out.push(this.description);
    
      __out.push('\n  </div>\n</div>\n');
    
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
      __out.push('\n<div class="thing-in-list-holder">\n  ');
    
      if ((this.iconurl != null) && this.iconurl !== '') {
        __out.push('\n    <div class="thing-in-list-icon"><img src="');
        __out.push(__sanitize(this.iconurl));
        __out.push('"/></div>\n  ');
      }
    
      __out.push('\n  <div class="thing-in-list-title">');
    
      __out.push(__sanitize(this.title));
    
      __out.push('</div>\n  <div class="thing-in-list-buttons"><!--\n    --><div class="thing-in-list-button">1</div><!--\n    --><div class="thing-in-list-button">2</div><!--\n  --></div>\n  <div class="thing-in-list-clear"></div>\n</div>\n\n\n');
    
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
}, "views/List": function(exports, require, module) {(function() {
  var ListView, ThingListView, ThingView, templateList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateList = require('templates/List');

  ThingListView = require('views/ThingList');

  ThingView = require('views/Thing');

  module.exports = ListView = (function(_super) {
    __extends(ListView, _super);

    function ListView() {
      this.remove = __bind(this.remove, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ListView.__super__.constructor.apply(this, arguments);
    }

    ListView.prototype.template = function(d) {
      return templateList(d);
    };

    ListView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      if (this.model.things != null) {
        console.log("render ListView adding ThingListView");
        this.listView = new ThingListView({
          model: this.model.things
        });
        this.listView.render();
        this.$el.append(this.listView.el);
      } else if (this.model.attributes.thingIds != null) {
        console.log("error: render ListView without @things (thingsIds=" + this.model.attributes.thingIds + ")");
      }
      return this;
    };

    ListView.prototype.remove = function() {
      if (this.listView) {
        this.listView.remove();
      }
      return ListView.__super__.remove.call(this);
    };

    return ListView;

  })(ThingView);

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
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return LocaldbStateListView.__super__.constructor.apply(this, arguments);
    }

    LocaldbStateListView.prototype.tagName = 'div';

    LocaldbStateListView.prototype.className = 'localdb-state-list row';

    LocaldbStateListView.prototype.initialize = function() {
      this.views = [];
      this.listenTo(this.model, 'add', this.addItem);
      return this.listenTo(this.model, 'remove', this.removeItem);
    };

    LocaldbStateListView.prototype.template = function(d) {};

    LocaldbStateListView.prototype.render = function() {
      this.model.forEach(this.addItem);
      return this;
    };

    LocaldbStateListView.prototype.addItem = function(file) {
      var view;
      console.log("LocaldbStateListView add " + file.attributes._id);
      view = new LocaldbStateInListView({
        model: file
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    LocaldbStateListView.prototype.removeItem = function(file) {
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
}, "views/Place": function(exports, require, module) {(function() {
  var PlaceView, maxZoom, maxZoomIn, maxZoomOut, myIcon, templatePlace,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templatePlace = require('templates/Place');

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

  maxZoomIn = 2;

  maxZoomOut = 5;

  module.exports = PlaceView = (function(_super) {
    __extends(PlaceView, _super);

    function PlaceView() {
      this.remove = __bind(this.remove, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return PlaceView.__super__.constructor.apply(this, arguments);
    }

    PlaceView.prototype.tagName = 'div';

    PlaceView.prototype.initialize = function() {
      return this.render();
    };

    PlaceView.prototype.template = function(d) {
      return templatePlace(d);
    };

    PlaceView.prototype.render = function() {
      var err, f;
      this.$el.html(this.template(this.model.attributes));
      f = (function(_this) {
        return function() {
          var exported, layer, mapEl, mapUrl, options, re;
          mapEl = $('.place-map', _this.$el).get(0);
          options = {
            fadeAnimation: false,
            dragging: false,
            keyboard: false
          };
          _this.map = L.map(mapEl, options).setView([_this.model.attributes.lat, _this.model.attributes.lon], _this.model.attributes.zoom);
          mapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
          exported = $('meta[name="mediahub-exported"]').attr('content');
          if (exported === 'true') {
            mapUrl = "../../../../cache/{s}/tile/osm/org/{z}/{x}/{y}.png";
            console.log("Using export map url " + mapUrl);
          }
          layer = L.tileLayer(mapUrl, {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            maxZoom: Math.min(maxZoom, _this.model.attributes.zoom + maxZoomIn),
            minZoom: Math.max(0, _this.model.attributes.zoom - maxZoomOut)
          });
          layer.addTo(_this.map);
          _this.marker = L.marker([_this.model.attributes.lat, _this.model.attributes.lon], {
            icon: myIcon
          });
          _this.marker.addTo(_this.map);
          _this.map.on('zoomend', function() {
            return _this.map.setView([_this.model.attributes.lat, _this.model.attributes.lon]);
          });
          console.log("(hopefully) created map");
          re = function() {
            if (_this.map != null) {
              console.log("invalidateSize");
              return _this.map.invalidateSize();
            }
          };
          return setTimeout(re, 1000);
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
      setTimeout(f, 0);
      return this;
    };

    PlaceView.prototype.remove = function() {
      var err;
      if (this.map) {
        try {
          this.map.remove();
          this.map = null;
        } catch (_error) {
          err = _error;
          console.log("error removing place map: " + err.message);
        }
      }
      return PlaceView.__super__.remove.call(this);
    };

    return PlaceView;

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
}, "views/Thing": function(exports, require, module) {(function() {
  var ThingView, templateThing,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThing = require('templates/Thing');

  module.exports = ThingView = (function(_super) {
    __extends(ThingView, _super);

    function ThingView() {
      this.back = __bind(this.back, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingView.__super__.constructor.apply(this, arguments);
    }

    ThingView.prototype.tagName = 'div';

    ThingView.prototype.initialize = function() {
      return this.render();
    };

    ThingView.prototype.template = function(d) {
      return templateThing(d);
    };

    ThingView.prototype.render = function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    };

    ThingView.prototype.back = function() {
      console.log("back");
      return window.history.back();
    };

    return ThingView;

  })(Backbone.View);

}).call(this);
}, "views/ThingInList": function(exports, require, module) {(function() {
  var ThingInListView, templateThingInList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  templateThingInList = require('templates/ThingInList');

  module.exports = ThingInListView = (function(_super) {
    __extends(ThingInListView, _super);

    function ThingInListView() {
      this.view = __bind(this.view, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return ThingInListView.__super__.constructor.apply(this, arguments);
    }

    ThingInListView.prototype.tagName = 'div';

    ThingInListView.prototype.className = 'thing-in-list';

    ThingInListView.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    ThingInListView.prototype.template = function(d) {
      return templateThingInList(d);
    };

    ThingInListView.prototype.render = function() {
      var iconurl;
      console.log("render ThingInList " + this.model.attributes._id + ": " + this.model.attributes.title);
      iconurl = this.model.attributes.iconurl;
      if ((iconurl == null) || iconurl === '') {
        iconurl = this.model.attributes.imageurl;
      }
      if ((iconurl == null) || iconurl === '') {
        if (this.model.attributes.type != null) {
          iconurl = "../../icons/" + this.model.attributes.type + ".png";
        }
      }
      this.$el.html(this.template(_.extend({}, this.model.attributes, {
        iconurl: iconurl
      })));
      return this;
    };

    ThingInListView.prototype.events = {
      "click": "view"
    };

    ThingInListView.prototype.view = function(ev) {
      var id, ix, type;
      console.log("view " + this.model.attributes._id);
      ev.preventDefault();
      id = this.model.id;
      ix = id.indexOf(':');
      type = ix > 0 ? id.substring(0, ix) : 'unknown';
      return window.router.navigate("#thing/" + (encodeURIComponent(this.model.id)), {
        trigger: true
      });
    };

    return ThingInListView;

  })(Backbone.View);

}).call(this);
}, "views/ThingList": function(exports, require, module) {(function() {
  var ThingInListView, ThingListView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ThingInListView = require('views/ThingInList');

  module.exports = ThingListView = (function(_super) {
    __extends(ThingListView, _super);

    function ThingListView() {
      this.remove = __bind(this.remove, this);
      this.reset = __bind(this.reset, this);
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.render = __bind(this.render, this);
      return ThingListView.__super__.constructor.apply(this, arguments);
    }

    ThingListView.prototype.tagName = 'div';

    ThingListView.prototype.className = 'row';

    ThingListView.prototype.initialize = function() {
      this.views = [];
      this.listenTo(this.model, 'add', this.addItem);
      this.listenTo(this.model, 'remove', this.removeItem);
      return this.listenTo(this.model, 'reset', this.reset);
    };

    ThingListView.prototype.render = function() {
      this.model.forEach(this.addItem);
      return this;
    };

    ThingListView.prototype.addItem = function(thing) {
      var view;
      console.log("ThingListView add " + thing.id);
      view = new ThingInListView({
        model: thing
      });
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

    ThingListView.prototype.reset = function() {
      var view, views, _i, _len, _ref;
      _ref = this.views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        view.remove();
      }
      return views = [];
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

    return ThingListView;

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
      this.removeItem = __bind(this.removeItem, this);
      this.addItem = __bind(this.addItem, this);
      this.render = __bind(this.render, this);
      this.template = __bind(this.template, this);
      return TrackReviewListView.__super__.constructor.apply(this, arguments);
    }

    TrackReviewListView.prototype.tagName = 'div';

    TrackReviewListView.prototype.className = 'track-review-list columns large-12 small-12';

    TrackReviewListView.prototype.initialize = function() {
      this.views = [];
      this.listenTo(this.model, 'add', this.addItem);
      this.listenTo(this.model, 'remove', this.removeItem);
      return this.render();
    };

    TrackReviewListView.prototype.template = function(d) {};

    TrackReviewListView.prototype.render = function() {
      this.$el.append('<h2>All Reviews</h2>');
      this.model.forEach(this.addItem);
      return this;
    };

    TrackReviewListView.prototype.addItem = function(item) {
      var view;
      console.log("TrackReviewListView add " + item.id);
      view = new TrackReviewInListView({
        model: item
      });
      this.$el.append(view.$el);
      return this.views.push(view);
    };

    TrackReviewListView.prototype.removeItem = function(item) {
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
