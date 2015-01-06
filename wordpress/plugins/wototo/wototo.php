<?php
/**
 * Plugin Name: wototo
 * Plugin URI: https://github.com/cgreenhalgh/opensharingtoolkit-mediahub/tree/master/docs/wordpress.md
 * Description: Create simple HTML5 web apps from wordpress content (pages and posts). The web apps are intended for use on recent smart phones and tablets.
 * Version: 0.1.1
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
//'menu_icon' => plugins_url( 'images/image.png', __FILE__ )
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
   <label for="wototo_show_about">Show About Screen</label>
<?php $value = get_post_meta( $post->ID, '_wototo_show_about', true ); ?>
    <select name="wototo_show_about" id="wototo_show_about" class="postbox">
        <option value="">No</option>
        <option value="1" <?php if ( '1' == $value ) echo 'selected'; ?>>Yes</option>
    </select>
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
// Ajax for get json...
function wototo_get_json() {
	global $wpdb;
	$id = intval( $_POST['id'] );
	if ( !$id ) {
		echo '{"error":"Invalid request: id not specified"}';
		wp_die();
	}
	$post = get_post($id);
	if ( $post === null ) {
		echo '{"error":"Not found: post '.$id.' not found"}';
		wp_die();
	}
        $res = array(
		"_id" => $id,
        );
	if ( $post->post_status != 'publish' ) {
		echo '{"error":"Not permitted: post '.$id.' is not published/public ('.$post->post_status.')"}';
		wp_die();
	}
	if ( $post->post_type == 'wototo_app' ) {
		$res['type'] = 'app';
		$res['title'] = $post->post_title;
		$res['description'] = $post->post_content;
		// post_modified, post_status
		$showAbout = get_post_meta( $post->ID, '_wototo_show_about', true ) == '1';
		$res['showAbout'] = $showAbout;
		if ( $showAbout )
			// default to description
			$res['aboutText'] = $post->post_content;
		// danger - needs 64 bit!
		$timezone = new DateTimeZone('UTC');
		$date = new DateTime($post->post_date_gmt, $timezone);
		$res['createdtime'] = $date->getTimestamp()*1000;
		$res['thingIds'] = array();
		$res['showShare'] = FALSE;
		$res['showLocation'] = FALSE;
		$res['showUser'] = FALSE;
	}
	else {
		echo '{"error":"Unimplemented: support for post_type '.$post->post_type.'"}';
		wp_die(); 
	}
	echo json_encode($res);
	wp_die();
}
if ( is_admin() ) {
	add_action( 'wp_ajax_wototo_get_json', 'wototo_get_json' );
	add_action( 'wp_ajax_nopriv_wototo_get_json', 'wototo_get_json' );
}

