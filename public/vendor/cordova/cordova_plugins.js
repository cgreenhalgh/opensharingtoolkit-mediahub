cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.opensharingtoolkit.cordova.aestheticodes/www/aestheticodes.js",
        "id": "org.opensharingtoolkit.cordova.aestheticodes.Aestheticodes",
        "clobbers": [
            "aestheticodes"
        ]
    },
    {
        "file": "plugins/com.phonegap.plugins.barcodescanner/www/barcodescanner.js",
        "id": "com.phonegap.plugins.barcodescanner.BarcodeScanner",
        "clobbers": [
            "cordova.plugins.barcodeScanner"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "org.opensharingtoolkit.cordova.aestheticodes": "0.1.0",
    "com.phonegap.plugins.barcodescanner": "2.0.1"
}
// BOTTOM OF METADATA
});