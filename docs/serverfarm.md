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

- `public` - the public HTML file space, mounted on `/usr/share/nginx/html/public`
- `couchdb` - the CouchDB database files (initially `_replicator.couch`, `_users.couch` and `mediahub.couch`), mounted on `/var/lib/couchdb`
- `log/nginx` - the nginx system log directory, mounted on `/var/log/nginx`
- `log/couchdb` - the nginx system log directory, mounted on `/var/log/couchdb`
- `setup` - an instance configuration directory, mounted on `/home/root/setup`
- `nginx-etc/conf` - location for e.g. htpasswd file, mounted on `/etc/nginx/conf`
- `nginx-etc/sites-available` - location for `default` nginx server config, mounted on `/etc/nginx/sites-available`
- `nginx-etc/mediahub-servers` - location for Form Server nginx configs, mounted on `/etc/nginx/mediahub-servers`

## Use of docker

Each instance will be an instance of the appropriate `VERSION` of the `mediahubauto` image. `-v` will be used to mount the appropriate directories; `-p` will be used to expose the instance port 80 on the appropriate `LOCALPORT`. Instances will be named by the `INSTANCENAME`. A `disabled` instance will be stopped. An `enabled` instance will be run or started.

## Maintainance

There will be (new) admin operations provided by `taskrunner`:

- `admin/update` which will update the instance after a version change, currently running `couchapp`
- `admin/logrotate` which will call `logrotate` on the instance, including signalling nginx as appropriate.

## Frond-end server

From the config file the configuration of the front-end nginx server will be updated to:

- serve `INSTANCENAME/public` over http
- proxy all https to the specified `LOCALPORT`, stripping off the `INSTANCENAME` from the path

## Usage

```
coffee updateserverfarm.coffee CONFIGFILE
```

:-)
