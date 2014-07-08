FROM cfengine

RUN apt-get update
RUN apt-get -y install openssh-server
RUN mkdir -p /var/run/sshd
RUN echo "root:password" | chpasswd  # need a password for ssh

RUN apt-get -y install nginx 

RUN apt-get -y install couchdb 
RUN mkdir -p /var/run/couchdb

RUN apt-get -y install npm

EXPOSE 80
EXPOSE 443
EXPOSE 22

# can't run couchdb using standard for with cfengine as executable name is different, i.e. 
RUN echo "/usr/lib/erlang/erts-5.10.4/bin/beam, /usr/bin/couchdb" >> /var/cfengine/inputs/processes_run.csv

VOLUME /var/lib/couchdb

# mediahub app - using copy of couchdb database file
#RUN mkdir -p /var/lib/couchdb
COPY mediahub.couch /var/lib/couchdb/

# couchdb direct external access (for testing ONLY!)
#COPY local.ini /etc/couchdb/
#EXPOSE 5984
# end

VOLUME /var/log

# nginx config
COPY nginx-mediahub /etc/nginx/sites-available/default
RUN mkdir -p /etc/nginx/conf/
COPY htpasswd /etc/nginx/conf/

CMD ["/usr/sbin/sshd", "/usr/sbin/nginx"]

