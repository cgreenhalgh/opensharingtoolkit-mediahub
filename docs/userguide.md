# Mediahub User Guide

## General Overview

The OpenSharingToolkit Mediahub, a.k.a. `Wototo`, is a Content Management System (CMS) for making web apps for use on smart phones and tablets. 

A web app is an app that is downloaded and runs within a standard web browser rather than being installed from an app store. In general a web app is a little less responsive and "slick" than a normal (or "native") app and may have slightly more limited functionality, but is much easier to make, can be distributed from any web site and will run on most popular smart phones and tablets, including iPhone, iPad, Android phones and tablets, and Windows Phone. 

The web apps created with the Mediahub are saved in the phone or tablet's web browser (using the HTML5 app cache) and can be used without an internet connection, for example where 3G coverage is poor or with tablets that do not have 3G.

The Mediahub can also package web apps and other downloads (e.g. audio files, PDFs) for distribution using an OpenSharingToolkit Kiosk. A kiosk is like a digital leaflet stand: it allows a set of files and apps to be browsed and easily downloaded to a smart phone or tablet. The kiosk also provides short-URLs and QRCodes to download media that can be included in flyers and other print media. A kiosk display can be browsed on any modern web browser. Alternatively an Android-based tablet can be used as a dedicated kiosk device. A dedicated kiosk device provides access to a local copy of downloadable content over its own WiFi network even where there is no 3G or other WiFi available.

The web apps that can be created by the first version of the Mediahub can include HTML content, small e-books and simple maps. The Mediahub is under active development to add support for audio, location-based functions, interactive activities and user-generated content. (And can also be extended by a competent programmer!) 

## Authoring Overview

The mediahub is intended to be used by persons with general IT skills who might have used other CMSs such as WordPress or Drupal, and it does not require any programming or direct use of HTML mark-up. Like most CMSs the process of authoring and publishing is more complicated than (for example) editing a simple document, and some experiment may be needed to work out the best ways to achieve particular results.

There may be many copies of the Mediahub, for example one per user or even one per app. In mediahub version 1 each mediahub has a single user account which is able to do anything within that mediahub (including authoring, publishing and backups).

Each mediahub has its own authoring interface and a web server for published content. 

The authoring interface is used to create apps and assemble other content (e.g. images, files for download). Text content can be authored within the interface or can be pasted in from existing websites or documents and tweaked for layout and flow. Apps can be previewed for testing from within the authoring interface.

Once an app (or kiosk content) is complete it is published or "exported", which generates a snapshot of the app (or kiosk) on the mediahub's web server. This snapshot can also be downloaded and deployed on other web servers/sites. Public links to published content are provided in the authoring interface, from where they can be copied to documents, emails and other websites. In mediahub version 1 there is no particular support for indexing published content.

The authoring interface allows "checkpoints" of the CMS database to be exported and imported. A checkpoint is first exported from a "source" mediahub from which it can be downloaded. This can then be uploaded and imported into another ("target") mediahub. This will create a complete copy of the editable content from the source on the target. This will be merged with any content already on the target mediahub. If the process is reversed then both mediahubs will end up with a complete copy of all content. 

Note: If you re-import a newer version of some content then the local copy will be updated. But if imported content is edited on *two* mediahubs and then merged then only one copy of the content will remain and it is undefined which version it will be. Similarly, importing your own checkpoint will not create a *new* copy of the exported content, it will just ensure that you have a version at least as new as the checkpoint.

The authoring interface also allows backups of the authoring database to be created for disaster recovery.

## Authoring Quickstart

The authoring interface is accessed using a web browser through the path `mediahub/_design/app/html/editor/index.html`. It is normally password-protected.

The main view shows a list of the `Content Types` supported by that mediahub. You can return to this list at any point by clicking `Mediahub` in the title bar. 

The "top-level" content types that can be directly published are currently:

- `App` - a downloadable (HTML5) web app intended for use on a smart phone or tablet, which is comprised of other content items (below); and
- `Kiosk` - a browsable set of downloads (web apps or other files) for use on a kiosk device.

The content types that can be included in an app are currently:

- `File` - a media file, often an image for use in other content items;
- `HTML Fragment` - a small page of HTML (text/images);
- `Booklet` - an e-book, with multiple pages and a table of contents;
- `Place` - a point on a map; and
- `List` - a list of other content items.

Support for users to provide information back to app authors is work in progress, and uses the `Form` and `Server` content types. 

The list also includes `Background Task`: these are the mediahub admin tasks such as pubishing apps or kiosks and importing/exporting content checkpoints.

### 1. Upload an image

If you are not at the `Content Types` list then click on `Mediahub` in the title bar.

Click `File` to see a list of current files (the `File List`). Initially this will be empty with just an `Add...` button at the top. Click `Add...` and the `Add File` form will appear. This has two tabs: `Overview` (which is common to all content types) and `File`; open the `File` tab.

Click `Choose File` and select an image files to upload (ideally choose a PNG or JPEG image that is no more than 2MB). This file should be immediately uploaded to the mediahub. A simple image editor will then appear which you can use to crop, scale or rotate the image if necessary. Make sure you `Save edited image` if you make any changes in the image editor.

You can now open the `Overview` tab and check that the title has been set to the uploaded file name. You can change this, or add a description if you wish (but they are not necessary in this case).

(New as of 2014-10-10) You can also add a comment; this is only visible in the editor, but is useful to remember what the file is for or from. It is a good idea to make up a hashtags (`#NAME`) for each project that you are working on and include this in the comments - this will make it much easier to find related materials later on.

Click `Add` to add the new file; the view will switch back to the `File List` view, and the uploaded will be visible. You can `Edit` or `Delete` the file from this view. Note that there is no undo!

### 2. Create a simple HTML page

If you are not at the `Content Types` list then click on `Mediahub` in the title bar.

Click `HTML Fragments` to see a list of current HTML "fragments", i.e. simple blocks of text/images (the `HTML Fragment List`). Like the `File List` this will initially be empty with just an `Add...` button at the top. Click `Add...` and the `Add HTML Fragment` form will appear. Again, this has two tabs: `Overview` and `HTML Fragment`.

On the `Overview` tab enter a title, e.g. "Just testing". 

Switch to the `HTML` tab enter some text for the page using the standard HTML editor, e.g. "Welcome to this tutorial example". Inser an image into the text: click the `Image` button in the HTML editor toolbar and when the `Image Properties` dialog appears click `Browse server`. A new window will open which shows all of the images currently uploaded to the mediahub as `File`s, i.e. the one that we just uploaded. Click on that image and then click `OK` in the `Image Properties` dialog: your image should have been added to the text.

Click `Add` to create the new `HTML Fragment` and return to the `HTML Fragment List` view.

### 3. Create a web app

If you are not at the `Content Types` list then click on `Mediahub` in the title bar.

Click `App` to see a list of current web apps (`App List`). Click `Add...` and the `Add App` form will appear. This has three tabs: `Overview`, `List` and `App`. 

In the `Overview` tab give the app a title, e.g. "tutorial app".

Switch to the `List` tab; this shows the content items that will be combined to make the app. Under the `Specific Items` label click `Add below...`; a list of all of the available content items will appear, which is currently just the `File` and `HTML Fragment` that we added above. Select the `HTML Fragment` and click `OK`; that item will be added to the list fo content for the app.

Click `Add` to create the definition for the `App` and return to the `App List` view.

### 4. Test a web app

If you are not at the `App List` view then click on `Mediahub` in the title bar and click `App` from the `Content Types` view.

On the entry for your app, click `Test offline`. The browser will now open a testing view of the web app in the web browser. The top-level view of the app will have a list containing one item: the `HTML Fragment`, with whatever name you gave it. If you click on this list item you should see the HTML content, including your image. Click the browser's back button to go back, or click the title in the title bar to return to the top-level list.

### 5. Publish a web app

Go back to the mediahub editor view (keep pressing back in the browser, or re-enter the authoring URL). If you are not at the `App List` view then click on `Mediahub` in the title bar and click `App` from the `Content Types` view.

On the entry for your app click `Publish...`. In the dialog enter a directory name for your published app on the web server; a short name without spaces is probably safest, e.g. "tutorialapp".

A view for this publishing task appears, initially titled `Add Background Task`, and sub-titled `Publish app to webserver`. Click `Run` and the view will change to `Edit Background Task`. Shortly a `Task Status` section should appear, which gives you progress information about publishing the app. Hopefully this will change to "Task complete" within 10 seconds or so (longer for a more complex app).

This view has two links near the bottom: the longer one ending "...html" is the app itself; try opening this in another window, or on another device. THe other link is an archive file which you can download and unpack on another web server to make your web app available there.

Well done, you have created and published your first HTML5 web app using the mediahub.

### 6. Create a download kiosk (optional)

If you want to also create a kiosk view for downloading this app (and perhaps other files and apps)...

If you are not at the `Content Types` list then click on `Mediahub` in the title bar.

Click `Kiosk` to see a list of current kiosks (the `Kiosk List`). Click `Add...` and the `Add Kiosk` form will appear. This has three tabs: `Overview`, `List` and `Kiosk`.

In the `Overview` tab give the kiosk a title e.g. `test kiosk`.

In the `List` tab - which is like the `List` tab for an `App` - click `Add below...` and select your `App` from the list.

Swith to the `Kiosk` tab and fill in the `Author` section; the others can be left blank.

Click `Add` to create the definition for the `Kiosk` and return to the `Kiosk List` view.

In the `Kiosk List`, on your new `Kiosk` entry, click `Publish...`. In the dialog enter a directory name for your published kiosk on the web server. This must be different for every kiosk and app, and a short name without spaces is probably safest, e.g. "tutorialkiosk".

A view for this publishing task appears, initially titled `Add Background Task`, and sub-titled `Publish kiosk to webserver`. Click `Run` and the view will change to `Edit Background Task`. Shortly a `Task Status` section should appear, which gives you progress information about publishing the kiosk. Hopefully this will change to "Task complete" within 10 seconds or so (longer for a kiosk with more files and/or more complex apps).

This view has three links near the bottom: the "web kiosk view" link is the published kiosk user interface on the mediahub web server; try opening this in another window, or on another device. You should see a browser view with an item for your app, which if you click it has options to `Get on this device`, i.e. download it on that device, or `Send over the Internet`, i.e. get a URL and QRCode that can be entered into another phone or tablet to download it.

The other link is an archive file which you can download and unpack on another web server or on a dedicated kiosk device to make those downloads available there.

Well done, you have configured and published your first digital download kiosk using the mediahub.

## Content Types

This section provides a little more information about the available content types for use in apps.

### File

At present `File` are mainly used for images that are used in other content items. In particular each content item can have its `image` which is used in the kiosk view, and is own `icon` which is used in the app and list views. The image files must be uploaded to the mediahub before they can used in those other items.

If `File` items are added to a `Kiosk` then those files will be made available for download from the kiosk. This can include PDF files, audio files, etc.

The intention is also to provide some support with the web app for different media types, e.g. audio, video, as items within an app.

### HTML Fragment

Note that the editor currently restricts what HTML can be used to relatively simple and standard text and paragraph types plus images.

### Booklet

A `Booklet` is a simple e-book that is created as HTML. The `Booklet` tab has a single `content` HTML editor, which allows a range of paragraph and text styling plus images. It also has a special button `Insert a column` (the icon is a narrow page); this inserts a page break into the booklet.

Note: there is a bug as of 2014-07-24 that the page break is sometimes invisible in the editor view when first used; in this case try reloading the authoring view in the web browser.

When published as part of a web app the Booklet appears as a set of pages (according to the inserted breaks) and has a table of contents generated from the level 1 and 2 headings in the booklet text.

### Place

A `Place` is a point on a map, i.e. a latitude and longitude. The `Place` tab has several sections:

- `Address` - (optional) textual address; if you enter an address and click `Lookup address` then it will use the google geo-location API to try to locate the address, showing a temporary (blue) pin on the map (below). Click on the pin to show a popup with the address, and click `use` in the popup to make that the current location.
- `Lat/lon` - the numerical latitude and longitude of the point in the WGS-84 coordinate system (as used by GPS), plus the map zoom level (`0` is the whole world, `18` is pretty close-up). `Show on map` should centre the map view to the specified location. 
- `Map` - a pannable/zoomable map view, with a purple pin at the current location (if any). Click on the map to show a popup with that point's lat/lon; click `use` in the popup to make that the current location.
- `Map icon` - an image to use as a custom map icon for this `Place` (untested).

Currently the map uses OpenStreetMap, which (importantly) is licensed for off-line use.

At present a `Place` in an app will appear as a page that shows the selected location and area immediately around it at a limited range of zoom levels.

### List

A `List` is simply a list of othe content items. Each item will appear in the list with its `title` and an icon; there is a default icon for each content type, or a custom icon can be specified in the item's `General` tab as `icon`.

The intention is to add a range of more specialised list views in the future, e.g. a list of `Place`s appearing on a common map.

### App

An `App` is basically a list of content items - like a `List` - but packaged up as an HTML5 web app, and set up to use the app cache so that it can be downloaded. Set an item's `title` and `icon` to specialise it appearance in the app. 

There are quite a number of additional options available to customise common elements of an app, including:

- whether to track links out of the app (i.e. when the user clicks them, via a redirect on the server)
- what (if any) form server to use (for user uploads)
- whether to include a "User" section which prompts for the user's name on form uploads
- whether to include an "About" section, optionally including version and copyright information
- whether to include a "Share" section, with a URL and QR code for the app
- whether to include a "Location" section and widget for showing user location on maps
- optional app icon (for browser)

### Kiosk

The `Kiosk` view is a list of content items, currently only `File`s and `App`s. It can include files that are NOT in the mediahub: create a `File` item and set the `externalurl` in the `File` tab and don't upload the file itself. You can add other content types but they will be ignored.

The `Kiosk` view uses the item's `title`, `image` and `description` (but not its `icon`), so set these to tailor an item's appearance in the kiosk.

Note that publishing a `Kiosk` which includes an `App` will also export a (new) copy of the `App` itself within the `Kiosk` directory. If you want to include a published `App` within a kiosk then create a `File` item and set its `externalurl` to the URL of the published `App`. Then include this `File` rather than the `App` within the `Kiosk` list.

## Background Tasks

Once a `Background Task` has been created it can be found in the `Background Task` list. You can request that a task be re-run (e.g. if an `App` or `Kiosk` has been updated) by clicking `Update`.

Note that if you delete a `Background Task` then the mediahub will also try to the delete the corresponding published content! So normally you won't delete them...

Most `Background Task`s have one associated directory on the web server, and each directory can be associated with only one `Background Task`: if you try to create a second task with the same directory then you will get a warning and be presented with the existing `Background Task` for that directory.

Many background tasks are created from the corresponding `App` or `Kiosk` list (publish, export). There are also more general background tasks that can be created from the `Background task` list:

- Backup, which will make a copy of the complete editor database (but note that there is no easy way to restore this kind of backup - this is a server admin/set-up job)
- Export, which will export all of the editable content (but not the background tasks); this can be imported into other editors
- Import, which will allow an app export or editor export to be uploaded and imported.

Note that exports contain the a snapshot of the app or editor, but the import process does NOT overwrite any changes made after the export (including deleting things!). So the export/import process can be used to copy apps/etc to another editor, or restore them if the editor files are lost (e.g. the server disk fails), but cannot currently be used to go back to an old version in the same editor.

## Server Quick(ish)start

You can set up apps so that users can give you feedback or data. This is a bit more complicated than just publishing information as we have done so far. To do this you need to create a `Server` to accept and store this data and include a `Form` in your app to specify what you want to get from each user.

This brief tutorial takes you through creating a first upload server (within your mediahub) and adding an upload form to your app.

### 1. Define a Server

In your mediahub, if you are not at the `Content Types` list then click on `Mediahub` in the title bar.

Click `Server` to see a list of current upload servers (the `Server List`). Click `Add...` and the `Add Server` form will appear. This has two tabs: `Overview` and `Server`.

In the `Overview` tab give the data server a title e.g. `test server`.

Click `Add` to create the `Server` and return to the `Server List`.

### 2. Create (or Update) a Server

If you are not at the `Server List` view then click on `Mediahub` in the title bar and click `Server` from the `Content Types` view.

On the entry for your new server, click `Build...`. The `Add Background Task` form will appear, sub-titled `Update Form Server`. Click `Run` (or `Re-run` if the task already exists) to ask your mediahub server to make or update that particular upload server. The `Task status` should change to green (`Task complete`) after a few seconds if the data server has been created.

Try clicking the `Server admin using your mediahub username/password` link; this should open the admin/management view of that data server, which looks a little like the mediahub but has the title `Server` and a list of options, initially only `Filter formdata` (which we'll come back to later). You can save this web page (e.g. in your bookmarks) so that you can return to it more easily.

### 3. Create a Form

In your mediahub, if you are not at the `Content Types` list then click on `Mediahub` in the title bar.

Click `Form` to go to the (initially empty) `Form List`.

Click `Add...` to show the `Add Form` view, which has two tabs, `Overview` and `Form`.

In the `Overview` tab give the form a title, e.g. `test feedback`.

In the `Form` tab change the `Cardinality of Form` from `Once` to `Any number of times` - this will allow a single user to give feedback multiple times using the same form (e.g. a set of different suggestions).

Also in the `Form` tab ensure that the `Server auto-accept submitted form` checkbox remains checked (or you will not be able to view/find the submitted information later on the server).

Finally, in the `Form` tab, click `Add Form Element` to start defining what information you want to collect. A row appears with the form element's `Name`, `Prompt` and `Type`. 

- Set the `Type` to `Text`, i.e. you want the user to give you some textual information. 
- Set the `Name` to a short string such as `feedback` which will identify this part of the form in the collected data (Note, every element in a single form must have a different `Name`). 
- Set the `Prompt` to the text you want to present to the user, e.g. `What is your feedback?`

Now click `Save` to create the form.

### 4. Add the Form to an App

If you are not at the `App List` view then click on `Mediahub` in the title bar and click `App` from the `Content Types` view.

On the entry for the app you already created, click `Edit`.

In the `App` tab set the `Server` to your new server (as created above).

In the `List` tab add your new form to the list of `Specific Items`.

Now `Save changes` to the app.

### 5. Completing a Form on an App

Now try testing the app - click `Test Offline` from the app's entry in the `App List`. Wait for the app to update and click `reload` to get the new version of the app which includes the form. The app should then appear, with a top-level entry for your feedback form.

Click on the form entry. If the form cardinality was `Any number of times` then you will see a button `Start new form instance` - click this. (Otherwise you will see only allowed copy of the form.)

The form should be visible with the prompt specified for each form element and a suitable input (e.g. text box). There is also a checkbox `Ready for upload?` which tells the app whether you are happy to upload this information, and `Save`, `Discard unsaved changes` and `Delete` buttons.

Enter some text in the feedback box.

Check `Ready to upload?`, and click `Save`. The information you entered is now saved in the app ready to upload to the server, but the server isn't quite ready yet...

### 6. Adding the Form to the Server

Go back to the Mediahub, to the `Server List` and click `Build...` for your server (alternatively you can go to the `Background Task List` and click the `Update Form Server` entry for your server.

Click `Re-Run` to make sure that your server is up to date; in particular this will copy information about the app which is using your server including the information about the form in it. 

Note: this will only work AFTER the app has been tested offline or exported! (which we did above)

Note: you will have to do again this if you change the form or if you add another form to an app which uses the same server.

### 7. Uploading data from an App

Go back to your app and `Test offline` again. 

If you click on your form you should still see the information that you entered. 

Click on the menu/bars at the top left of the app and click `User`. Enter a short name in the box `Your email address or nick-name` and click `Save` - this name will be included with the uploaded data.

Click on the menu/bars at the top left of the app and click `Manage` under `Upload` (alternatively click the up arrow at the right of the app title bar). This `Upload` view should report that there is `1 form instances need uploading`; if not then find your form again in the app and check that `Ready to upload?` is checked and `Save`.

Click `Start upload`. The app should now upload your completed feedback information to your new data server. (This will always require an internet connection, but if it fails no data will be lost - you can try to upload it later.)

### 8. Viewing Uploaded Data

Go back to the Mediahub, to the `Server List` and click `Build...` for your server (alternatively you can go to the `Background Task List` and click the `Update Form Server` entry for your server.

Click the `Server admin using your mediahub username/password` link to open the admin/management view of that data server.

Click `Filter formdata`. You will see a view `Make Filter` with a dropdown for `Filter type`. Leave this as `Filter to App / Form / User` and click `Update` immediately underneath it. 

A new dropdown `Specify App` appears, initially showing `* (1)`, i.e. any app, for which there are a total of 1 form(s) uploaded (the one we just did). From the dropdown select your app and click `Update` under that.

A new dropdown `Specify Form` appears, initially showing `* (1)`, i.e. any form within that app, for which there are a total of 1 form(s) uploaded (the one we just did). From the dropdown select your form and click `Update` under that.

A new dropdown `Specify User` appears, initially showing `* (1)`, i.e. any user of that form within that app, for which there are a total of 1 form(s) uploaded (the one we just did). You can leave this as `*` for now.

Click `View Data Table` at the bottom (you could have done this earlier if you didn't want to filter by user, form or app).

A `Data Table` view appears with a table showing the uploaded data - there should be one row with the feedback you have and the `_userID` that you entered in the app.

Click `Download CSV` to download a copy of the data in the table. You can save this and import it into a spreadsheet application such as Microsoft Excel. It is in a format called "comma-separated values". 


Well done, you have now set up a data collection server and an app which allows users to send you feedback or other data.

