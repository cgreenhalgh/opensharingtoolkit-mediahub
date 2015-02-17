<?php
/**
 * Plugin Name: wototo
 * Plugin URI: https://github.com/cgreenhalgh/opensharingtoolkit-mediahub/tree/master/docs/wordpress.md
 * Description: Create simple HTML5 web apps from wordpress content (pages and posts). The web apps are intended for use on recent smart phones and tablets.
 * Version: 0.3.5
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
// post_sorter
require_once( dirname(__FILE__) . '/postselector.php' );
require_once( dirname(__FILE__) . '/common.php' );

// wander anywhere map post  -> wototo place
define( "DEFAULT_ZOOM", 15 );
define( "WOTOTO_VERSION", "0.3.5-4" );

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
        'wototo_app_custom_box',  // Content callback
        'wototo_app',               // post type
        'normal', 'high'
    );
    $item_types = array( 'post', 'page', 'anywhere_map_post' );
    foreach( $item_types as $item_type ) {
        add_meta_box(
            'wototo_item_box_id',        // Unique ID
            'App-specific Settings', 	    // Box title
            'wototo_item_custom_box',  // Content callback
       	    $item_type,  // post type
            'normal', 'default'
        );
    }
}
function wototo_app_custom_box( $post ) {
?>
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
<?php $value = get_post_meta( $post->ID, '_postselector_selected_ids', true ); 
?>    <div  class="checkbox_item">
	<label for="wototo_clear_postselector"><input type="checkbox" value="1" name="wototo_clear_postselector"/>Clear any PostSelector items (currently <?php echo count( json_decode ( $value ) ) ?>)</label></div>
    <input type="hidden" name="wototo_clear_postselector_shown" value="1"/>
    <label for="wototo_things_menu_id">Include Pages From a Site Menu</label><br/>
    <select name="wototo_things_menu_id" id="wototo_things_menu_id" class="postbox">
        <option value="0">&mdash; No &mdash;</option>
<?php
    $nav_menus = wp_get_nav_menus();
    $things_menu_id = get_post_meta( $post->ID, '_wototo_things_menu_id', true );
    foreach ( $nav_menus as $menu ) : 
        $selected = $things_menu_id == $menu->term_id; 
?>	<option <?php if ( $selected ) echo 'data-orig="true"'; ?> <?php selected( $selected ); ?> value="<?php echo $menu->term_id; ?>"><?php echo wp_html_excerpt( $menu->name, 40, '&hellip;' ); ?></option>
<?php
        endforeach; 
?>  </select><br/>
<?php
/*
?>    <label for="wototo_disable_appcache">Disable app cache (app will always need Internet access)</label><br/>
<?php $value = get_post_meta( $post->ID, '_wototo_disable_appcache', true ); 
?>  <select name="wototo_disable_appcache" id="wototo_disable_appcache" class="postbox">
        <option value="">No</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Yes</option>
    </select><br/>
<?php
*/
	wp_enqueue_script( 'wototo-ajax', plugins_url( 'wototo.js', __FILE__ ) );
	wp_enqueue_style( 'wototo-css', plugins_url( 'wototo.css', __FILE__ ) );
?>	<h4>Specific Items</h4>
	<div id="wototo_things" class="wototo_things">
	<input type="hidden" name="wototo_thing_ids_shown" value="1"/>
<?php
	$specific_ids = get_post_meta( $post->ID, '_wototo_thing_ids', true ); 
	if ( $specific_ids ) 
		$specific_ids = json_decode( $specific_ids, true );
	if ( is_array( $specific_ids ) ) {
		for ( $i=0; $i < count( $specific_ids ); $i++ ) {
			$id = $specific_ids[$i];
			$post = get_post( $id );
			$unlock_codes = get_post_meta( $post->ID, '_wototo_item_unlock_codes', true );
			$unlock_codes = $unlock_codes ? json_decode( $unlock_codes, TRUE ) : array();
			$artcode = $unlock_codes['artcode'] ? ' ('.$unlock_codes['artcode'].')': '';
			$current_user_can_edit = current_user_can ( 'edit_post', $post->ID );
			// NB links have & escaped already
?>	<div class="wototo_thing submitbox">
		<input type="hidden" name="wototo_thing_id-<?php echo $i ?>" value="<?php echo $id ?>"/>
		<span class="wototo_item_title"><?php echo esc_html( $post->post_title) ?></span>
		<span class="description"><?php echo esc_html( $artcode ) ?>
		<a href="<?php echo get_edit_post_link( $post->ID ) ?>" target="_blank" class="<?php echo !$current_user_can_edit ? 'hide' : '' ?>">Edit</a>
		<a href="<?php echo get_post_view_url( $post ) ?>" target="_blank" class="">View</a>
		|
		<a href='#' class="item-delete submitdelete deletion wototo_thing_remove">Remove</a>
		<a href='#' class="menu_move_up wototo_thing_up <?php echo $i==0 ? 'hide' : '' ?> ">Up</a>
		<a href='#' class="menu_move_down wototo_thing_down <?php echo $i+1==count( $specific_ids ) ? 'hide' : '' ?> ">Down</a>
		</span>
	</div>
<?php		}
	}
?>	</div>
<?php	wototo_thing_search_html();
}
function get_post_view_url( $post ) {
	if ( $post->post_type == 'post' || $post->post_type == 'page' )
		return get_permalink( $post->ID );
	else
		return get_post_permalink( $post->ID );
}
// output search form stuff for selecting posts/etc in app meta box
function wototo_thing_search_html() {
?>	<h4>Add Items</h4>
	<table><tbody><tr>
		<td>Title</td>
		<td>Category</td>
		<td>Type</td>
		<td>Author</td>
		<td>Sort by/Reverse</td>
	</tr>
	<!-- <tr><td>Status</td><td>
		<select name="wototo_thing_search_status">
			<option value="">Any</option>
			<option value="publish">Published</option>
		</select></td></tr> -->
	<tr>
		<td><input type="search" name="wototo_thing_search_search"/></td>
   		<td><select name="wototo_thing_search_category">
			<option value="0">&mdash;Any&mdash;</option>
<?php wototo_category_options_html(); 
?>		</select></td>
		<td><select name="wototo_thing_search_type">
			<option value="post">Post</option>
			<option value="page">Page</option>
			<option value="anywhere_map_post">Map Post</option>
		</select></td>
		<td><select name="wototo_thing_search_author">
			<option value="1">You</option>
			<option value="0">Anyone</option>
		</select></td>
		<td><select name="wototo_thing_search_orderby">
			<option value="title">Title</option>
			<option value="date">Date</option>
			<option value="modified">Modified</option>
		</select>/<input name="wototo_thing_search_reverse" type="checkbox"/></td>
	</tr>
	<tr>
		<td id="wototo_thing_search_spinner"><input type="button" value="Search" name="wototo_thing_search" id="wototo_thing_search_id"/><span class="spinner"></span></td>
	</tr>
	</tbody></table>
	<div id="wototo_thing_search_result"></div>
<?php
}
function wototo_code_types() {
    return array( array( "type" => "number", "title" => "Number", "input" => "number" ),
      array( "type" => "artcode", "title" => "Artcode", "input" => "text" ),
      array( "type" => "qrcode", "title" => "QRcode", "input" => "text" ),
    );
}
function wototo_item_custom_box( $post ) {
    $value = get_post_meta( $post->ID, '_wototo_item_locked', true ); 
?>
    <label for="wototo_item_locked_id">Locked (hidden) when in an app?</label><br/>
    <select name="wototo_item_locked" id="wototo_item_locked_id" class="postbox">
        <option value="0">No</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Initially (until unlocked)</option>
        <option value="2" <?php if ( '2' == $value ) echo 'selected'; ?>>Always</option>
    </select><br/>
<?php
    $value = get_post_meta( $post->ID, '_wototo_item_locked_show', true ); 
?>
    <label for="wototo_item_locked_show_id">When locked, show...</label><br/>
    <select name="wototo_item_locked_show" id="wototo_item_locked_show_id" class="postbox">
        <option value="0">Nothing</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Item title</option>
    </select><br/>
<?php
    $value = get_post_meta( $post->ID, '_wototo_item_unlock_codes', true );
    $unlock_codes = $value ? json_decode( $value, true ) : array();
?>
    <label for="wototo_item_unlock_codes_id">Unlock by...</label><br/>
    <table id="wototo_item_unlock_codes_id"><tbody>
<?php
    foreach ( wototo_code_types() as $code_type ) {
?>      <tr><td><?php echo esc_html__( $code_type['title'] ) ?></td><td><input type="<?php echo $code_type['input'] ?>" name="wototo_item_unlock_codes-<?php echo $code_type['type'] ?>" value="<?php echo array_key_exists( $code_type['type'], $unlock_codes ) ? $unlock_codes[$code_type['type']] : '' ?>"/></td></tr>
<?php
    }
?>
    </tbody></table><br/>
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
    if ( array_key_exists('wototo_clear_postselector', $_POST ) && 
	$_POST['wototo_clear_postselector'] ) {
        update_post_meta( $post_id, '_postselector_selected_ids', '');
        update_post_meta( $post_id, '_postselector_rejected_ids', '');
    }
	if ( array_key_exists('wototo_thing_ids_shown', $_POST ) ) {
		$thing_ids = array();
		for ($i = 0; true; $i++) {
			if ( array_key_exists('wototo_thing_id-'.$i, $_POST ) )
				$thing_ids[] = intval( $_POST['wototo_thing_id-'.$i] );
			else
				break;
		}
	        update_post_meta( $post_id, '_wototo_thing_ids', json_encode( $thing_ids ) );
	}
    if ( array_key_exists('wototo_item_locked', $_POST ) ) {
        update_post_meta( $post_id,
           '_wototo_item_locked',
            $_POST['wototo_item_locked']
        );
        $lock_id = get_post_meta( $post->ID, '_wototo_item_lock_id', true );
        // clear if unlocked; generate if locked     
        if( $_POST['wototo_item_locked'] && !$lock_id ) 
            update_post_meta( $post_id,
               '_wototo_item_lock_id', uniqid('lockid', TRUE) );
        else if( !$_POST['wototo_item_locked'] && $lock_id ) 
            update_post_meta( $post_id,
               '_wototo_item_lock_id', '' );
    }
    if ( array_key_exists('wototo_item_locked_show', $_POST ) ) {
        update_post_meta( $post_id,
           '_wototo_item_locked_show',
            $_POST['wototo_item_locked_show']
        );
    }
    $value = get_post_meta( $post->ID, '_wototo_item_unlock_codes', true );
    $unlock_codes = $value ? json_decode( $value, true ) : array();
    $changed = FALSE;
    foreach ( wototo_code_types() as $code_type ) {
        if( array_key_exists('wototo_item_unlock_codes-'.$code_type['type'], $_POST ) ) {
            $unlock_codes[$code_type['type']] = $_POST['wototo_item_unlock_codes-'.$code_type['type']];
            $changed = TRUE;
        }
    }
    if ( $changed ) {
        update_post_meta( $post_id,
           '_wototo_item_unlock_codes',
           json_encode( $unlock_codes )
        );
    }
}
function wototo_get_type_for_post_type( $post_type ) {
	if ( $post_type == 'post' || $post_type == 'page' )
		return 'html';
	if ( $post_type == 'anywhere_map_post' )
		return 'place';
	//probably an error / unsupported
	return $post_type;
}
function wototo_get_type_for_post( $post_id ) {
	$post_type = get_post_type( $post_id );
	return wototo_get_type_for_post_type( $post_type );
}
// get combined thing ids
function wototo_get_thing_ids( $app_id ) {
	$thing_ids = array();
	$things_menu_id = intval( get_post_meta( $app_id, '_wototo_things_menu_id', true ) );
	if ( $things_menu_id ) {
		//$things_menu = wp_get_nav_menu_object( $things_menu_id );
		$menu_items = wp_get_nav_menu_items( $things_menu_id );
		foreach ( (array) $menu_items as $key => $menu_item ) {
			if ( $menu_item->object_id ) {
				$thing_ids[] = wototo_get_type_for_post_type($menu_item->object).':'.$menu_item->object_id;
			}
		}
	}
	$specific_ids = get_post_meta( $app_id, '_wototo_thing_ids', true ); 
	if ( $specific_ids ) 
		$specific_ids = json_decode( $specific_ids, true );
	if ( is_array( $specific_ids ) ) {
		foreach ( $specific_ids as $id ) {
			$thing_ids[] = wototo_get_type_for_post( $id ).':'.$id;
		}
	}
	// postselector 
	$selected_ids = get_post_meta( $app_id, '_postselector_selected_ids', true ); 
	if ( $selected_ids ) 
		$selected_ids = json_decode( $selected_ids, true );
	if ( is_array( $selected_ids ) ) {
		foreach ( $selected_ids as $id ) {
			$thing_ids[] = wototo_get_type_for_post( $id ).':'.$id;
		}
	}
	return $thing_ids;
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
// custom meta info, esp. locked stuff
function wototo_add_item_fields( &$res, $post ) {
    $value = get_post_meta( $post->ID, '_wototo_item_locked', true ); 
    if ( $value != "" )
        $res['locked'] = intval( $value );
    $value = get_post_meta( $post->ID, '_wototo_item_locked_show', true ); 
    if ( $value != "" )
        $res['lockedShow'] = intval( $value );
    $value = get_post_meta( $post->ID, '_wototo_item_lock_id', true ); 
    if ( $value != "" )
        $res['lockId'] = $value;
    $value = get_post_meta( $post->ID, '_wototo_item_unlock_codes', true );
    if ( $value ) {
        $unlock_codes = json_decode( $value, true );
        $res['unlockCodes'] = array();
        foreach ( $unlock_codes as $type => $code ) 
           $res['unlockCodes'][] = array( "type" => $type, "code" => $code ); 
    }
}
// geojson stuff
function geojson_get_lat($geojson) {
	if ( $geojson['type'] == 'Polygon' ) {
		if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=1 && count( $geojson['coordinates'][0] )>=1 ) {
			$max = $geojson['coordinates'][0][0][1];
			$min = $max;
			for( $i=1; $i < count( $geojson['coordinates'][0] ); $i++) {
				$max = max( $max, $geojson['coordinates'][0][$i][1] );
				$min = min( $min, $geojson['coordinates'][0][$i][1] );
			}
			return ($max+$min)/2;
		}
	} else if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=2 ) {
		return $geojson['coordinates'][1];
	}
	return null;
}
function geojson_get_lon($geojson) {
	if ( $geojson['type'] == 'Polygon' ) {
		if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=1 && count( $geojson['coordinates'][0] )>=1 ) {
			$max = $geojson['coordinates'][0][0][0];
			$min = $max;
			for( $i=1; $i < count( $geojson['coordinates'][0] ); $i++) {
				$max = max( $max, $geojson['coordinates'][0][$i][0] );
				$min = min( $min, $geojson['coordinates'][0][$i][0] );
			}
			return ($max+$min)/2;
		}
	} else if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=2 ) {
		return $geojson['coordinates'][0];
	}
	return null;
}
function geojson_get_zoom($geojson) {
	if ( $geojson['type'] == 'Polygon' ) {
		if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=1 && count( $geojson['coordinates'][0] )>=1 ) {
			$max0 = $geojson['coordinates'][0][0][0];
			$min0 = $max0;
			$max1 = $geojson['coordinates'][0][0][1];
			$min1 = $max1;
			for( $i=1; $i < count( $geojson['coordinates'][0] ); $i++) {
				$max0 = max( $max0, $geojson['coordinates'][0][$i][0] );
				$min0 = min( $min0, $geojson['coordinates'][0][$i][0] );
				$max1 = max( $max1, $geojson['coordinates'][0][$i][1] );
				$min1 = min( $min1, $geojson['coordinates'][0][$i][1] );
			}
			// TODO
			return DEFAULT_ZOOM;
		}
	} else if ( $geojson['coordinates'] && count( $geojson['coordinates'] )>=2 ) {
		return DEFAULT_ZOOM;
	}
	return null;
}
function wototo_get_iconurl( $thumbid ) {
	$iconurl = wp_get_attachment_url( $thumbid );
	if ( $iconurl !== false )
		return $iconurl;
	return null;
}
function handle_post_if_modified_since( $post ) {
	$lastModified = mysql2date('U', $post->post_modified_gmt);
	handle_if_modified_since( $lastModified );
}
function handle_if_modified_since( $lastModified ) {
	if ( empty( $lastModified ) )
		return;
	if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ) {
		$ifModifiedSince = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']);
		// valid? (future is also invalid!)
		if ( $ifModifiedSince===FALSE || $ifModifiedSince > time() )
			return;
		if ( $lastModified <= $ifModifiedSince ) {
			header('HTTP/1.0 304 Not Modified');
			wp_die();
		}
 	}
	header( "Last-Modified: " . date( DATE_RFC2822, $lastModified ) );
}
// Ajax for get json...
function wototo_get_json() {
	global $wpdb;
	header( "Content-Type: application/json" );
	// TODO more specific?
	header( "Access-Control-Allow-Origin: *" );
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
	handle_post_if_modified_since( $post );
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
		$res['thingIds'] = wototo_get_thing_ids( $post->ID );
		$res['showShare'] = FALSE;
		$res['showUser'] = FALSE;
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
		if ( $thumbid ) {
			$res['iconurl'] = wototo_get_iconurl( $thumbid );
		}
		wototo_add_item_fields( $res, $post );
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
			$res['iconurl'] = wototo_get_iconurl( $thumbid );
		// additional wander anywhere goodness...
		$geojson = json_decode( get_post_meta( $post->ID, 'geojson', true ), true );
		if ( $geojson && is_array( $geojson ) ) {
			if ( $geojson['type'] == 'Polygon' ) {
				$res['geojson'] = $geojson;
			} 
			$res['lat'] = geojson_get_lat( $geojson );
			$res['lon'] = geojson_get_lon( $geojson );
			$res['zoom'] = geojson_get_zoom( $geojson );
		}
		wototo_add_item_fields( $res, $post );
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
	$lastModified = mysql2date('U', $post->post_modified_gmt);
	// plugin change => check the rest
	$pluginLastModified = filemtime( __FILE__ );
        if ( $lastModified && $pluginLastModified && $pluginLastModified > $lastModified ) 
		$lastModified = $pluginLastModified;
	// check last modified and cache things
	$thing_ids = wototo_get_thing_ids( $post->ID );
	$items = array();
	foreach( $thing_ids as $thing_id ) {
		$ix = strpos( $thing_id, ':' );
		$idprefix = '';
		if ( $ix !== FALSE ) {
			$item_id = substr( $thing_id, $ix+1 );
			$idprefix = substr( $thing_id, 0, $ix );
		}
		if ( $idprefix ) {
			$item = get_post( $item_id );
			if ( $item ) {
				$items[(string)$thing_id] = $item;
				$itemLastModified = mysql2date('U', $item->post_modified_gmt);
				if ( $lastModified && $itemLastModified && $itemLastModified > $lastModified )
					$lastModified = $itemLastModified;
			}
		}
	}
	handle_if_modified_since( $lastModified );
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
		'icons/bars-black.png', 'icons/locked.png'
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
		'icons/location-off.png', 'icons/navigation-black.png',
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
		'vendor/IndexedDBShim/IndexedDBShim.min.js',
		'vendor/backbone/backbone.js', 
		'vendor/pouchdb/dist/pouchdb-3.0.2.min.js', 
		'vendor/backbone-pouchdb/dist/backbone-pouch.js', 
		'vendor/backbone-indexeddb/backbone-indexeddb.js',
		'vendor/filesaver/FileSaver.js',
		'vendor/node-uuid/uuid.js', 
		'js/offlineapp.js',
		'clientid.js', 
		'vendor/leaflet/leaflet.js', 
		), "javascript from index");
	$wototo = $_POST['wototo'] ? $_POST['wototo'] : $_GET['wototo'];
	if ( $wototo ) 
		output_plugin_files( array( 
			'vendor/cordova/cordova.js', 
			'vendor/cordova/cordova_plugins.js', 
			'vendor/cordova/plugins/org.opensharingtoolkit.cordova.aestheticodes/www/aestheticodes.js', 
			'vendor/cordova/plugins/com.phonegap.plugins.barcodescanner/www/barcodescanner.js', 
			), "Apache Cordova");
?># app json
<?php
	echo "# last modified $post->post_modified_gmt\n";
	echo admin_url( 'admin-ajax.php' ).'?action=wototo_get_json&id='.rawurlencode( 'app:'.$post->ID )."\n";
	$mediafiles = array();
	add_mediafiles( $mediafiles, filter_content( $post->post_content ) );
	foreach( $thing_ids as $thing_id ) {
			echo "# item $thing_id\n";
			$item = $items[ (string)$thing_id  ];
			if ( $item ) {
				if ( $idprefix == 'html' || $idprefix == 'place' ) {
					echo "# last modified $item->post_modified_gmt\n";
					echo admin_url( 'admin-ajax.php' ).'?action=wototo_get_json&id='.rawurlencode( $thing_id )."\n";
					add_mediafiles( $mediafiles, filter_content( $item->post_content ) );
					$thumbid = get_post_thumbnail_id($item->ID);
					if ( $thumbid ) {
						$url = wototo_get_iconurl( $thumbid );
						if ( !in_array( $url, $mediafiles ) )
							$mediafiles[] = $url;
					}
				}
				if ( $idprefix == 'place' ) {
					$geojson = json_decode( get_post_meta( $item->ID, 'geojson', true ), true );
					if ( $geojson && is_array( $geojson ) ) {
						$lat = geojson_get_lat( $geojson );
						$lon = geojson_get_lon( $geojson );
						$zoom = geojson_get_zoom( $geojson );
						if ( $lat!==null && $lon!==null && $zoom!==null ) {
							add_maptiles( $mediafiles, $lat, $lon, $zoom );
						} else {
							echo "# invalid map post geojson ".json_encode( $geojson )."\n";
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
			$src = str_replace( '&amp;', '&', $src );
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
			$src = str_replace( '&amp;', '&', $src );
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
function wototo_ajax_thing_search() {
	header( "Content-Type: application/json" );
	$args = array();
	if ( isset( $_POST['search'] ) ) {
		$args['s'] = $_POST['search'];
	}
	if ( isset( $_POST['author'] ) && intval( $_POST['author'] ) ) {
		$args['author'] = get_current_user_id();
	}
	if ( isset( $_POST['post_type'] ) ) {
		$args['post_type'] = $_POST['post_type'];
	}
	if ( isset( $_POST['cat'] ) ) {
		$args['category'] = intval( $_POST['cat'] );
	}
	if ( isset( $_POST['orderby'] ) ) {
		$args['orderby'] = $_POST['orderby'];
	}
	if ( isset( $_POST['reverse'] ) && intval( $_POST['reverse'] ) ) {
		$args['order'] = 'ASC'; // DESC
	}
		$args['posts_per_page'] = 30;
	$args['post_status'] = 'publish';
	$posts = get_posts( $args );
	$res = array();
	foreach ( $posts as $post ) {
		$unlock_codes = get_post_meta( $post->ID, '_wototo_item_unlock_codes', true );
		$res[] = array(
			'ID' => $post->ID,
			'post_title' => $post->post_title,
			'post_type' => $post->post_type,
			'post_status' => $post->post_status,
			'post_date_gmt' => $post->post_date_gmt,
			'post_modified_gmt' => $post->post_modified_gmt,
			'post_author' => $post->post_author, 
			'_wototo_item_unlock_codes' => $unlock_codes,
			'edit_url' => get_edit_post_link( $post->ID ), // checks permission, & escaped
			'view_url' => get_post_view_url( $post ), // &escaped
		);
	}
	if ( count( $posts ) >= 30 )
		$res[] = array( 'more' => TRUE );
	echo json_encode( $res );
	wp_die();
}
if ( is_admin() ) {
	add_action( 'wp_ajax_wototo_get_json', 'wototo_get_json' );
	add_action( 'wp_ajax_nopriv_wototo_get_json', 'wototo_get_json' );
	add_action( 'wp_ajax_wototo_get_manifest', 'wototo_get_manifest' );
	add_action( 'wp_ajax_nopriv_wototo_get_manifest', 'wototo_get_manifest' );
	add_action( 'wp_ajax_wototo_thing_search', 'wototo_ajax_thing_search' );
}

