<?php
/**
 * The template for displaying a single wototo app
 */

// Start the loop.
while ( have_posts() ) : the_post();

	?><h1>App <?php echo $post->ID; ?></h1>
	<?php // End the loop.
	endwhile;
?>

