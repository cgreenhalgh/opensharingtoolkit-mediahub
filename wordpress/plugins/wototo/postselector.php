<?php
/*  Post Selector - could be a separate plugin at some point.
 *
 * Meant to support an initial (d3) interface for sorting/selecting posts, e.g. 
 * selecting posts to include within an app.
 *
 * To do:
 * - add option to publish selected posts
 * - add option to poll for new items
 * - add option to broadcast view via (say) Union to slave displays
 * - add option to include only draft items 
 * - add exit animation
 */
add_action( 'init', 'postselector_create_post_types' );
//Register the app post type
function postselector_create_post_types() {
    register_post_type( 'postselector',
        array(
            'labels' => array(
                'name' => __( 'PostSelector' ),
                'singular_name' => __( 'PostSelector' ),
                'add_new_item' => __( 'Add New PostSelector' ),
                'edit_item' => __( 'Edit PostSelector' ),
                'new_item' => __( 'New PostSelector' ),
                'view_item' => __( 'View PostSelector' ),
                'search_items' => __( 'Search PostSelectors' ),
                'not_found' => __( 'No PostSelector found' ),
                'not_found_in_trash' => __( 'No PostSelector found in Trash' ),
                'all_items' => __( 'All PostSelectors' )
            ),
            'description' => __( 'PostSelector view, for selecting posts, e.g. for Wototo apps' ),
            'public' => true,
            'has_archive' => true,
            'supports' => array( 'title', 'editor'  ),
	    'menu_icon' => 'dashicons-grid-view',
        )
    );
}

/* Adds a meta box to the post edit screen */
add_action( 'add_meta_boxes', 'postselector_add_custom_box' );
function postselector_add_custom_box() {
    add_meta_box(
        'postselector_box_id',        // Unique ID
        'PostSelector Settings', 	    // Box title
        'postselector_custom_box',  // Content callback
        'postselector',               // post type
        'normal', 'high'
    );
}
function postselector_custom_box( $post ) {
    $postselector_input_category = get_post_meta( $post->ID, '_postselector_input_category', true );
?>
    <label for="postselector_input_category_id">Category of posts to select from:</label><br/>
    <select name="postselector_input_category" id="postselector_input_category_id">
        <option value="0"><?php printf( '&mdash; %s &mdash;', esc_html__( 'Select a Category' ) ); ?></option>
<?php wototo_category_options_html( $postselector_input_category ) 
?>  </select><br/>
    <!-- <p>Current value: <?php echo $postselector_input_category ?></p> -->
    <label for="postselector_output_app_id">Output selection to Wototo app (editable by you):</label></br/>
    <select name="postselector_output_app" id="postselector_output_app_id">
        <option value="0"><?php printf( '&mdash; %s &mdash;', esc_html__( 'None' ) ); ?></option>
<?php
	$postselector_output_app = get_post_meta( $post->ID, '_postselector_output_app', true );
	$apps = get_posts( array( 'post_type' => 'wototo_app', 'orderby' => 'post_title' ) );
	foreach ( $apps as $app ) {
		if ( current_user_can( 'edit_post', $app->ID ) ) {
			$selected = $postselector_output_app == $app->ID ? 'selected' : '';
?>        <option value="<?php echo $app->ID ?>" <?php echo $selected ?> ><?php echo esc_html( $app->post_title ) ?></option>
<?php		}
	}
?>    </select><br/>
<?php
    $postselector_use_union = get_post_meta( $post->ID, '_postselector_use_union', true );
    $postselector_union_url = get_post_meta( $post->ID, '_postselector_union_url', true );
?>
    <label><input type="hidden" name="postselector_use_union_shown" value="1"/>
       <input type="checkbox" name="postselector_use_union" <?php echo $postselector_use_union ? 'checked' : '' ?> />Share selection via Union server:</label><br/>
    <input type="text" name="postselector_union_url" value="<?php esc_attr( $postselector_union_url ) ?>" placeholder="tryunion.com" /><br/>
<?php
}
add_action( 'save_post', 'postselector_save_postdata' );
function postselector_save_postdata( $post_id ) {
    if ( array_key_exists('postselector_input_category', $_POST ) ) {
        update_post_meta( $post_id,
           '_postselector_input_category',
            $_POST['postselector_input_category']
        );
    }
    if ( array_key_exists('postselector_output_app', $_POST ) ) {
        update_post_meta( $post_id,
           '_postselector_output_app',
            $_POST['postselector_output_app']
        );
    }
    if ( array_key_exists('postselector_use_union_shown', $_POST ) ) {
	$value = array_key_exists('postselector_use_union', $_POST ) && $_POST['postselector_use_union'] ? 1 : 0;
        update_post_meta( $post_id,
           '_postselector_use_union', $value );
    }
    if ( array_key_exists('postselector_union_url', $_POST ) ) {
        update_post_meta( $post_id,
           '_postselector_union_url', stripslashes( $_POST['postselector_union_url'] ) );
    }
}
add_filter( 'template_include', 'postselector_include_template_function', 1 );
function postselector_include_template_function( $template_path ) {
    if ( get_post_type() == 'postselector' ) {
        if ( is_single() ) {
            // checks if the file exists in the theme first,
            // otherwise serve the file from the plugin
            if ( $theme_file = locate_template( array ( 'single-postselector.php' ) ) ) {
                $template_path = $theme_file;
            } else {
                $template_path = plugin_dir_path( __FILE__ ) . '/single-postselector.php';
            }
        }
    }
    return $template_path;
}
// Ajax for get json...
function postselector_get_posts() {
	global $wpdb;
	check_ajax_referer( 'postselector-ajax', 'security' );
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
	if ( ! current_user_can( 'read_post', $post->ID ) ) {
		echo '# Not permitted: post '.$id.' is not readable for this user';
		wp_die();
	}
	if ( $post->post_type != 'postselector' ) {
		echo '# Invalid request: post '.$id.' is not an app ('.$post->post_type.')';
		wp_die();
	}
	$postselector_output_app = get_post_meta( $post->ID, '_postselector_output_app', true );
	$selected_ids = array();
	$rejected_ids = array();
	if ( $postselector_output_app ) {
		$app = get_post(intval($postselector_output_app));
		if ( !$app ) {
			echo '# Invalid request: output app '.$$postselector_output_app.' not found';
			wp_die();
		}
		$ids = get_post_meta( $app->ID, '_postselector_selected_ids', true );
		if ( $ids ) {
			$ids = json_decode( $ids, true );
			if ( is_array( $ids ) ) 
				$selected_ids = $ids;
			// else error... not sure how to signal it, though!
		}
		$ids = get_post_meta( $app->ID, '_postselector_rejected_ids', true );
		if ( $ids ) {
			$ids = json_decode( $ids, true );
			if ( is_array( $ids ) ) 
				$rejected_ids = $ids;
			// else error... not sure how to signal it, though!
		}
	}
	$postselector_input_category = get_post_meta( $post->ID, '_postselector_input_category', true );
	$posts = array();
	if ( $postselector_input_category ) {
		$args = array( 'category' => $postselector_input_category, 
			'post_type' => array( 'post', 'page', 'anywhere_map_post' )
		);
		$ps = get_posts( $args );
		foreach ($ps as $p) {
			if ( current_user_can( 'read_post', $p->ID ) ) {
				$thumbid = get_post_thumbnail_id($p->ID);
				$selected = null;
				$rank = array_search( $p->ID, $selected_ids );
				if ( $rank !== FALSE ) 
					$selected = TRUE;
				else {
					$rank = array_search( $p->ID, $rejected_ids );
					if ( $rank !== FALSE )
						$selected = FALSE;
				}
				if ( $rank === FALSE )
					$rank = null;
				$selected = in_array( $p->ID, $selected_ids ) ? true : ( in_array( $p->ID, $rejected_ids ) ? false : null ); 
				$post = array("title" => $p->post_title, "id" => $p->ID, "content" => filter_content( $p->post_content ), 
					"status" => $p->post_status, "type" => $p->post_type,
					"iconurl" => ( $thumbid ? wp_get_attachment_url( $thumbid ) : null ), 
					"selected" => $selected, "rank" => $rank, );
				$posts[] = $post;
			}
		}
	}
	header( "Content-Type: application/json" );
	echo json_encode( $posts );
	wp_die();
}
// update post modified data
// based on https://core.trac.wordpress.org/attachment/ticket/24266/24266.3.diff
function update_post_modified_date( $post_id ) {
	$post_modified     = current_time( 'mysql' ); 
	$post_modified_gmt = current_time( 'mysql', 1 ); 
	global $wpdb; 
	$updated_fields = array( 'post_modified' => $post_modified, 
		'post_modified_gmt' => $post_modified_gmt ); 
	$where = array( 'ID' => $post_id ); 
	$wpdb->update( $wpdb->posts, $updated_fields, $where );
	clean_post_cache( $post_id ); 
}
// Ajax for save...
function postselector_save() {
	global $wpdb;
	check_ajax_referer( 'postselector-ajax', 'security' );
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
	if ( ! current_user_can( 'edit_post', $post->ID ) ) {
		echo '# Not permitted: post '.$id.' is not editable for this user';
		wp_die();
	}
	if ( $post->post_type != 'postselector' ) {
		echo '# Invalid request: post '.$id.' is not an app ('.$post->post_type.')';
		wp_die();
	}
	$jchoices = $_POST['choices'];
	if ( !$jchoices ) {
		echo '# Invalid request: choices not specified';
		wp_die();
	}
        $choices = json_decode( stripslashes( $jchoices ), true );
        if ( ( !is_array( $choices ) && !is_object( $choices ) ) || !is_array( $choices['selected'] ) || !is_array( $choices['rejected'] ) ) {
		echo '# Invalid request: choices invalid: '.$jchoices.': '.gettype($choices);
		wp_die();
	}
	// output to app
	$postselector_output_app = get_post_meta( $post->ID, '_postselector_output_app', true );
	if ( $postselector_output_app ) {
		$app = get_post(intval($postselector_output_app));
		if ( !$app ) {
			echo '# Invalid request: output app '.$$postselector_output_app.' not found';
			wp_die();
		}
		if ( !current_user_can( 'edit_post', $app->ID ) ) {
			echo '# Not permitted: output app '.$app->ID.' is not editable for this user';
			wp_die();
		}
	        update_post_meta( $app->ID, '_postselector_selected_ids',
	            json_encode( $choices['selected'] ) );
	        update_post_meta( $app->ID, '_postselector_rejected_ids',
	            json_encode( $choices['rejected'] ) );
		update_post_modified_date( $app->ID );
	}

	header( "Content-Type: application/json" );
	echo 'true';
	wp_die();
}
if ( is_admin() ) {
    add_action( 'wp_ajax_postselector_get_posts', 'postselector_get_posts' );
    add_action( 'wp_ajax_postselector_save', 'postselector_save' );
}

