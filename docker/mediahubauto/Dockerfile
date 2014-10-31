FROM mediahub

# cfengine, no ssh fix
RUN sed -i 's/"ssh",//' /var/cfengine/inputs/promises.cf

# nginx config
RUN mkdir -p /etc/nginx/mediahub-servers/
ADD setuphtml/ /home/root/setuphtml/
ADD setupscripts/ /home/root/setupscripts/
RUN chmod 4755 /home/root/setupscripts/copyfiles
ADD nginx-mediahubauto /etc/nginx/sites-available/default

#test "/home/root",
#VOLUME ["/etc/nginx"]
#cfengine
ENTRYPOINT ["/var/cfengine/bin/docker_processes_run.sh"]
