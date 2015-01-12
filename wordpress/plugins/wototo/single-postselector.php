<?php
/**
 * The template for displaying a single PostSelector
 */
$ajax_nonce = wp_create_nonce( "postselector-ajax" );

echo '<?'?>xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
    "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
        <meta charset="UTF-8">
        <title>PostSelector</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<script src="<?php echo plugins_url( 'vendor/modernizr/modernizr.js', __FILE__ ) ?>"></script>
        <script type="text/javascript">window.postselector = {nonce:'<?php echo $ajax_nonce ?>',
          ajaxurl:'<?php echo admin_url( 'admin-ajax.php' ) ?>', ids:[]};</script>
	<link rel="stylesheet" href="<?php echo plugins_url( 'postselector.css', __FILE__ ) ?>" />
    </head>
    <body>
        <script src="<?php echo plugins_url( 'vendor/jquery/dist/jquery.min.js', __FILE__ ) ?>"></script>
        <script src="<?php echo plugins_url( 'vendor/d3/d3.min.js', __FILE__ ) ?>" charset="utf-8"></script>
<?php	
// Start the loop.
while ( have_posts() ) : the_post();
?>        <script type="text/javascript">window.postselector.ids.push('<?php echo $post->ID; ?>');</script>
          <p class="title"><input type="submit" value="Save Selection" id="submit-<?php echo $post->ID ?>"><?php echo esc_html( the_title() ) ?></p>
<?php
endwhile;

?>        <svg class="postselector" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 2000" preserveAspectRatio="xMidYMin slice">
	  <line class="lane" x1="333" y1="0" x2="333" y2="1000" />
	  <line class="lane" x1="667" y1="0" x2="667" y2="1000" />
          <!-- <g class"post" transform="translate(10 10)">
             <rect class="post" x="0" y="0" width="280" height="50" rx="5" ry="5" />
             <text class="post" x="10" y="0" dy="1em" width="260" text-overflow="ellipsis">Some text of interest</text>
          </g> -->
        </svg>
        <script src="<?php echo plugins_url( 'postselector.js', __FILE__ ) ?>"></script>
    </body>
</html>
