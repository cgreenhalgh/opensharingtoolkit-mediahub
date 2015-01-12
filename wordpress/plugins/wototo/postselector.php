<?php
/*  Post Selector - could be a separate plugin at some point.
 *
 * Meant to support an initial (d3) interface for sorting/selecting posts, e.g. 
 * selecting posts to include within an app.
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
/**
 * Walker to output an unordered list of category option elements.
 * based on Walker_Category_Checklist in wp-admin/includes/meta-boxes.php
 */
class Walker_Category_Options extends Walker {
	public $tree_type = 'category';
	public $db_fields = array ('parent' => 'parent', 'id' => 'term_id'); //TODO: decouple this

	/**
	 * Starts the list before the elements are added.
	 *
	 * @see Walker:start_lvl()
	 *
	 * @since 2.5.1
	 *
	 * @param string $output Passed by reference. Used to append additional content.
	 * @param int    $depth  Depth of category. Used for tab indentation.
	 * @param array  $args   An array of arguments. @see wp_terms_checklist()
	 */
	public function start_lvl( &$output, $depth = 0, $args = array() ) {
		//$indent = str_repeat("&mdash; ", $depth);
		//$output .= "$indent<ul class='children'>\n";
	}

	/**
	 * Ends the list of after the elements are added.
	 *
	 * @see Walker::end_lvl()
	 *
	 * @since 2.5.1
	 *
	 * @param string $output Passed by reference. Used to append additional content.
	 * @param int    $depth  Depth of category. Used for tab indentation.
	 * @param array  $args   An array of arguments. @see wp_terms_checklist()
	 */
	public function end_lvl( &$output, $depth = 0, $args = array() ) {
		//$output .= "$indent</ul>\n";
	}

	/**
	 * Start the element output.
	 *
	 * @see Walker::start_el()
	 *
	 * @since 2.5.1
	 *
	 * @param string $output   Passed by reference. Used to append additional content.
	 * @param object $category The current term object.
	 * @param int    $depth    Depth of the term in reference to parents. Default 0.
	 * @param array  $args     An array of arguments. @see wp_terms_checklist()
	 * @param int    $id       ID of the current term.
	 */
	public function start_el( &$output, $category, $depth = 0, $args = array(), $id = 0 ) {
		if ( empty( $args['taxonomy'] ) ) {
			$taxonomy = 'category';
		} else {
			$taxonomy = $args['taxonomy'];
		}
		$selected = !empty( $args['current_value'] ) ? ( $args['current_value'] == $category->term_id ? 'selected' : '') : '';
		/** This filter is documented in wp-includes/category-template.php */
		$output .= "\n<option value='{$category->term_id}' $selected>" .
			esc_html( apply_filters( 'the_category', $category->name ) );
	}

	/**
	 * Ends the element output, if needed.
	 *
	 * @see Walker::end_el()
	 *
	 * @since 2.5.1
	 *
	 * @param string $output   Passed by reference. Used to append additional content.
	 * @param object $category The current term object.
	 * @param int    $depth    Depth of the term in reference to parents. Default 0.
	 * @param array  $args     An array of arguments. @see wp_terms_checklist()
	 */
	public function end_el( &$output, $category, $depth = 0, $args = array() ) {
		$output .= "</option>\n";
	}
}
function postselector_category_options( $current_value ) {
    // see wp_terms_checklist
    $walker = new Walker_Category_Options;
    $taxonomy = 'category';
    $tax = get_taxonomy( $taxonomy );
    $categories = (array) get_terms( $taxonomy, array( 'get' => 'all' ) );
    $args = array( 'taxonomy' => $taxonomy, 'current_value' => $current_value );
    echo call_user_func_array( array( $walker, 'walk' ), array( $categories, 0, $args ) );
}
function postselector_custom_box( $post ) {
    $postselector_input_category = get_post_meta( $post->ID, '_postselector_input_category', true );
?>
    <label for="postselector_input_category_id">Category of posts to select from:</label><br/>
    <select name="postselector_input_category" id="postselector_input_category_id">
        <option value="0"><?php printf( '&mdash; %s &mdash;', esc_html__( 'Select a Category' ) ); ?></option>
<?php postselector_category_options( $postselector_input_category ) 
?>  </select><br/>
    <!-- <p>Current value: <?php echo $postselector_input_category ?></p> -->
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
				$post = array("title" => $p->post_title, "id" => $p->ID, "content" => filter_content( $p->post_content ), 
					"status" => $p->post_status, "type" => $p->post_type,
					"iconurl" => ( $thumbid ? wp_get_attachment_url( $thumbid ) : null ), );
				$posts[] = $post;
			}
		}
	}
	header( "Content-Type: application/json" );
	echo json_encode( $posts );
	wp_die();
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
	// TODO edit output, esp. application thingIds
	header( "Content-Type: application/json" );
	echo 'true';
	wp_die();
}
if ( is_admin() ) {
    add_action( 'wp_ajax_postselector_get_posts', 'postselector_get_posts' );
    add_action( 'wp_ajax_postselector_save', 'postselector_save' );
}

