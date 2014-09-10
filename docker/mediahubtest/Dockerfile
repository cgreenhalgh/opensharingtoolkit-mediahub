FROM mediahub

# cfengine, no ssh fix
RUN sed -i 's/"ssh",//' /var/cfengine/inputs/promises.cf

# nginx config
RUN mkdir -p /etc/nginx/mediahub-servers/
ADD nginx-mediahub /etc/nginx/sites-available/default
ADD instance /home/root/opensharingtoolkit-mediahub/
ADD htpasswd /etc/nginx/conf/

#cfengine
ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]
