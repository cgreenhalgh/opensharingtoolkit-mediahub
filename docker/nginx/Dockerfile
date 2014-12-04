FROM ubuntu:14.04
MAINTAINER Chris Greenhalgh <chris.greenhalgh@nottingham.ac.uk>

RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get -y install nginx

EXPOSE 443
EXPOSE 80

VOLUME /var/log

COPY nginx-public /etc/nginx/sites-available/default
COPY server.crt /etc/nginx/
COPY server.key /etc/nginx/
RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf 
RUN sed -i '/^types {/ a \ text/cache-manifest appcache;' /etc/nginx/mime.types
# expose for run-time config
VOLUME /etc/nginx/local-servers/

CMD ["/usr/sbin/nginx"]

