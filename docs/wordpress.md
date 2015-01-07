# Wototo / WordPress 

Work in progress... make a Wototo WordPress plugin so that WordPress can be used as the main authoring environment for Wototo web apps.

See [../wordpress/plugins/wototo/](../wordpress/plugins/wototo/).

## User guide

### Installing the Plugin

In the WordPress admin dashboard, select `Plugins` > `Add New`; click button `Upload Plugin` (top), `Choose file`; select `wototo.zip` plugin file and click `Install now`. Assuming plugin installs successfully click `Activate plugin`, or find plugin in `Installed plugins` list and click `Activate`.

### Creating an App

First specfy the pages/posts to include in the app: under admin dashboard, select `Appearance` > `Menus`. Under `Edit Menus` click `create a new menu`. Enter a name for the menu and click `Create Menu`. Select the Pages and/or Posts that you want to include from the left and click `Add to menu`. Reorder items as required on the right and click `Save Menu`.

Create an app: from the admin dashboard select `Apps` > `Add New`. Give the app a title. In the `App Settings` box below the description, for `Pages in app` select the menu that you created above. If you want to include an About screen or Location screen (with GPS) then change the corresponding drop-downs to `Yes`. Now `Publish` the app. 

Click `View App` to show the app. If you get a wordpress error that the item cannot be found then try going to admin `Settings` > `Permalinks` and pressing `Save Changes` (permalinks sometimes seem to need a kick when a new plugin has been added).

That's it. The app view URL can be opened on a mobile device, shared on social media, etc.

## Test / development notes

- start mysql using docker
```
docker run --name wototo-mysql -e MYSQL_ROOT_PASSWORD=mysecretpassword -d mysql
```
- start wordpress (apache/php) using docker [see also](https://registry.hub.docker.com/_/wordpress/) (note, default wordpress admin is `root` and password is as for mysql, above, default database is `wordpress`)
```
docker run --name wototo-wordpress --link wototo-mysql:mysql -d wordpress
```
- check IP...
```
docker inspect wototo-wordpress | grep IP
```
- open in a browser, `http://<IP_FROM_ABOVE>/` and follow usual install process
- use `Plugins` -> `Add New` -> `Upload plugin` to deploy plugin, e.g. from `cd ../wordpress/plugins; zip -r wototo.zip wototo` 

For enabling multi-site see [codex](http://codex.wordpress.org/Create_A_Network) (untested).

Build the javascript as required
```
make coffee
```
Build the plugin zip file
```
cd wordpress
make
```

## Design Notes

App is a custom post type (see [wordpress docs](https://developer.wordpress.org/plugins/custom-post-types-and-taxonomies/registering-custom-post-types/).
 

## Wander Anywhere integration

Wander Anywhere adds custom post type `anywhere_map_post`. This has custom fields:

- `type`, `0` => Point, `1` => Polygon
- `geojson`

If geojson property `type` = `Polygon` then polygon, else assumed `coordinates[1]` is Latitude and `coordinates[0]` is longitude.

