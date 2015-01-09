cordova.define("org.opensharingtoolkit.cordova.aestheticodes.Aestheticodes", function(require, exports, module) { // Aestheticodes scan javascript API
//
// Chris Greenhalgh, The University of nottingham
//

var exec = require("cordova/exec");

var aestheticodes = {
scan: function (success, error) {
	console.log("scan...");
	if (typeof success != "function")
		success = function () { console.log("aestheticodes.scan success!"); }
	if (typeof error != "function")
		error = function () { console.log("aestheticodes.scan error"); }
	exec(success, error, "Aestheticodes", "scan", []);
}
}
module.exports = aestheticodes;

});
