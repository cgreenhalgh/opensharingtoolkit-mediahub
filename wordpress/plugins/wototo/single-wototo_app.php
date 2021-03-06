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
		<main id="main" class="site-content" role="main">

		<?php
		// Start the loop.
		while ( have_posts() ) : the_post();

			/*
			 * Include the post format-specific template for the content. If you want to
			 * use this in a child theme, then include a file called called content-___.php
			 * (where ___ is the post format) and that will be used instead.
			 */
			get_template_part( 'content', get_post_format() );

			$page_url = get_permalink( $post->ID );
			$view_url = $page_url;
			if ( strpos( $view_url, '?' ) === FALSE )
				$view_url .= '?wototo';
			else
				$view_url .= '&wototo';
			$ix = strpos( $view_url, ':' );
			$wototo_url = 'x-wototo:'.substr( $view_url, $ix+1 ).'=1';
			
?>
	<div class="comments-area wototo-links">
		<div class="">
<script language="javascript" type="text/javascript">
function popupqr(url) {
	var win=window.open('http://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H&chl='+encodeURIComponent(url),'qr','height=300,width=300,left='+(screen.width/2-150)+',top='+(screen.height/2-150)+',titlebar=no,toolbar=no,location=no,directories=no,status=no,menubar=no');
	if (window.focus) {win.focus()}
	return false;
}
</script>
			<h2>Wototo App Links <a class="wototo-link-qr" onclick="return popupqr('<?php echo $page_url ?>')">QR</a></h2>
			<p><a class="wototo-link" href="<?php echo $view_url ?>">Open in Browser</a></p>
			<p><a class="wototo-link"  href="<?php echo $wototo_url ?>">Open in WototoPlayer</a>
			<br/><span class="wototo-warning">Experimental: Android-only, requires seperate install</span></p>
			<!-- <p><a class="wototo-link"  href="<?php echo $view_url ?>=2">Open in WototoPlayer via download</a>
			<br/><span class="wototo-warning">Experimental: Android-only, requires seperate install</span></p> -->
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

<?php 
get_sidebar( 'content' );
get_sidebar();
get_footer(); ?>
