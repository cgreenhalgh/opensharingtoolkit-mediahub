FROM ubuntu
MAINTAINER Chris Greenhalgh <chris.greenhalgh@nottingham.ac.uk>

RUN apt-get update
RUN apt-get -y install nginx

RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf 

EXPOSE 80

VOLUME /var/log
# default!
VOLUME /usr/share/nginx/html

CMD ["/usr/sbin/nginx"]

