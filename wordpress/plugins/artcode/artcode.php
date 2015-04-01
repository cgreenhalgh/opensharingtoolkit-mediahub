<?php
/**
 * Plugin Name: artcode
 * Plugin URI: http://aestheticodes.com/
 * Description: Create ArtCode experience from wordpress content (pages and posts).
 * Version: 0.1
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

define( "MIN_REGIONS", 1 );
define( "MAX_REGIONS", 20 );
define( "DEFAULT_REGIONS_MIN", 4 );
define( "DEFAULT_REGIONS_MAX", 6 );
define( "DEFAULT_CHECKSUM", 0 );
define( "DEFAULT_MAX_REGION_VALUE", 10 );
define( "MIN_MAX_REGION_VALUE", 1 );
define( "MAX_MAX_REGION_VALUE", 20 );
define( "MIN_CHECKSUM", 2 );
define( "MAX_CHECKSUM", 12 );

add_action( 'init', 'artcode_create_post_types' );
//Register the app post type
function artcode_create_post_types() {
    register_post_type( 'artcode',
        array(
            'labels' => array(
                'name' => __( 'ArtCode Experience' ),
                'singular_name' => __( 'ArtCode Experience' ),
                'add_new_item' => __( 'Add New ArtCode Experience' ),
                'edit_item' => __( 'Edit ArtCode Experience' ),
                'new_item' => __( 'New ArtCode Experience' ),
                'view_item' => __( 'View ArtCode Experience' ),
                'search_items' => __( 'Search ArtCode Experiences' ),
                'not_found' => __( 'No ArtCode Experiences found' ),
                'not_found_in_trash' => __( 'No ArtCode Experiences found in Trash' ),
                'all_items' => __( 'All ArtCode Experiences' )
            ),
            'description' => __( 'ArtCode Experience' ),
            'public' => true,
            'has_archive' => true,
            'supports' => array( 'title', 'editor', 'author', 'revisions', 'comments', 'thumbnail' ),
	    'menu_icon' => 'dashicons-smartphone',
        )
    );
}

/* Adds a meta box to the post edit screen */
add_action( 'add_meta_boxes', 'artcode_add_custom_box' );
function artcode_add_custom_box() {
    add_meta_box(
        'artcode_box_id',        // Unique ID
        'ArtCode Experience Settings', 	    // Box title
        'artcode_custom_box',  // Content callback
        'artcode',               // post type
        'normal', 'high'
    );
    $item_types = array( 'post', 'page', 'anywhere_map_post' );
    foreach( $item_types as $item_type ) {
        add_meta_box(
            'artcode_item_box_id',        // Unique ID
            'ArtCode Experience Settings', 	    // Box title
            'artcode_item_custom_box',  // Content callback
       	    $item_type,  // post type
            'normal', 'default'
        );
    }
}
function artcode_custom_box( $post ) {
	wp_enqueue_script( 'artcode-ajax', plugins_url( 'artcode.js', __FILE__ ) );
	wp_enqueue_style( 'artcode-css', plugins_url( 'artcode.css', __FILE__ ) );
?>	<h4>Markers</h4>
	<div id="artcode_markers" class="artcode_markers">
	<input type="hidden" name="artcode_marker_ids_shown" value="1"/>
<?php
	$specific_ids = get_post_meta( $post->ID, '_artcode_marker_ids', true ); 
	if ( $specific_ids ) 
		$specific_ids = json_decode( $specific_ids, true );
	if ( is_array( $specific_ids ) ) {
		for ( $i=0; $i < count( $specific_ids ); $i++ ) {
			$id = $specific_ids[$i];
			$post = get_post( $id );
			$artcode = '';
			$value = get_post_meta( $item->ID, '_artcode_code', true );
			if ( $value ) {
				$artcode = $value;
			} else {
			    	$value = get_post_meta( $item->ID, '_wototo_item_unlock_codes', true );
				if ( $value ) {
        				$unlock_codes = json_decode( $value, true );
					if ( array_key_exists('artcode', $unlock_codes ) ) {
						$artcode = $unlock_codes['artcode'];
					}
				}
			}
			$current_user_can_edit = current_user_can ( 'edit_post', $post->ID );
			// NB links have & escaped already
?>	<div class="artcode_marker submitbox">
		<input type="hidden" name="artcode_marker_id-<?php echo $i ?>" value="<?php echo $id ?>"/>
		<span class="artcode_marker_title"><?php echo esc_html( $post->post_title) ?></span>
		<span class="description"><?php echo esc_html( $artcode ) ?>
		<a href="<?php echo get_edit_post_link( $post->ID ) ?>" target="_blank" class="<?php echo !$current_user_can_edit ? 'hide' : '' ?>">Edit</a>
		<a href="<?php echo get_post_view_url( $post ) ?>" target="_blank" class="">View</a>
		|
		<a href='#' class="item-delete submitdelete deletion artcode_marker_remove">Remove</a>
		<a href='#' class="menu_move_up artcode_marker_up <?php echo $i==0 ? 'hide' : '' ?> ">Up</a>
		<a href='#' class="menu_move_down artcode_marker_down <?php echo $i+1==count( $specific_ids ) ? 'hide' : '' ?> ">Down</a>
		</span>
	</div>
<?php		}
	}
?>	</div>
<?php	artcode_marker_search_html();
}
function artcode_custom_box( $post ) {
?>
    <input type="hidden" name="artcode_custom_box_shown" value="1"/>
    <label for="artcode_regions_min">Regions (Minimum)</label><br/>
<?php $value = get_post_meta( $post->ID, '_artcode_regions_min', true );
    if(empty($value)) $value = DEFAULT_REGIONS_MIN; 
?>  <select name="artcode_regions_min" id="artcode_regions_min" class="postbox">
<?php for($i=MIN_REGIONS; $i<=MAX_REGIONS; $i++) { 
?>        <option value="<?php echo $i ?>" <?php if ( $i == $value ) echo 'selected'; ?>><?php echo $i ?></option>
<?php } 
?>    </select><br/>
    <label for="artcode_regions_max">Regions (Maximum)</label><br/>
<?php $value = get_post_meta( $post->ID, '_artcode_regions_max', true );
    if(empty($value)) $value = DEFAULT_REGIONS_MAX; 
?>  <select name="artcode_regions_max" id="artcode_regions_max" class="postbox">
<?php for($i=MIN_REGIONS; $i<=MAX_REGIONS; $i++) { 
?>        <option value="<?php echo $i ?>" <?php if ( $i == $value ) echo 'selected'; ?>><?php echo $i ?></option>
<?php } 
?>    </select><br/>
    <label for="artcode_max_region_value">Max Region Value</label><br/>
<?php $value = get_post_meta( $post->ID, '_artcode_max_region_value', true );
    if(empty($value)) $value = DEFAULT_MAX_REGION_VALUE; 
?>  <select name="artcode_max_region_value" id="artcode_max_region_value" class="postbox">
<?php for($i=MIN_MAX_REGION_VALUE; $i<=MAX_MAX_REGION_VALUE; $i++) { 
?>        <option value="<?php echo $i ?>" <?php if ( $i == $value ) echo 'selected'; ?>><?php echo $i ?></option>
<?php } 
?>    </select><br/>
    <label for="artcode_checksum">Checksum</label><br/>
<?php $value = get_post_meta( $post->ID, '_artcode_checksum', true );
    if(empty($value)) $value = DEFAULT_CHECKSUM; 
?>  <select name="artcode_checksum" id="artcode_checksum" class="postbox">
        <option value="" <?php if ( $value < MIN_CHECKSUM ) echo 'selected'; ?>><?php echo $i ?></option>
<?php for($i=MIN_CHECKSUM; $i<=MAX_CHECKSUM; $i++) { 
?>        <option value="<?php echo $i ?>" <?php if ( $i == $value ) echo 'selected'; ?>><?php echo $i ?></option>
<?php } 
?>    </select><br/>
<?php}
function get_post_view_url( $post ) {
	if ( $post->post_type == 'post' || $post->post_type == 'page' )
		return get_permalink( $post->ID );
	else
		return get_post_permalink( $post->ID );
}
// output search form stuff for selecting posts/etc in app meta box
function artcode_marker_search_html() {
?>	<h4>Add Markers</h4>
	<table><tbody><tr>
		<td>Title</td>
		<td>Category</td>
		<td>Type</td>
		<td>Author</td>
		<td>Sort by/Reverse</td>
	</tr>
	<!-- <tr><td>Status</td><td>
		<select name="artcode_marker_search_status">
			<option value="">Any</option>
			<option value="publish">Published</option>
		</select></td></tr> -->
	<tr>
		<td><input type="search" name="artcode_marker_search_search"/></td>
   		<td><select name="artcode_marker_search_category">
			<option value="0">&mdash;Any&mdash;</option>
<?php artcode_category_options_html(); 
?>		</select></td>
		<td><select name="artcode_marker_search_type">
			<option value="post">Post</option>
			<option value="page">Page</option>
			<option value="anywhere_map_post">Map Post</option>
		</select></td>
		<td><select name="artcode_marker_search_author">
			<option value="1">You</option>
			<option value="0">Anyone</option>
		</select></td>
		<td><select name="artcode_marker_search_orderby">
			<option value="title">Title</option>
			<option value="date">Date</option>
			<option value="modified">Modified</option>
		</select>/<input name="artcode_marker_search_reverse" type="checkbox"/></td>
	</tr>
	<tr>
		<td id="artcode_marker_search_spinner"><input type="button" value="Search" name="artcode_marker_search" id="artcode_marker_search_id"/><span class="spinner"></span></td>
	</tr>
	</tbody></table>
	<div id="artcode_marker_search_result"></div>
<?php
}
function artcode_item_custom_box( $post ) {
    $value = get_post_meta( $post->ID, '_artcode_code', true ); 
?>
    <label for="artcode_item_code">Code</label><br/>
    <input type="text" name="artcode_item_code" id="artcode_item_code" value="<?php echo $value ?>"/><br/>
<?php
    $showDetail = get_post_meta( $item->ID, '_artcode_show_detail', true );
    if ( $showDetail == '')
        $showDetail = '1';
?>
    <label for="artcode_item_show_detail">Show Detail Screen</label><br/>
    <select name="artcode_item_show_detail" id="artcode_item_show_detail" class="postbox">
        <option value="0">No</option>
        <option value="1" <?php if ( '1' == $showDetail ) echo 'selected'; ?>>Yes</option>
    </select><br/>
<?php
    $value = get_post_meta( $post->ID, '_artcode_action', true );
?>
    <label for="artcode_item_action">URL (if not this page)</label><br/>
    <input type="text" name="artcode_item_action" id="artcode_item_action" value="<?php echo $value ?>"/><br/>
<?php
}
add_action( 'save_post', 'artcode_save_postdata' );
function artcode_save_postdata( $post_id ) {
	if ( array_key_exists('artcode_marker_ids_shown', $_POST ) ) {
		$marker_ids = array();
		for ($i = 0; true; $i++) {
			if ( array_key_exists('artcode_marker_id-'.$i, $_POST ) )
				$marker_ids[] = intval( $_POST['artcode_marker_id-'.$i] );
			else
				break;
		}
	        update_post_meta( $post_id, '_artcode_marker_ids', json_encode( $marker_ids ) );
	}
    if ( array_key_exists('artcode_item_code', $_POST ) ) {
        update_post_meta( $post_id,
           '_artcode_item_code',
            $_POST['artcode_item_code']
        );
    }
    if ( array_key_exists('artcode_item_show_detail', $_POST ) ) {
        update_post_meta( $post_id,
           '_artcode_item_show_detail',
            $_POST['artcode_item_show_detail']
        );
    }
    if ( array_key_exists('artcode_item_action', $_POST ) ) {
        update_post_meta( $post_id,
           '_artcode_item_action',
            $_POST['artcode_item_action']
        );
    }
    if ( array_key_exists('artcode_custom_box_shown', $_POST ) ) {
//artcode_regions_min
        $value = array_key_exists('artcode_regions_min', $_POST ) ? $_POST['artcode_regions_min'] : DEFAULT_REGIONS_MIN;
        update_post_meta( $post_id, '_artcode_regions_min', $value );
//artcode_regions_max
        $value = array_key_exists('artcode_regions_max', $_POST ) ? $_POST['artcode_regions_max'] : DEFAULT_REGIONS_MAX;
        update_post_meta( $post_id, '_artcode_regions_max', $value );
//artcode_max_region_value
        $value = array_key_exists('artcode_max_region_value', $_POST ) ? $_POST['artcode_max_region_value'] : DEFAULT_MAX_REGION_VALUE;
        update_post_meta( $post_id, '_artcode_max_region_value', $value );
//artcode_checksum
        $value = array_key_exists('artcode_checksum', $_POST ) ? $_POST['artcode_checksum'] : DEFAULT_CHECKSUM;
        update_post_meta( $post_id, '_artcode_checksum', $value );
    }
}
// get combined marker ids
function artcode_get_marker_ids( $artcode_id ) {
	$marker_ids = array();
	$specific_ids = get_post_meta( $app_id, '_artcode_marker_ids', true ); 
	if ( $specific_ids ) 
		$specific_ids = json_decode( $specific_ids, true );
	if ( is_array( $specific_ids ) ) {
		foreach ( $specific_ids as $id ) {
			$marker_ids[] = $id;
		}
	}
	return $marker_ids;
}
add_filter( 'template_include', 'artcode_include_template_function', 1 );
function artcode_include_template_function( $template_path ) {
    if ( get_post_type() == 'artcode' ) {
        if ( is_single() ) {
            // checks if the file exists in the theme first,
            // otherwise serve the file from the plugin
            if ( $theme_file = locate_template( array ( 'single-artcode.php' ) ) ) {
                $template_path = $theme_file;
            } else {
                $template_path = plugin_dir_path( __FILE__ ) . '/single-artcode.php';
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
function artcode_get_iconurl( $thumbid ) {
	$iconurl = wp_get_attachment_url( $thumbid );
	if ( $iconurl !== false )
		return $iconurl;
	return null;
}
function artcode_ajax_marker_search() {
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
		$artcode = get_post_meta( $post->ID, '_artcode_code', true );
		$res[] = array(
			'ID' => $post->ID,
			'post_title' => $post->post_title,
			'post_type' => $post->post_type,
			'post_status' => $post->post_status,
			'post_date_gmt' => $post->post_date_gmt,
			'post_modified_gmt' => $post->post_modified_gmt,
			'post_author' => $post->post_author, 
			'_artcode_code' => $artcode,
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
	add_action( 'wp_ajax_artcode_marker_search', 'artcode_ajax_marker_search' );
}

