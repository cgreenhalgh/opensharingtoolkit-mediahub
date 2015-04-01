<?php
/**
 * Standard view of artcode experience, based on Twenty_Fifteen single
 */

if ( array_key_exists('artcode', $_REQUEST ) ) {
	require( dirname(__FILE__) . '/custom-artcode.php' );
	return;
}

wp_enqueue_style( 'artcode-css', plugins_url( 'artcode.css', __FILE__ ) );

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

			$artcode_url = get_permalink( $post->ID );
			if ( strpos( $artcode_url, '?' ) === FALSE )
				$artcode_url .= '?artcode';
			else
				$artcode_url .= '&artcode';

			
?>
	<div class="comments-area artcode-links">
		<div class="">
<script language="javascript" type="text/javascript">
function popupqr(url) {
	var win=window.open('http://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H&chl='+encodeURIComponent(url),'qr','height=300,width=300,left='+(screen.width/2-150)+',top='+(screen.height/2-150)+',titlebar=no,toolbar=no,location=no,directories=no,status=no,menubar=no');
	if (window.focus) {win.focus()}
	return false;
}
</script>
			<h2>Artcode Experience  Links</h2>
			<p><a class="artcode-link" href="<?php echo $artcode_url ?>">Open in ArtCode Reader</a>
			<a class="artcode-link-qr" onclick="return popupqr('<?php echo $artcode_url ?>')">QR</a></p>
			<br/><span class="artcode-warning">Note: requires seperate install of ArtCode app (Android or iPhone)</span></p>
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
