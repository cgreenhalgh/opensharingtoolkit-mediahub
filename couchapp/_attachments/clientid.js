// set clientid if not set
// requires node-uuid
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) {
    var c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}
function setCookie(cname,cvalue,exdays,path) {
  var d = new Date();
  d.setTime(d.getTime()+(exdays*24*60*60*1000));
  var expires = "expires="+d.toGMTString();
  document.cookie = cname + "=" + cvalue + "; " + expires +"; path="+path;
}
window.clientid = getCookie("mediahub-clientid");
if (window.clientid=="") {
  window.clientid = uuid();
  console.log("Setting new mediahub-clientid: "+window.clientid);
  // 20 years?! site-wide
  setCookie("mediahub-clientid",window.clientid,20*365,"/");
} else {
  console.log("Got mediahub-clientid "+window.clientid);
}

