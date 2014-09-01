FROM cfengine
MAINTAINER Chris Greenhalgh <chris.greenhalgh@nottingham.ac.uk>

RUN apt-get update
RUN apt-get -y install nginx && \
  mkdir -p /etc/nginx/conf/ && \
  sed -i '/^types {/ a \ text/cache-manifest appcache;' /etc/nginx/mime.types

RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf 

# PHP for kiosk server-side
RUN apt-get -y install php5-cli php5-fpm && \
  ( echo "php-fpm, /usr/sbin/php5-fpm" >> /var/cfengine/inputs/processes_run.csv )

COPY nginx-default.conf /etc/nginx/sites-available/default
# dev - admin:admin
RUN echo "admin:QVWFd1fogzgdk" > /etc/nginx/conf/htpasswd

EXPOSE 80

VOLUME /var/log
# default!
VOLUME /usr/share/nginx/html

ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]
CMD ["/usr/sbin/nginx"]

