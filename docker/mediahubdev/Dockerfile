# Mediahub dev instance - with more complete build environment, etc.
FROM mediahub

RUN apt-get update

# need a password for ssh
# need to allow root login
RUN apt-get -y install openssh-server && \
  mkdir -p /var/run/sshd && \
  ( echo "root:password" | chpasswd ) && \
  sed -i 's/PermitRootLogin without-password/PermitRootLogin yes/' /etc/ssh/sshd_config

RUN apt-get -y install git && \
  apt-get -y install ruby1.9.1 ruby1.9.1-dev && \
  gem install compass && \
  npm install -g coffee-script && \
  rm -rf /home/root && \
  mkdir -p /home/root && \
  cd /home/root && \
  git clone https://github.com/cgreenhalgh/opensharingtoolkit-kiosk && \
  git clone https://github.com/cgreenhalgh/opensharingtoolkit-mediahub && \
  cd /home/root/opensharingtoolkit-kiosk/cache_builder && \
  npm install && \
  cd /home/root/opensharingtoolkit-mediahub && \
  npm install && \
  make css && \
  make coffee

# Fix for sshd login (why?? maybe php pulled something in) 
RUN if [ -f /etc/pam.d/sshd ]; then \
    sed -i.orig 's|^session[ \t]*required[ \t]*pam_loginuid.so|#&|' /etc/pam.d/sshd; \
  fi

# nginx config
RUN mkdir -p /etc/nginx/mediahub-servers/
ADD nginx-mediahub /etc/nginx/sites-available/default
ADD instance /home/root/opensharingtoolkit-mediahub/
ADD htpasswd /etc/nginx/conf/

EXPOSE 22
CMD ["/usr/sbin/sshd"]
ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]

