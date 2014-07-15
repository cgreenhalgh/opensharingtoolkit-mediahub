// config.js
console.log( "Window.location = "+window.location.href );
var url = window.location.href;
var ix = url.indexOf('/_design/');
if (ix>=0) {
  url = url.substring(0, ix);
} else {
  alert("The page URL was not what was expected; this probably won't work! ("+url+")");
  console.log("The page URL was not what was expected; this probably won't work! ("+url+")");
  ix = url.lastIndexOf('/');
  if (ix>=0)
    url = url.substring(0,ix);
}
window.mediahubconfig = {
  dburl: url,
  // default dev setting only!! e.g. docker nginxdev
  publicurl: 'http://localhost:8080/public',
  // default dev setting only!! 
  uploadurl: 'http://localhost:8090'
};
