# Wordpress / Wototo Locked Content User Guide

Pages/posts in a Wototo web app can optionally be "locked" so that the end-user can then unlock them by entering a numberic code or scanning a QRcode. In future there will also be options to unlock content with an ArtCode (aestheticode) or by location.

## Basic Usage

To lock a post or page within a wototo app, open the page/post edit view within Wordpress: from the admin menu select `Posts` (for a post) or `All Posts` and then select the specifi post to edit. 

Scroll down to the `App-specific Settings` box; if it is not visible then click `Screen Options` at the top-right and ensure `App-specific Settings` is ticked.

To lock (hide) an item, change `Locked (hidden) when in an app?` from `No` to one of:
- `Initially` - the item will be locked to begin with, but once unlocked will remain unlocked for that device.
- `Always` - the item will always be locked, so the only way to view it will be by repeating the unlock action.

To change wether (how) a locked item can be seen in the app use `When locked, show...`:
- `Nothing` - the item will not be visible at all when locked
- `Item title` - the item will appear in the content list, but will show a locked icon and will not be viewable

Specify at least one way to unlock the item (you can specify more than one):
- `Number` - enter a number, like a PIN - provides an `Enter Code` menu option in the app, which allows the user to enter number(s) to try to unlock content
- `QRcode` - enter a sring url URL - provides a `Scan QRCode` menu option in the app (see notes below)
- `ArtCode` - enter a valid artcode - provides a `Scan Artcode` menu option in the app (see notes below)

Now `Publish` or `Update` the post/page and reload the app that includes it; appropriate menu options should now be enabled and the locked content hidden as appropriate.

## Using QRCodes

A web app within a browser cannot directly access a QRCode reader on the device. In this case the `Scan QRCode` option will prompt the user to type in the URL.

There is also an experimental Android app, WototoPlayer, for hosting Wototo apps. If the app is opened in WototoPlayer then the `Scan QRCode` option works correctly, starting a QRCode scanner.

WototoPlayer needs to be installed on your device first, then you must open the app in it by browsing to the app's WordPress page and clicking the option `Open in WototoPlayer via URL` or `Open in WototoPlayer via download`.

WototoPlayer is not currently in the app store; the source code is [on github](https://github.com/cgreenhalgh/wototoplayer). For the interested it is triggered the URL scheme `x-wototo` or MIME type `application/x-wototo`.

## Using ArtCodes

A web app within a browser cannot directly access a QRCode reader on the device. In this case the `Scan Artode` option will prompt the user to type in the URL.

If the app is run in the Android app WototoPlayer (see above) AND the Aestheticodes Android app is installed (version more recent than 14/01/2015, which is a closed beta version as of 15/01/2015) then the `Scan Artcode` option works correctly.

