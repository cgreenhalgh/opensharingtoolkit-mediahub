<?php
/**
 * Standard view of wototo_app, based on Twenty_Fifteen single
 */

if ( array_key_exists('wototo', $_REQUEST ) ) {
	require( dirname(__FILE__) . '/custom-wototo_app.php' );
	return;
}

wp_enqueue_style( 'wototo-css', plugins_url( 'wototo.css', __FILE__ ) );

get_header(); ?>

	<div id="primary" class="content-area">
		<main id="main" class="site-main" role="main">

		<?php
		// Start the loop.
		while ( have_posts() ) : the_post();

			/*
			 * Include the post format-specific template for the content. If you want to
			 * use this in a child theme, then include a file called called content-___.php
			 * (where ___ is the post format) and that will be used instead.
			 */
			get_template_part( 'content', get_post_format() );

			$view_url = get_permalink( $post->ID );
			if ( strpos( $view_url, '?' ) === FALSE )
				$view_url .= '?wototo';
			else
				$view_url .= '&wototo';
			$ix = strpos( $view_url, ':' );
			$wototo_url = 'x-wototo:'.substr( $view_url, $ix+1 ).'=1';
			
?>
	<div class="comments-area wototo-links">
		<div class="">
			<h2>Wototo App Links</h2>
			<p><a href="<?php echo $view_url ?>">Open in Browser</a></p>
			<p><a href="<?php echo $wototo_url ?>">Open in WototoPlayer via URL</a><br/><span class="wototo-warning">Experimental: Android-only, requires seperate install</span></p>
			<p><a href="<?php echo $view_url ?>=2">Open in WototoPlayer via download</a><br/><span class="wototo-warning">Experimental: Android-only, requires seperate install</span></p>
		</div>
	</div>
<?php
			// If comments are open or we have at least one comment, load up the comment template.
			if ( comments_open() || get_comments_number() ) :
				comments_template();
			endif;

			// Previous/next post navigation.
			if (function_exists('the_post_navigation')) {
				the_post_navigation( array(
					'next_text' => '<span class="meta-nav" aria-hidden="true">' . __( 'Next', 'twentyfifteen' ) . '</span> ' .
						'<span class="screen-reader-text">' . __( 'Next post:', 'twentyfifteen' ) . '</span> ' .
						'<span class="post-title">%title</span>',
					'prev_text' => '<span class="meta-nav" aria-hidden="true">' . __( 'Previous', 'twentyfifteen' ) . '</span> ' .
						'<span class="screen-reader-text">' . __( 'Previous post:', 'twentyfifteen' ) . '</span> ' .
						'<span class="post-title">%title</span>',
				) );
			}

		// End the loop.
		endwhile;
		?>

		</main><!-- .site-main -->
	</div><!-- .content-area -->

<?php get_footer(); ?>
