# Wototo/Wordpress User guide

For plugin version 0.2.0.

A WordPress plugin that allows WordPress to be used as the main authoring environment for Wototo web apps.

## Installing the Plugin

In the WordPress admin dashboard, select `Plugins` > `Add New`; click button `Upload Plugin` (top), `Choose file`; select `wototo.zip` plugin file and click `Install now`. Assuming plugin installs successfully click `Activate plugin`, or find plugin in `Installed plugins` list and click `Activate`.

### Upgrading the Plugin

If you install the Plugin via upload (above) then in order to install a new version you will first need to remove the old version: from the admin menu select `Plugins` > `Installed Plugins`; find the `wototo` entry and click `Deactivate` and then `Delete`. All of your content should be safe (but you might want to back it up first, just in case). 

## Creating an App

Create an app: from the admin dashboard select `Apps` > `Add New`. Give the app a title. The settings for the app can be edited in the `App Settings` box below the description. If you want to include an About screen or Location screen (with GPS) then change the corresponding drop-downs to `Yes`. 

The current posts/pages in the app are listed under `Specific Items`. You can add new posts/pages to the add under `Add items`: click `Search` to get a list of matching posts (or pages or map posts, depending on your search settings); select the item(s) to include and click `Add Selected`; those items should appear at the end of the `Specific Items` list. You can remove items or change their order using the actions next to each one in the `Specific Items` list: `Remove`, `Down` and `Up`.

Now `Publish` the app: click `Publish` (or if you have changed an existing app `Update`) in the `Publish` editing box (usually top-right in a two-column view). 

Click `View App` to show the app's Wordpress page, with its title and description. If you get a wordpress error that the item cannot be found then try going to admin `Settings` > `Permalinks` (permalinks sometimes need a kick when a new plugin has been added).

On the app's page, below the description, you should see some buttons/links; click the first, `Open in Browser`. (The other links are only needed for integrated QRCode and ArtCode scanning - see the [Locked Content User Guide](wordpress_locked.md).)

That's it. The app view URL can be opened on a mobile device, shared on social media, etc.

Notes:

- if the post/page has a featured image then this is used as the icon for the item in the app
- the app content is used for the About screen text
- Only published (public) app(s) and posts/pages are included in the app
- forms and upload are not currently supported
- if you change (update) any of the items in the app or the app itself then existing clients will get a new version of the app the next time they check

### Including Pages from a Menu

You can also add pages to an app from a site menu - under `App Settings` the settings `Include Pages From a Site Menu` allows you to select a site menu whose posts and pages will be included in the app. Note that you need admin rights to create and edit menus. Also note that you the menu(s) that you can create extra menus just for use in apps; you don't have to use the main site navigation menus.

To create or edit a menu: under admin dashboard, select `Appearance` > `Menus`. Under `Edit Menus` click `create a new menu`. Enter a name for the menu and click `Create Menu`. Select the Pages and/or Posts that you want to include from the left and click `Add to menu`. Reorder items as required on the right and click `Save Menu`.

Notes specific to pages from a menu:

- Sub-menus are not currently supported - all menu items appear in a single list
- Only posts or pages (or wander anywhere map posts) are included in the app; other types of menu items are ignored.
- but if you only change the order of items in a menu then existing clients will not detect that the app has changed

