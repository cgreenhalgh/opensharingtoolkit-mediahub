<?php
/**
 * Plugin Name: wototo
 * Plugin URI: https://github.com/cgreenhalgh/opensharingtoolkit-mediahub/tree/master/docs/wordpress.md
 * Description: Create simple HTML5 web apps from wordpress content (pages and posts). The web apps are intended for use on recent smart phones and tablets.
 * Version: 0.1.6
 * Author: Chris Greenhalgh
 * Author URI: http://www.cs.nott.ac.uk/~cmg/
 * Network: true
 * License: BSD 2-Clause
 */
/* 
Copyright (c) 2015, The University of Nottingham
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
// wander anywhere map post  -> wototo place
define( "DEFAULT_ZOOM", 15 );
define( "WOTOTO_VERSION", "0.1.6" );

add_action( 'init', 'wototo_create_post_types' );
//Register the app post type
function wototo_create_post_types() {
    register_post_type( 'wototo_app',
        array(
            'labels' => array(
                'name' => __( 'Apps' ),
                'singular_name' => __( 'App' ),
                'add_new_item' => __( 'Add New App' ),
                'edit_item' => __( 'Edit App' ),
                'new_item' => __( 'New App' ),
                'view_item' => __( 'View App' ),
                'search_items' => __( 'Search Apps' ),
                'not_found' => __( 'No apps found' ),
                'not_found_in_trash' => __( 'No apps found in Trash' ),
                'all_items' => __( 'All Apps' )
            ),
            'description' => __( 'Wototo HTML5 web app' ),
            'public' => true,
            'has_archive' => true,
            'supports' => array( 'title', 'editor', 'author', 'revisions', 'comments', 'thumbnail' ),
	    'menu_icon' => 'dashicons-smartphone',
        )
    );
}

/* Adds a meta box to the post edit screen */
add_action( 'add_meta_boxes', 'wototo_add_custom_box' );
function wototo_add_custom_box() {
    add_meta_box(
        'wototo_app_box_id',        // Unique ID
        'App Settings', 	    // Box title
        'wototo_inner_custom_box',  // Content callback
        'wototo_app',               // post type
        'normal', 'high'
    );
}
function wototo_inner_custom_box( $post ) {
?>
    <label for="wototo_things_menu_id">Pages in app</label><br/>
    <select name="wototo_things_menu_id" id="wototo_things_menu_id">
        <option value="0"><?php printf( '&mdash; %s &mdash;', esc_html__( 'Select a Menu' ) ); ?></option>
<?php
    $nav_menus = wp_get_nav_menus();
    $things_menu_id = get_post_meta( $post->ID, '_wototo_things_menu_id', true );
    foreach ( $nav_menus as $menu ) : 
        $selected = $things_menu_id == $menu->term_id; 
?>	<option <?php if ( $selected ) echo 'data-orig="true"'; ?> <?php selected( $selected ); ?> value="<?php echo $menu->term_id; ?>"><?php echo wp_html_excerpt( $menu->name, 40, '&hellip;' ); ?></option>
<?php
        endforeach; 
?>  </select><br/>
    <label for="wototo_show_about">Show About Screen</label><br/>
<?php $value = get_post_meta( $post->ID, '_wototo_show_about', true ); 
?>  <select name="wototo_show_about" id="wototo_show_about" class="postbox">
        <option value="">No</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Yes</option>
    </select><br/>
    <label for="wototo_show_location">Show Location Screen</label><br/>
<?php $value = get_post_meta( $post->ID, '_wototo_show_location', true ); 
?>  <select name="wototo_show_location" id="wototo_show_location" class="postbox">
        <option value="">No</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Yes</option>
    </select><br/>
    <label for="wototo_disable_appcache">Disable app cache (app will always need Internet access)</label><br/>
<?php $value = get_post_meta( $post->ID, '_wototo_disable_appcache', true ); 
?>  <select name="wototo_disable_appcache" id="wototo_disable_appcache" class="postbox">
        <option value="">No</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Yes</option>
    </select><br/>
<?php
}
add_action( 'save_post', 'wototo_save_postdata' );
function wototo_save_postdata( $post_id ) {
    if ( array_key_exists('wototo_show_about', $_POST ) ) {
        update_post_meta( $post_id,
           '_wototo_show_about',
            $_POST['wototo_show_about']
        );
    }
    if ( array_key_exists('wototo_show_location', $_POST ) ) {
        update_post_meta( $post_id,
           '_wototo_show_location',
            $_POST['wototo_show_location']
        );
    }
    if ( array_key_exists('wototo_things_menu_id', $_POST ) ) {
        update_post_meta( $post_id,
           '_wototo_things_menu_id',
            $_POST['wototo_things_menu_id']
        );
    }
    if ( array_key_exists('wototo_disable_appcache', $_POST ) ) {
        update_post_meta( $post_id,
           '_wototo_disable_appcache',
            $_POST['wototo_disable_appcache']
        );
    }
}
add_filter( 'template_include', 'wototo_include_template_function', 1 );
function wototo_include_template_function( $template_path ) {
    if ( get_post_type() == 'wototo_app' ) {
        if ( is_single() ) {
            // checks if the file exists in the theme first,
            // otherwise serve the file from the plugin
            if ( $theme_file = locate_template( array ( 'single-wototo_app.php' ) ) ) {
                $template_path = $theme_file;
            } else {
                $template_path = plugin_dir_path( __FILE__ ) . '/single-wototo_app.php';
            }
        }
    }
    return $template_path;
}
// filter content a la wordpress
function filter_content ( $content ) {
	$content = apply_filters( 'the_content', $content );
	$content = str_replace( ']]>', ']]&gt;', $content );
	// audio may need fixing - player defaults to hidden in WordPress 4.1 when I test...
	// <audio class="wp-audio-shortcode" id="audio-0-1" preload="none" style="width: 100%; /* visibility: hidden; */" controls="controls"><source type="audio/mpeg" src="http://172.17.0.6/wp-content/uploads/2015/01/campus.mp3?_=1"><a href="http://172.17.0.6/wp-content/uploads/2015/01/campus.mp3">http://172.17.0.6/wp-content/uploads/2015/01/campus.mp3</a></audio>
	$content = preg_replace( '/(<audio\s[^\/>]*)visibility\s*:\s*hidden\s*[;]?/', '$1', $content );
	return $content;
}
// Ajax for get json...
function wototo_get_json() {
	global $wpdb;
	header( "Content-Type: application/json" );
	$sid = $_POST['id'] ? $_POST['id'] : $_GET['id'];
	if ( !$sid ) {
		echo '{"error":"Invalid request: id not specified"}';
		wp_die();
	}
        $ix = strpos( $sid, ':' );
	if ( $ix === FALSE ) {
		echo '{"error":"Invalid request: id does not have type prefix ('.$sid.')"}';
		wp_die();
	}
	$type = substr( $sid, 0, $ix );
	$id = intval( substr( $sid, $ix+1 ) );
	if ( !$id ) {
		echo '{"error":"Invalid request: id not specified ('.$sid.')"}';
		wp_die();
	}
	$post = get_post($id);
	if ( $post === null ) {
		echo '{"error":"Not found: post '.$id.' not found"}';
		wp_die();
	}
        $res = array(
		"_id" => $sid,
        );
	if ( $post->post_status != 'publish' ) {
		echo '{"error":"Not permitted: post '.$id.' is not published/public ('.$post->post_status.')"}';
		wp_die();
	}
	if ( $post->post_type == 'wototo_app' ) {
		if ( $type != 'app' ) {
			echo '{"error":"Invalid request: type does not match, '.$sid.' vs app"}';
			wp_die();
		}
		$res['type'] = 'app';
		$res['title'] = $post->post_title;
		$res['description'] = filter_content( $post->post_content );
		// post_modified, post_status
		$showAbout = get_post_meta( $post->ID, '_wototo_show_about', true ) == '1';
		$res['showAbout'] = $showAbout;
		if ( $showAbout )
			// default to description
			$res['aboutText'] = filter_content( $post->post_content );
		$showLocation = get_post_meta( $post->ID, '_wototo_show_location', true ) == '1';
		$res['showLocation'] = $showLocation;
		// danger - needs 64 bit!
		$timezone = new DateTimeZone('UTC');
		$date = new DateTime($post->post_date_gmt, $timezone);
		$res['createdtime'] = $date->getTimestamp()*1000;
		$res['thingIds'] = array();
		$res['showShare'] = FALSE;
		$res['showUser'] = FALSE;
		$things_menu_id = intval( get_post_meta( $post->ID, '_wototo_things_menu_id', true ) );
		if ( $things_menu_id ) {
			//$things_menu = wp_get_nav_menu_object( $things_menu_id );
			$menu_items = wp_get_nav_menu_items( $things_menu_id );
			foreach ( (array) $menu_items as $key => $menu_item ) {
				if ( $menu_item->object_id ) {
					if ( $menu_item->object == 'post' || $menu_item->object == 'page' )
						$res['thingIds'][] ='html:'.$menu_item->object_id;
					else if ( $menu_item->object == 'anywhere_map_post' )
						$res['thingIds'][] ='place:'.$menu_item->object_id;
					else 
						//probably an error / unsupported
						$res['thingIds'][] = $menu_item->object.':'.$menu_item->object_id;
				}
			}
		}
	}
	else if ( $post->post_type == 'page' || $post->post_type == 'post' ) {
		if ( $type != 'html' ) {
			echo '{"error":"Invalid request: type does not match, '.$sid.' vs html ('.$post->post_type.')"}';
			wp_die();
		}
		$res['type'] = 'html';
		$res['title'] = $post->post_title;
		$res['html'] = filter_content( $post->post_content );
		$thumbid = get_post_thumbnail_id($post->ID);
		if ( $thumbid ) 
			$res['iconurl'] = wp_get_attachment_url( $thumbid );
	}
	else if ( $post->post_type == 'anywhere_map_post' ) {
		if ( $type != 'place' ) {
			echo '{"error":"Invalid request: type does not match, '.$sid.' vs place ('.$post->post_type.')"}';
			wp_die();
		}
		$res['type'] = 'place';
		$res['title'] = $post->post_title;
		$res['description'] = filter_content( $post->post_content );
		$thumbid = get_post_thumbnail_id($post->ID);
		if ( $thumbid ) 
			$res['iconurl'] = wp_get_attachment_url( $thumbid );
		// additional wander anywhere goodness...
		$geojson = json_decode( get_post_meta( $post->ID, 'geojson', true ), true );
		if ( $geojson && is_array( $geojson ) ) {
			if ( $geojson['type'] == 'Polygon' ) {
				$res['geojson'] = $geojson;
				// TODO
			} else if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=2 ) {
				$res['lat'] = $geojson['coordinates'][1];
				$res['lon'] = $geojson['coordinates'][0];
				$res['zoom'] = DEFAULT_ZOOM;
			}
		}
	}
	else {
		echo '{"error":"Unimplemented: support for post_type '.$post->post_type.'"}';
		wp_die(); 
	}
	echo json_encode($res);
	wp_die();
}
// Ajax for get manifest...
function wototo_get_manifest() {
	global $wpdb;
	$id = intval( $_POST['id'] ? $_POST['id'] : $_GET['id'] );
	if ( !$id ) {
		echo '# Invalid request: id not specified';
		wp_die();
	}
	$post = get_post($id);
	if ( $post === null ) {
		echo '# Not found: post '.$id.' not found';
		wp_die();
	}
	if ( $post->post_status != 'publish' ) {
		echo '# Not permitted: post '.$id.' is not published/public ('.$post->post_status.')';
		wp_die();
	}
	if ( $post->post_type != 'wototo_app' ) {
		echo '# Invalid request: post '.$id.' is not an app ('.$post->post_type.')';
		wp_die();
	}
	header( "Content-Type: text/cache-manifest" );
?>CACHE MANIFEST
<?php
	echo '# wototo version '.WOTOTO_VERSION."\n";
	output_plugin_files( array( 
		'stylesheets/offline.css', 
		'vendor/leaflet/leaflet.css'
		), "cache files");
	output_plugin_files( array( 
		'icons/loading.gif', 'icons/place.png', 'icons/booklet.png', 
		'icons/list.png', 'icons/file.png', 'icons/form.png', 'icons/html.png',
		'icons/arrow-l-black.png', 'icons/arrow-r-black.png', 'icons/back-black.png', 
		'icons/bars-black.png', 
		), "default icons");
	output_plugin_files( array( 
		'vendor/leaflet/images/marker-icon-2x.png',
		'vendor/leaflet/images/marker-icon.png', 
		'vendor/leaflet/images/marker-shadow.png',
		'vendor/leaflet/images/my-icon-2x.png',
		'vendor/leaflet/images/my-icon.png',
		), "leaflet icons");
	output_plugin_files( array(
		'icons/upload.png', 'icons/uploading.png', 
		'icons/upload-success.png', 'icons/upload-error.png', 
		), "upload icons");
	output_plugin_files( array( 
		'icons/location-ok.png', 'icons/location-searching.png', 
		'icons/location-off.png', 
		), "location icons");
	output_plugin_files( array( 
		'icons/like-undefined.png', 'icons/like-0.png',
		'icons/like-1.png', 'icons/like-2.png', 
		), "like icons");
	output_plugin_files( array( 
		'vendor/modernizr/modernizr.js', 
		'vendor/jquery/dist/jquery.min.js', 
		'vendor/foundation/js/foundation.min.js',
		'vendor/foundation/js/foundation/foundation.reveal.js',
		'vendor/foundation/js/foundation/foundation.offcanvas.js',
		'vendor/foundation/js/foundation/foundation.topbar.js',
		'vendor/underscore/underscore.js', 
		'vendor/backbone/backbone.js', 
		'vendor/pouchdb/dist/pouchdb-3.0.2.min.js', 
		'vendor/backbone-pouchdb/dist/backbone-pouch.js', 
		'vendor/filesaver/FileSaver.js',
		'vendor/node-uuid/uuid.js', 
		'js/offlineapp.js',
		'clientid.js', 
		'vendor/leaflet/leaflet.js', 
		), "javascript from index");
?># app json
<?php
	echo "# last modified $post->post_modified_gmt\n";
	echo admin_url( 'admin-ajax.php' ).'?action=wototo_get_json&id='.rawurlencode( 'app:'.$post->ID )."\n";
	$mediafiles = array();
	add_mediafiles( $mediafiles, filter_content( $post->post_content ) );
	$things_menu_id = intval( get_post_meta( $post->ID, '_wototo_things_menu_id', true ) );
	if ( $things_menu_id ) {
		echo "# things_menu_id $things_menu_id\n";
		//$things_menu = wp_get_nav_menu_object( $things_menu_id );
		$menu_items = wp_get_nav_menu_items( $things_menu_id );
		foreach ( (array) $menu_items as $key => $menu_item ) {
			echo "# menu item $menu_item->object_id $menu_item->object\n";
			if ( $menu_item->object_id ) {
				if ( $menu_item->object == 'post' || $menu_item->object == 'page' || $menu_item->object == 'anywhere_map_post' ) {
					$item = get_post( $menu_item->object_id );
					if ( $item ) {
						echo "# last modified $item->post_modified_gmt\n";
						$idprefix = 'html';
						if ( $menu_item->object == 'anywhere_map_post' )
							$idprefix = 'place';
						echo admin_url( 'admin-ajax.php' ).'?action=wototo_get_json&id='.rawurlencode( $idprefix.':'.$item->ID )."\n";
						
						add_mediafiles( $mediafiles, filter_content( $item->post_content ) );
						$thumbid = get_post_thumbnail_id($item->ID);
						if ( $thumbid ) {
							$url = wp_get_attachment_url( $thumbid );
							if ( !in_array( $url, $mediafiles ) )
								$mediafiles[] = $url;
						}
					}
				}
				if ( $menu_item->object == 'anywhere_map_post' ) {
					$item = get_post( $menu_item->object_id );
					if ( $item ) {
						$geojson = json_decode( get_post_meta( $item->ID, 'geojson', true ), true );
						if ( $geojson && is_array( $geojson ) ) {
							if ( $geojson['type'] == 'Polygon' ) {
								// TODO
								echo "# unsupported map post type ".$geojson['type']."\n";
							} else if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=2 ) {
								$lat = $geojson['coordinates'][1];
								$lon = $geojson['coordinates'][0];
								$zoom = DEFAULT_ZOOM;
								add_maptiles( $mediafiles, $lat, $lon, $zoom );
							} else {
								echo "# invalid map post geojson ".json_encode( $geojson )."\n";
							}
						}
					}		
				}
			}
		}
	}
?># media files
<?php
	foreach ( $mediafiles as $mediafile ) {
		echo $mediafile."\n";
	}
?># general network access
NETWORK:
#*

<?php
	echo '# Manifest...';
	wp_die();
}
function add_mediafiles ( &$mediafiles, $content ) {
	$matches = array();
	if ( preg_match_all( '/<[sS][oO][uU][rR][cC][eE][^>]+src="?([^"\s>]+)"?[^>]*\/>/', $content, $matches ) ) {
		foreach ( $matches[1] as $src ) {
			//echo "# found $src\n";
			$src = str_replace( '/[&]amp[;]/', '&', $src );
			if ( !in_array( $src, $mediafiles ) ) {
				//echo "# added $src\n";
				$mediafiles[] = $src;
			} else {
				echo "# got $src already in $mediafiles\n";
			}
		}
	}
	$matches = array();
	if ( preg_match_all( '/<[iI][mM][gG][^>]+src="?([^"\s>]+)"?[^>]*\/>/', $content, $matches ) ) {
		foreach ( $matches[1] as $src ) {
			//echo "# found $src\n";
			$src = str_replace( '/[&]amp[;]/', '&', $src );
			if ( !in_array( $src, $mediafiles ) )
				$mediafiles[] = $src;
		}
	}
}
define( MAX_ZOOM, 19 ); // max on OSM??
define( MAX_ZOOM_IN, 1 );
define( MAX_ZOOM_OUT, 1 );
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
// Math.floor...
function lon2tile ( $lon, $zoom) { 
	return ($lon+180)/360*pow(2,$zoom);
}
// Math.floor...
function lat2tile ( $lat, $zoom) { 
	return (1-log(tan($lat*M_PI/180) + 1/cos($lat*M_PI/180))/M_PI)/2 *pow(2,$zoom);
}
function add_maptiles( &$mediafiles, $lat, $lon, $zoom ) {
	if ( $zoom> MAX_ZOOM )
		$zoom = MAX_ZOOM;
	// OSM: http://{s}.tile.osm.org/{z}/{x}/{y}.png
	$mapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
	// see https://github.com/Leaflet/Leaflet/blob/master/src/layer/tile/TileLayer.js
	$subdomains = array( 'a','b','c' );
	$latTile0 = lat2tile( $lat, 0 );
	$lonTile0 = lon2tile( $lon, 0 );
	echo "# add_maptiles $lat,$lon,$zoom -> $latTile0,$lonTile0\n";
	// delta at zoom, scaled by larger image (up to 400px vs tile 256px)
	// range = 0.5*1/Math.pow(2,zoom)*400/256
	$mzoom = $zoom+MAX_ZOOM_IN;
	$minZoom = $zoom-MAX_ZOOM_OUT;
	if ( $mzoom > MAX_ZOOM )
		$mzoom = MAX_ZOOM;
	$tileRange = 0.5*400/256;
	$xmax = 1;
	for( $z=0; $z<=$mzoom; $z++ ) {
		//tileRange = tileRange/2
		$y1 = max( 0, floor( $latTile0-$tileRange ) );
		$y2 = min( $xmax-1, floor( $latTile0+$tileRange ) );
		$x1 = max( 0, floor( $lonTile0-$tileRange ) );
		$x2 = min( $xmax-1, floor( $lonTile0+$tileRange ) );
		$xmax = $xmax*2;
		$latTile0 = $latTile0*2;
		$lonTile0 = $lonTile0*2;
		echo "# tiles zoom $z 0-$xmax-1 $x1:$x2, $y1:$y2\n";
		if ( $z >= $minZoom ) {
			for( $x=$x1; $x<=$x2; $x++ ) {
				for( $y=$y1; $y<=$y2; $y++ ) {
					$s = $subdomains[abs($x + $y) % count( $subdomains )];
					$url = str_replace( array( '{s}', '{z}', '{x}', '{y}'), array( $s, $z, $x, $y ), $mapUrl );
					if ( !in_array( $url, $mediafiles ) )
						$mediafiles[] = $url;
				}
			}
		}
	}				
}
function output_plugin_files( $array, $title ) {
	if ( $title )
		echo '# '.$title."\n";
	foreach ( $array as $file ) 
		echo plugins_url( $file, __FILE__ )."\n";
}
if ( is_admin() ) {
	add_action( 'wp_ajax_wototo_get_json', 'wototo_get_json' );
	add_action( 'wp_ajax_nopriv_wototo_get_json', 'wototo_get_json' );
	add_action( 'wp_ajax_wototo_get_manifest', 'wototo_get_manifest' );
	add_action( 'wp_ajax_nopriv_wototo_get_manifest', 'wototo_get_manifest' );
}

