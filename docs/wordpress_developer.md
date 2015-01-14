# Test / development notes

## Running the test/development environment using docker

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

