# Mediahub User Guide

## General Overview

The OpenSharingToolkit Mediahub is a Content Management System (CMS) for making web apps for use on smart phones and tablets. 

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


