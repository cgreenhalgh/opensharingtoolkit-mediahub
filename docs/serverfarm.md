# Simple Server Farm version 2

How to set up and run a bunch of Wototo services on a single host. Using docker. Arguably this is version 2, if we call the previous mediahub instance stuff version 1.

## Configuration

We'll start with one configuration file, plain text, line based, white-space-separated:
```
INSTANCENAME  VERSION  LOCALPORT  STATE  # comment...
```
- `INSTANCENAME` will be a string usable as a file or URL path element (or one day a domain name element) which locally identifies the instance
- `IMAGE` will be server image ID or name, e.g. `1.0.0`
- `LOCALPORT` will be the local port number on which the instance will be exposed to the reverse proxy
- `STATE` is target state, initially `enabled` or `disabled` 

By default we'll call it `config.txt` and put it in the top-level directory.

## File system

For each instance there will be a directory `INSTANCENAME` with the following subdirectories:

- `couchdb` - the CouchDB database files (initially `_replicator.couch`, `_users.couch` and `mediahub.couch`), mounted on `/var/lib/couchdb`
- `log/nginx` - the nginx system log directory, mounted on `/var/log/nginx`
- `log/couchdb` - the nginx system log directory, mounted on `/var/log/couchdb`
- `setup` - an instance configuration directory, mounted on `/home/root/setup`
- `nginx-etc/conf` - location for e.g. htpasswd file, mounted on `/etc/nginx/conf`
- `nginx-etc/sites-available` - location for `default` nginx server config, mounted on `/etc/nginx/sites-available`
- `nginx-etc/mediahub-servers` - location for Form Server nginx configs, mounted on `/etc/nginx/mediahub-servers`

There will also be a subdirectory `INSTANCENAME/public` in the top-level static web content directory `nginx-public-html`, which will be mounted on `/usr/share/nginx/html/public` (this will normally be directly served by the front-end nginx server, even if the instance is stopped).

## Use of docker

Each instance will be an instance of the appropriate `VERSION` of the `mediahubauto` image. `-v` will be used to mount the appropriate directories; `-p` will be used to expose the instance port 80 on the appropriate `LOCALPORT`. Instances will be named by the `INSTANCENAME`. A `disabled` instance will be stopped. An `enabled` instance will be run or started.

## Maintainance

There will be (new) admin operations provided by `taskrunner`:

- `admin/update` which will update the instance after a version change, currently running `couchapp`
- `admin/logrotate` which will call `logrotate` on the instance, including signalling nginx as appropriate.

## Frond-end server

From the config file the configuration of the front-end nginx server will be updated (in `nginx-local-servers`) to:

- proxy all https to the specified `LOCALPORT`, stripping off the `INSTANCENAME` from the path

The front-end server will always server HTTP from the top-level `nginx-public-html` (read-only), which includes all of the instance-specific public files. 

The front-end server will proxy public PHP file requests to a separate server on port `9001`.

In `docker/serverfarm`:
```
sudo docker run -v $(pwd)/nginx-public-html:/usr/share/nginx/html:ro -v $(pwd)/nginx-local-servers:/etc/nginx/local-servers/:ro --name nginx -h nginx -d -p 80:80 -p 443:443 nginx
sudo docker run -v $(pwd)/nginx-public-html:/usr/share/nginx/html:ro --name nginxphp -h nginxphp -d -p 9001:80 nginxphp
```

## Usage

```
coffee updateserverfarm.coffee CONFIGFILE
```

:-)
