<?php
/**
 * The template for displaying a single wototo app. From Couchapp/templates/app.html
 */

// Start the loop.
while ( have_posts() ) : the_post();

echo '<?'?>xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
    "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" manifest="<?php echo 'TODO manifest/'.$post->ID ?>">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title><?php echo the_title() ?></title>
	<!-- just so we know... -->
	<meta name="mediahub-appid" content="<?php echo $post->ID ?>" />
	<meta name="mediahub-shareurl" content="${@shareurl}" />
	<meta name="wototo-wordpress-files" content="<?php echo plugins_url( 'wototo' ) ?>" />
	<meta name="wototo-wordpress-ajax" content="<?php echo admin_url( 'admin-ajax.php' ) ?>" />
        <link rel="stylesheet" href="<?php echo plugins_url( 'vendor/leaflet/leaflet.css', __FILE__ ) ?>" />
	<link rel="stylesheet" href="<?php echo plugins_url( 'stylesheets/offline.css', __FILE__ ) ?>" />
	<!-- IE -->
	<link rel="shortcut icon" type="image/x-icon" href="${@faviconurl}" />
	<!-- other browsers -->
	<link rel="icon" type="image/x-icon" href="${@faviconurl}" />
	<script src="<?php plugins_url( 'vendor/modernizr/modernizr.js' ) ?>"></script>
</head>
<body>
    <div id="loading-alert" class="row">
      <div class="large-12 columns">
        <div data-alert class="alert-box">Loading offlineApp app...
          <br/>If this message remains after 10 seconds then there has probably been a problem loading or running the app - please try reloading it, or try it on a different device or in a difference browser
        </div>
      </div>
    </div>
    <div id="workingModal" class="working-modal hide">
      <img src="<?php echo plugins_url( 'icons/loading.gif', __FILE__ ) ?>"/>
    </div>
    <div id="tagModalHolder" class="reveal-modal" data-reveal></div>

    <script src="<?php echo plugins_url( 'vendor/jquery/dist/jquery.min.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/foundation/js/foundation.min.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/foundation/js/foundation/foundation.reveal.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/foundation/js/foundation/foundation.offcanvas.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/foundation/js/foundation/foundation.topbar.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/underscore/underscore.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/backbone/backbone.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/pouchdb/dist/pouchdb-3.0.2.min.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/backbone-pouchdb/dist/backbone-pouch.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/filesaver/FileSaver.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/node-uuid/uuid.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'js/offlineapp.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'clientid.js', __FILE__ ) ?>"></script>
    <script src="<?php echo plugins_url( 'vendor/leaflet/leaflet.js', __FILE__ ) ?>"></script>
    <script type="text/javascript" charset="utf-8">
    $(document).ready(function() 
    {
      // general start-up
      // done in app: $(document).foundation();
      console.log("Running app...");
      var App = require("app");
      App.init();
    });
    </script>
</body>
</html><?php // End the loop.
endwhile;

