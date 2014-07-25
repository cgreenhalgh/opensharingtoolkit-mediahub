FROM cfengine

RUN apt-get update
RUN apt-get -y install openssh-server && \
  mkdir -p /var/run/sshd && \
  ( echo "root:password" | chpasswd )  # need a password for ssh

RUN apt-get -y install nginx && \
  mkdir -p /etc/nginx/conf/ && \
  sed -i '/^types {/ a \ text/cache-manifest appcache;' /etc/nginx/mime.types

# can't run couchdb using standard for with cfengine as executable name is different, i.e. 
RUN apt-get -y install couchdb && \
  mkdir -p /var/run/couchdb && \
  mkdir -p /var/lib/couchdb && \
  ( echo "/usr/lib/erlang/erts-5.10.4/bin/beam, /usr/bin/couchdb" >> /var/cfengine/inputs/processes_run.csv )

RUN apt-get -y install npm nodejs-legacy

# build...
RUN apt-get -y install git && \
  npm install -g coffee-script && \
  apt-get -y install ruby1.9.1 && \
  gem install compass && \
  mkdir -p /home/root && \
  cd /home/root && \
  git clone https://github.com/cgreenhalgh/opensharingtoolkit-kiosk && \
  git clone https://github.com/cgreenhalgh/opensharingtoolkit-mediahub && \
  cd /home/root/opensharingtoolkit-kiosk/cache_builder && \
  npm install && \
  cd /home/root/opensharingtoolkit-mediahub && \
  npm install && \
  make coffee && \
  make css

# make couch database and deploy couchapp
RUN couchdb -b && \
  sleep 3 && wget -qO- --method=PUT http://127.0.0.1:5984/mediahub && \
  cd /home/root/opensharingtoolkit-mediahub && \
  make COUCHDB=http://127.0.0.1:5984/mediahub couchapplocal && \
  wget -qO- --method=POST --header=Accept:application/json --header=Content-Type:application/json http://127.0.0.1:5984/mediahub/_ensure_full_commit && \
  couchdb -d && \
  mkdir -p /usr/share/nginx/html/public

# couchdb access config and helper process
COPY local.ini /etc/couchdb/

# PHP for kiosk server-side
RUN apt-get -y install php5-cli php5-fpm && \
  ( echo "php-fpm, /usr/sbin/php5-fpm" >> /var/cfengine/inputs/processes_run.csv )

# Fix for sshd login (why?? maybe php pulled something in) 
RUN if [ -f /etc/pam.d/sshd ]; then \
    sed -i.orig 's|^session[ \t]*required[ \t]*pam_loginuid.so|#&|' /etc/pam.d/sshd; \
  fi

# testing only...
EXPOSE 5984

# See template for specific configuration...
VOLUME ["/var/lib/couchdb","/var/log","/usr/share/nginx/html"]
EXPOSE 80 443 22
#/usr/sbin/syslogd
#ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]
CMD ["/usr/sbin/sshd", "/usr/sbin/nginx"]

