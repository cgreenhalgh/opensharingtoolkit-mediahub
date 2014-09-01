// config.js
console.log( "Window.location = "+window.location.href );
var pathname = window.location.pathname;
var ix = pathname.indexOf('/_design/');
if (ix>=0) {
  pathname = pathname.substring(0, ix);
} else {
  alert("The page URL was not what was expected; this probably won't work! ("+pathname+")");
  console.log("The page URL was not what was expected; this probably won't work! ("+pathname+")");
  ix = pathname.lastIndexOf('/');
  if (ix>=0)
    pathname = pathname.substring(0,ix);
}
var publicurl, uploadurl, dburl, submissionurl, serversurl;
var hostname = window.location.hostname;
if (hostname==='127.0.0.1' || hostname==='localhost') {
  // debug/dev
  dburl = "http://"+hostname+":5984"+pathname;
  publicurl = "http://"+hostname+":8080/public";
  serversurl = null;
  uploadurl = "http://"+hostname+":8090/upload"
  submissionurl = "http://"+hostname+":8090/submission"
  console.log("Using dev config: dburl="+dburl+", publicurl="+publicurl+", uploadurl="+uploadurl);
} else {
  // production
  dburl = window.location.protocol+"//"+window.location.host+pathname; 
  ix = pathname.lastIndexOf('/');
  if (ix>=0)
    pathname = pathname.substring(0,ix);
  publicurl = "http://"+window.location.host+pathname+"/public"; 
  uploadurl = window.location.protocol+"//"+window.location.host+pathname+"/upload"; 
  serversurl = window.location.protocol+"//"+window.location.host+pathname+"/server"; 
  submissionurl = window.location.protocol+"//"+window.location.host+pathname+"/submission"; 
  console.log("Using production config: dburl="+dburl+", publicurl="+publicurl+", uploadurl="+uploadurl+", submissionurl="+submissionurl+", serversurl="+serversurl);
}
window.mediahubconfig = {
  dburl: dburl,
  publicurl: publicurl,
  uploadurl: uploadurl,
  submissionurl: submissionurl,
  serversurl: serversurl
};
