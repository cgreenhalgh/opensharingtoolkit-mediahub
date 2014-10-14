<?php /* redirect ? url=... */
$url = $_GET['url'];
if (!$url) {
  http_response_code(400);
  ?><HTML>
<HEAD>
<TITLE>Bad request</TITLE>
</HEAD>
<BODY BGCOLOR="#FFFFFF" TEXT="#000000">
<H1>Bad request</H1>Sorry, there was something wrong with that link.
</BODY>
</HTML><?php 
  exit();
}
http_response_code(301);
header("Location: $url");
header("Cache-Control: no-cache, no-store, max-age=0, must-revalidate");
header("Pragma: no-cache");
header("Expires: Fri, 01 Jan 1990 00:00:00 GMT");
header("Content-Type: text/html; charset=UTF-8");
?><HTML>
<HEAD>
<TITLE>Moved Permanently</TITLE>
</HEAD>
<BODY BGCOLOR="#FFFFFF" TEXT="#000000">
<H1>Moved Permanently</H1>
The document has moved <A HREF="<?php echo $url ?>">here</A>.
</BODY>
</HTML>

