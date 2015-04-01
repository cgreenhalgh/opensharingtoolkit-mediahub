<?php
/**
 * The template for displaying a single artcode experience.
 */
defined('ABSPATH') or die("No script kiddies please!");

define( "DEFAULT_REGIONS_MIN", 4 );
define( "DEFAULT_REGIONS_MAX", 6 );
define( "DEFAULT_CHECKSUM", 0 );
define( "DEFAULT_MAX_REGION_VALUE", 10 );

$artcode = $_REQUEST['artcode'];
	
// serve page with custom mime type to start custom app
header( "Content-Type: application/x-artcode" );

// Start the loop.
while ( have_posts() ) : the_post();
	echo artcode_get_experience( $post );

// End the loop.
endwhile;

