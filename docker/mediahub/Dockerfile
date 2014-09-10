FROM cfengine

RUN apt-get update

RUN apt-get -y install nginx && \
  mkdir -p /etc/nginx/conf/ && \
  sed -i '/^types {/ a \ text/cache-manifest appcache;' /etc/nginx/mime.types

# can't run couchdb using standard for with cfengine as executable name is different, i.e. 
RUN apt-get -y install couchdb && \
  mkdir -p /var/run/couchdb && \
  mkdir -p /var/lib/couchdb && \
  ( echo "/usr/lib/erlang/erts-5.10.4/bin/beam, /usr/bin/couchdb" >> /var/cfengine/inputs/processes_run.csv )

# node
RUN apt-get -y install npm nodejs-legacy 

# PHP for kiosk server-side
RUN apt-get -y install php5-cli php5-fpm && \
  ( echo "php-fpm, /usr/sbin/php5-fpm" >> /var/cfengine/inputs/processes_run.csv )

# build setup
RUN apt-get -y install zip && \
  npm install -g coffee-script

# build... (assume .css checked in)
RUN  mkdir -p /home/root && \
  cd /home/root && \
  ( wget -qO- https://github.com/cgreenhalgh/opensharingtoolkit-kiosk/archive/1.0.0-rc2.tar.gz | tar xzf - ) && \
  mv opensharingtoolkit-kiosk-1.0.0-rc2 opensharingtoolkit-kiosk && \
  ( wget -qO- https://github.com/cgreenhalgh/opensharingtoolkit-mediahub/archive/1.0.0-rc2.tar.gz | tar xzf - ) && \
  mv opensharingtoolkit-mediahub-1.0.0-rc2 opensharingtoolkit-mediahub && \
  cd /home/root/opensharingtoolkit-kiosk/cache_builder && \
  npm install && \
  cd /home/root/opensharingtoolkit-mediahub && \
  npm install && \
  make coffee

# make couch database and deploy couchapp
RUN couchdb -b && \
  sleep 10 && wget -qO- --method=PUT http://127.0.0.1:5984/mediahub && \
  wget -qO- --method=PUT --header=Accept:application/json --header=Content-Type:application/json '--body-data={"_id":"org.couchdb.user:serverreader","type":"user","name":"serverreader","password":"serverreader","roles":["serverreader"]}' http://127.0.0.1:5984/_users/org.couchdb.user:serverreader && \
  wget -qO- --method=PUT --header=Accept:application/json --header=Content-Type:application/json '--body-data={"_id":"org.couchdb.user:serverwriter","type":"user","name":"serverwriter","password":"serverwriter","roles":["serverwriter"]}' http://127.0.0.1:5984/_users/org.couchdb.user:serverwriter && \
  cd /home/root/opensharingtoolkit-mediahub && \
  make COUCHDB=http://127.0.0.1:5984/mediahub couchapplocal && \
  wget -qO- --method=POST --header=Accept:application/json --header=Content-Type:application/json http://127.0.0.1:5984/mediahub/_ensure_full_commit && \
  couchdb -d && \
  mkdir -p /usr/share/nginx/html/public

ADD index.html /usr/share/nginx/html/

# couchdb access config and helper process
COPY local.ini /etc/couchdb/

# See template for specific configuration...
VOLUME ["/var/lib/couchdb","/var/log","/usr/share/nginx/html"]
EXPOSE 80
#/usr/sbin/syslogd
#ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]
CMD ["/usr/sbin/nginx"]

