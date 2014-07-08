# Mediahub Deployment

Notes on deployment...

The scope (mark 1):

- reproducible by others
- hosted service for initial research partners (SaaS)
- small number of users

## Docker

...with [docker](http://www.docker.com/).

The idea (mark 1):

- one container per user (or user group)
- container hosts complete system, i.e. couchdb, node-based commands
- container includes reverse http proxy enforcing access control
- multiple mediahub containers run behind a single public reverse proxy

### Mediahub container

Runs:

- ubuntu 14.04 (aka `trusty`)
- nginx (1.4.6 from ubuntu `nginx`, or `stable` = 1.6.0 as of 2014-07-08 from  [nginx linux packages](http://nginx.org/en/linux_packages.html#stable))
- couchdb (1.5.0, ubuntu `couchdb`)
- node and npm (v0.10.25 and 1.3.10, respectively, ubuntu `npm`)
- cfengine (3.6.0, [cfengine community distros](http://cfengine.com/cfengine-linux-distros/))
- (optionally) openssh-server

See [CFEngine in docker](https://cfengine.com/company/blog-detail/cfengine-and-docker-ensure-application-availability-and-container-integrity/).

### Initialising couchdb

E.g. copy a database file another instance, `/var/lib/couchdb/mediahub.couch` to `mediahub/mediahub.couch`.

### Installation

Install docker as per [docker ubuntu install guide](https://docs.docker.com/installation/ubuntulinux/) - I am testing with 14.04, latest docker (currently 1.1.0).

```
sudo docker build -t cfengine cfengine
sudo docker build -t mediahub mediahub
```

### Testing

Run a container, e.g. `m1`
```
sudo docker --name m1 -d -P -p 8081:80 -p 8022:22 mediahub
```
Check running containers, and see port mappings:
```
sudo docker ps
```
Try browse to port mapped to 80 - should see nginx. Try ssh to port mapped to 22. Try browse to port mapped to 5984 if external access to couchdb enabled.

Stop container:
```
sudo docker stop m1
```
Delete container:
```
sudo docker rm m1
```

### SSL certificate

[self-signed](http://httpd.apache.org/docs/2.2/ssl/ssl_faq.html#selfcert), for example. 
```
openssl req -new -x509 -nodes -out server.crt -keyout server.key
```


