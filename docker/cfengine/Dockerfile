FROM ubuntu:14.04.1
MAINTAINER Eystein Måløy Stenberg <eytein.stenberg@gmail.com>

RUN apt-get update && apt-get -y install wget lsb-release unzip

# install latest CFEngine
RUN ( wget -qO- http://cfengine.com/pub/gpg.key | apt-key add - ) && \
  echo "deb http://cfengine.com/pub/apt $(lsb_release -cs) main" > /etc/apt/sources.list.d/cfengine-community.list && \
  apt-get update && \
  apt-get install cfengine-community

# install cfe-docker process management policy
RUN wget --no-check-certificate https://github.com/estenberg/cfe-docker/archive/master.zip -P /tmp/ && unzip /tmp/master.zip -d /tmp/ && \
  cp /tmp/cfe-docker-master/cfengine/bin/* /var/cfengine/bin/ && \
  cp /tmp/cfe-docker-master/cfengine/inputs/* /var/cfengine/inputs/ && \
  rm -rf /tmp/cfe-docker-master /tmp/master.zip

#ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]

