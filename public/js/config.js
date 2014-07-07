// config.js
var dbname = window.location.pathname.substring(1);
var ix = dbname.indexOf('/');
if (ix>=0) {
  dbname = dbname.substring(0,ix);
}
console.log("config using dbname "+dbname);
window.mediahubconfig = {
  dburl: "http://"+window.location.host+"/"+dbname
};
