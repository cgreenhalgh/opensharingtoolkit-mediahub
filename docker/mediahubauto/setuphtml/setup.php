<?php
$username = $_POST['username'];
$password = $_POST['password'];
$instance = $_POST['instance'];
if (!$instance)
  $instance = "wototo";
function returnError($code, $title, $msg) {
  http_response_code($code);
  ?><HTML>
<HEAD>
<TITLE><?php echo $title ?></TITLE>
</HEAD>
<BODY BGCOLOR="#FFFFFF" TEXT="#000000">
<H1><?php echo $title ?></H1><p>Sorry, there was a problem doing that: <?php echo $msg ?>. Please <a href="/">Try again</a>.</p>
</BODY>
</HTML><?php 
  exit();
}

if (!$username || !$password) {
  returnError(400, "Bad request", "username or password not specified");
  exit();
}
$tmpdir = sys_get_temp_dir();
echo "tmpdir=".$tmpdir;
/* create /home/root/opensharingtoolkit-mediahub/instance */
echo "whoami? ".exec('whoami');
$fnameinstance = tempnam($tmpdir,"instance");
echo "create /home/root/opensharingtoolkit-mediahub/instance (".$instance.")";
if (file_put_contents($fnameinstance, $instance)===FALSE) {
  returnError(500, "Server error", "Could not create instance file");
  exit();
}
/* create /etc/nginx/conf/htpasswd */
$cryptpassword = crypt($password, base64_encode($password));
$entry = $username.":".$cryptpassword;
$fnamehtpasswd = tempnam($tmpdir,"htpasswd");
echo "create /etc/nginx/conf/htpasswd (".$entry.")";
if (file_put_contents($fnamehtpasswd, $entry)===FALSE) {
  returnError(500, "Server error", "Could not create htpasswd file");
  exit();
}
/* create/replace /etc/nginx/sites-available/default */
echo "read /home/root/opensharingtoolkit-mediahub/docker/mediahub/nginx-mediahub.template";
$template = file_get_contents("/home/root/opensharingtoolkit-mediahub/docker/mediahub/nginx-mediahub.template");
if ($template===FALSE) {
  returnError(500, "Server error", "Could not read nginx template file");
  exit();
}
$config = str_replace("#{NAME}", $instance, $template);
echo "write /etc/nginx/sites-available/default (".$config.")";
$fnamedefault = tempnam($tmpdir,"default");
if (file_put_contents($fnamedefault, $config)===FALSE) {
  returnError(500, "Server error", "Could not create nginx config file");
  exit();
}
/* copy... */
/* signal nginx: nginx -s reload */
$cmd = "/home/root/setupscripts/copyfiles ".$fnameinstance." ".$fnamehtpasswd." ".$fnamedefault;
echo "exec /home/root/setupscripts/copyfiles";
$exitcode = -1;
$output = array();
$out = exec($cmd, $output, $exitcode);
echo "setup.sh returned ".$exitcode.": ".$out;
if ($exitcode!==0) {
  returnError(500, "Server error", "Could not copy new files");
  exit();
}
?><HTML>
<HEAD>
<TITLE>Wototo Setup</TITLE>
</HEAD>
<BODY>
<H1>Wototo Setup</H1>
<p>Keep a copy of the username and password!</p>
<p>Username: <?php echo $username ?></p>
<p>Password: <?php echo $password ?></p>
<p>Instance: <?php echo $instance ?></p>
<p><a href="/?ts=<?php echo time(); ?>">Get started...</a></p>
</BODY>
</HTML>

