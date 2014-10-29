# Kiosk User Guide

If you mainly want to use Wototo to help distribute files from the Android [Information Hub / Kiosk app](https://play.google.com/store/apps/details?id=org.opensharingtoolkit.chooser) then this guide should get you going. If later you want to make a web app then look at the [general user guide](userguide.md).

The Mediahub can package web apps and other downloads (e.g. audio files, PDFs) for distribution using the Kiosk (Information Hub) app. A kiosk is like a digital leaflet stand: it allows a set of files and apps to be browsed and easily downloaded to a smart phone or tablet. The kiosk also provides short-URLs and QRCodes to download media that can be included in flyers and other print media. A kiosk display can be browsed on any modern web browser. Alternatively an Android-based tablet can be used as a dedicated kiosk device. A dedicated kiosk device provides access to a local copy of downloadable content over its own WiFi network even where there is no 3G or other WiFi available.

## Authoring Quickstart

The authoring interface is accessed using a web browser through the path `mediahub/_design/app/html/editor/index.html`. It is normally password-protected.

The main view shows a list of the `Content Types` supported by that mediahub. You can return to this list at any point by clicking `Wototo` in the title bar. 

For setting up a Kiosk the important "top-level" content types are:

- `Kiosk` - a definition for a single kiosk, i.e. a particular set of downloads.
- `File` - a file (or link to a file) that can be downloaded from a kiosk, or an image for use in the kiosk.

The list also includes `Background Task`: these are the mediahub admin tasks such as pubishing a kiosk and importing/exporting content checkpoints.

### 1. Upload an image

Upload an image for your download...

If you are not at the `Content Types` list then click on `Wototo` in the title bar.

Click `File` to see a list of current files (the `File List`). Initially this will be empty with just an `Add...` button at the top. Click `Add...` and the `Add File` form will appear. This has two tabs: `Overview` (which is common to all content types) and `File`; open the `File` tab.

Click `Choose File` and select an image files to upload (ideally choose a PNG or JPEG image that is no more than 2MB). This file should be immediately uploaded to the mediahub. A simple image editor will then appear which you can use to crop, scale or rotate the image if necessary. Make sure you `Save edited image` if you make any changes in the image editor.

You can now open the `Overview` tab and check that the title has been set to the uploaded file name. You can change this, or add a description if you wish (but they are not necessary in this case).

You can also add a comment; this is only visible in the editor, but is useful to remember what the file is for or from. It is a good idea to make up a hashtags (`#NAME`) for each project that you are working on and include this in the comments - this will make it much easier to find related materials later on.

Click `Add` to add the new file; the view will switch back to the `File List` view, and the uploaded will be visible. You can `Edit` or `Delete` the file from this view. Note that there is no undo!

### 2. Add an external URL

Add a link to a file to make available for download (e.g. a PDF file)...

If you are not at the `Content Types` list then click on `Wototo` in the title bar.

Click `File` to see a list of current files (`File List`). Click `Add...` and switch to the `File` tab. 

Paste the public URL into the `External URL` text box; if you aren't sure what file to use then try `http://www.cs.nott.ac.uk/~cmg/GooglePlay/InformationHub/mobile%20flyer%20layout.pdf`.

Switch to the `Overview` tab, and enter a title (e.g. `Test file`) and a description that will appear in the kiosk view (e.g. `An interesting document that you can download`). Optionally add tags/comments to help identify this file in the editor.

Click `Add`; the view will switch back to the `File List` view.

### 3. Create a download kiosk

If you are not at the `Content Types` list then click on `Wototo` in the title bar.

Click `Kiosk` to see a list of current kiosks (the `Kiosk List`). Click `Add...` and the `Add Kiosk` form will appear. This has three tabs: `Overview`, `List` and `Kiosk`.

In the `Overview` tab give the kiosk a title e.g. `test kiosk`.

In the `List` tab click `Add below...` and select your download `File` from the list.

Swith to the `Kiosk` tab and fill in the `Author` section.

If you are going to distribute content from another web server (e.g. if you are running Wototo on a desktop of laptop computer) then enter the URL that you are going to serve the kiosk content from in the `External hosting URL` text box. This should be the URL of a directory on the web server where you will place the published kiosk files (with NO trailing `/`).

Click `Add` to create the definition for the `Kiosk` and return to the `Kiosk List` view.

In the `Kiosk List`, on your new `Kiosk` entry, click `Publish...`. In the dialog enter a directory name for your published kiosk on the web server. This must be different for every kiosk and app, and a short name without spaces is probably safest, e.g. "tutorialkiosk".

A view for this publishing task appears, initially titled `Add Background Task`, and sub-titled `Publish kiosk to webserver`. Click `Run` and the view will change to `Edit Background Task`. Shortly a `Task Status` section should appear, which gives you progress information about publishing the kiosk. Hopefully this will change to "Task complete" within 10 seconds or so (longer for a kiosk with more files and/or more complex apps).

This view has three links near the bottom: the "web kiosk view" link is the published kiosk user interface on the mediahub web server; try opening this in another window, or on another device. You should see a browser view with an item for your app, which if you click it has options to `Get on this device`, i.e. download it on that device, or `Send over the Internet`, i.e. get a URL and QRCode that can be entered into another phone or tablet to download it.

Well done, you have configured and published your first digital download kiosk using the mediahub.

## 4. Distributing content on other servers/devices

The last link in the `Publish kiosk to webserver` task is an archive file which you can download and unpack on another web server or on a dedicated kiosk device to make those downloads available there. 

If you are distributing content from another web server (which you configured as the kiosk `External hosting URL`) then download the archive file, upload it to that web server, create the directory if it doesn't already exist and unzip the archive in it. The kiosk view should be the configured path plus `/index.html`.

If you want to (also) distribte the content offline using the Information Hub android app then download the archive file to the android device, e.g. scan the QR code or enter the URL into the browser. Once the file has downloaded open it, and the app should give you option to unzip it and update its cache. Do so and re-open the app and you should have local copies of the same kiosk content.


