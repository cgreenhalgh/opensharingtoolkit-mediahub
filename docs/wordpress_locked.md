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

There is also an experimental Android app for hosting Wototo apps; if the app is downloaded into this then the `Scan QRCode` option works correctly, starting a QRCode scanner.

The app is not currently in the app store; the source code is [on github](https://github.com/cgreenhalgh/wototoplayer). Once the app is built and installed you can cause it to host a wototo app by browsing to the app view but replacing the first part of the URL with `wototot:` rather than `http:`. Alteratively if you add the URL parameter `wototo=2` to the view URL then the downloaded file should be openable with the android app, which will then download the app into itself.

## Using ArtCodes

A web app within a browser cannot directly access a QRCode reader on the device. In this case the `Scan Artode` option will prompt the user to type in the URL.

It is intended in future to provide direct support for scanning Artcodes, initially on Android, as has been done for QRCodes (see above).

