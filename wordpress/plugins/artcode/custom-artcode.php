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
	$url = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
	$lastModified = mysql2date('U', $post->post_modified_gmt);
	
	$experience = array(
    		"op" => "create",
    		"id" => $url,
    		"version" => $lastModified,
    		"name" => the_title(),
		"description" => filter_content( $post->post_content ),
    		"maxEmptyRegions" => 0,
    		"validationRegions" => 0,
    		"validationRegionValue" => 1,
		"embeddedChecksum" => false,
    		"thresholdBehaviour" => "temporalTile",
	);
//    		"minRegions": 4,
	$value = get_post_meta( $post->ID, '_artcode_regions_min', true );
	if (empty($value))
		$value = DEFAULT_REGIONS_MIN;
	$experience["minRegions"] = intval( $value );
//     		"maxRegions": 10,
	$value = get_post_meta( $post->ID, '_artcode_regions_max', true );
	if (empty($value))
		$value = DEFAULT_REGIONS_MAX;
	$experience["maxRegions"] = intval( $value );

//    		"maxRegionValue": 6,
	$value = get_post_meta( $post->ID, '_artcode_max_region_value', true );
	if (empty($value))
		$value = DEFAULT_MAX_REGION_VALUE;
	$experience["maxRegionValue"] = intval( $value );
//    		"checksumModulo": 1,
	$value = get_post_meta( $post->ID, '_artcode_checksum', true );
	if (empty($value))
		$value = DEFAULT_CHECKSUM;
	$value = intval( $value );
	if ( $value < 2 )
		$value = 1; //off
	$experience["checksumModulo"] = $value;
	// TODO icon separate from image
	$thumbid = get_post_thumbnail_id($post->ID);
	if ( $thumbid ) {
		$experience['image'] = $experience['icon'] = artcode_get_iconurl( $thumbid );
	}
	$markers = array();
	$experience['markers'] = $markers;
	$marker_ids = artcode_get_marker_ids( $post->ID );
	foreach( $marker_ids as $item_id ) {
		$item = get_post( $item_id );
		if ( $item ) {
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
			if ( $artcode ) { 
			    	$showDetail = get_post_meta( $item->ID, '_artcode_show_detail', true );
				if ( $showDetail == '')
					$showDetail = '1';
			    	$action = get_post_meta( $item->ID, '_artcode_actopm', true );
				if ( !$action )
					$action = get_permalink( $item->ID );
				$marker = array( 
					"code" => $artcode,
					"title" => $item->post_title,
					"description" => filter_content( $item->post_content ),
					"showDetail" => ($showDetail) ? true : false,
					"action" => $action
				 );
				$thumbid = get_post_thumbnail_id($item->ID);
				if ( $thumbid ) {
					$marker['image'] = artcode_get_iconurl( $thumbid );
				}
				$markers[] = $marker;
			}
			}
	}
	echo json_encode( $experience );

// End the loop.
endwhile;

