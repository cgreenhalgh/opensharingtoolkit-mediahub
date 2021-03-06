# mediahub docker-related Makefile

NAME?=default

default:
	# ...

cfengine/image.timestamp: cfengine/Dockerfile 
	sudo docker build -t cfengine cfengine
	touch cfengine/image.timestamp

# mediahub/mediahub.couch:
#	$(error "You need to create/copy an initial mediahub database file to mediahub/mediahub.couch - see the deployment documentation")

# mediahub/mediahub.couch
mediahub/image.timestamp: cfengine/image.timestamp mediahub/Dockerfile mediahub/local.ini mediahub/index.html
	sudo docker build -t mediahub mediahub
	touch mediahub/image.timestamp

nginxdev/image.timestamp: nginxdev/Dockerfile nginxdev/nginx-default.conf
	sudo docker build -t nginxdev nginxdev
	touch nginxdev/image.timestamp


#replace := $(shell echo $(NAME) | 's/#{NAME}/'$(NAME)'/g'
# better password...!

newpass = $(shell openssl rand -base64 6)

mediahub-$(NAME)/password: 
# new password...!
	-mkdir mediahub-$(NAME)
	echo $(newpass) > mediahub-$(NAME)/password

password = $(shell cat mediahub-$(NAME)/password)
passwd = $(shell openssl passwd $(password) )

mediahub-$(NAME)/htpasswd: mediahub/htpasswd.template mediahub-$(NAME)/password
	cat mediahub/htpasswd.template | sed -e "s/#{NAME}/$(NAME)/g" -e "s_#{PASSWD}_$(passwd)_g" > mediahub-$(NAME)/htpasswd

mediahub-$(NAME)/instance: 
	-mkdir mediahub-$(NAME)
	echo $(NAME) > mediahub-$(NAME)/instance

mediahub-$(NAME)/nginx-mediahub: mediahub/nginx-mediahub.template 
	-mkdir mediahub-$(NAME)
	cat mediahub/nginx-mediahub.template | sed -e "s/#{NAME}/$(NAME)/g" > mediahub-$(NAME)/nginx-mediahub

mediahub-$(NAME)/Dockerfile: mediahub/Dockerfile.template 
	-mkdir mediahub-$(NAME)
	cat mediahub/Dockerfile.template | sed -e "s/#{NAME}/$(NAME)/g" > mediahub-$(NAME)/Dockerfile

mediahub-$(NAME)/image.timestamp: mediahub-$(NAME)/Dockerfile mediahub-$(NAME)/htpasswd mediahub-$(NAME)/nginx-mediahub mediahub/image.timestamp mediahub-$(NAME)/instance
# "make image for $(NAME)"
	sudo docker build -t mediahub-$(NAME) mediahub-$(NAME)
	touch mediahub-$(NAME)/image.timestamp

.PHONY: image run restart stop start
image: mediahub-$(NAME)/image.timestamp 

ROOT_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

run: mediahub-$(NAME)/image.timestamp 
	sudo docker run --name $(NAME) -h $(NAME) -d mediahub-$(NAME)

restart: 
	sudo docker restart $(NAME)

start: 
	sudo docker start $(NAME)

stop: 
	sudo docker stop $(NAME)

rm: 
	sudo docker rm $(NAME)

ps:
	sudo docker ps -a

nginx/server.key nginx/server.crt:
# self-signed key
	openssl req -new -x509 -nodes -out nginx/server.crt -keyout nginx/server.key

nginx/local-servers:
	mkdir nginx/local-servers

nginx/local-servers/old:
	mkdir nginx/local-servers/old

.PHONY: nginx always nginx_clean_config 

containers = $(shell sudo docker ps -q)
containerconfs = $(addprefix nginx/local-servers/, $(addsuffix -https.conf, $(containers) ) ) $(addprefix nginx/local-servers/, $(addsuffix -http.conf, $(containers) ) ) 

nginx/local-servers/%.conf: IMAGE = $(shell sudo docker inspect --format '{{.Config.Image}}' $* )
nginx/local-servers/%.conf: HOST = $(shell sudo docker inspect --format '{{.NetworkSettings.IPAddress}}' $* | sed -e 's/ //g')
nginx/local-servers/%.conf: NAME = $(shell sudo docker inspect --format '{{.Name}}' $* | sed -e 's/\///g' | sed -e 's/ //g')

nginx/local-servers/%-https.conf: nginx/local-servers nginx/local-server-https.conf.template
ifeq ( $(IMAGE), $(addpredix mediahub-,$(NAME)) )
	cat nginx/local-server-https.conf.template | sed -e "s/#{NAME}/$(NAME)/g" -e "s/#{HOST}/$(HOST)/g" -e "s/#{CONTAINER}/$*/g" > $@
else
	echo "# Image $(IMAGE) - $(NAME) at $(HOST)" > $@
endif

nginx/local-servers/%-http.conf: nginx/local-servers nginx/local-server-http.conf.template
ifeq ( $(IMAGE), $(addpredix mediahub-,$(NAME)) )
	cat nginx/local-server-http.conf.template | sed -e "s/#{NAME}/$(NAME)/g" -e "s/#{HOST}/$(HOST)/g" -e "s/#{CONTAINER}/$*/g" > $@
else
	echo "# Image $(IMAGE) - $(NAME) at $(HOST)" > $@
endif

nginx_clean_config: nginx/local-servers nginx/local-servers/old
	-mv nginx/local-servers/*.conf nginx/local-servers/old

nginx: nginx/image.timestamp nginx_clean_config $(containerconfs) nginx/container.timestamp 
	sudo docker kill -s HUP nginx

nginx/image.timestamp: nginx/Dockerfile nginx/nginx-public nginx/server.key nginx/server.crt
	sudo docker build -t nginx nginx
	touch nginx/image.timestamp

nginx/container.timestamp: nginx/image.timestamp
	-mkdir nginx/local-servers
	sudo docker run --name nginx -h nginx -v $(ROOT_DIR)/nginx/local-servers:/etc/nginx/local-servers/ -d -p 80:80 -p 443:443 nginx
	touch nginx/container.timestamp

.PHONY: nginxdev

nginxdev/container.timestamp: nginxdev/image.timestamp
	-mkdir nginxdev/html
	-mkdir nginxdev/html/public
	-mkdir nginxdev/conf
	-mkdir nginxdev/conf/mediahub-servers
	sudo docker run --name nginxdev -h nginxdev -v $(ROOT_DIR)/nginxdev/html:/usr/share/nginx/html/:ro -v $(ROOT_DIR)/nginxdev/conf/mediahub-servers:/etc/nginx/mediahub-servers/:ro -d -p 8080:80 nginxdev
	touch nginxdev/container.timestamp

nginxdev: nginxdev/container.timestamp 

.PHONY: mediahubdev

mediahubdev/image.timestamp: mediahubdev/Dockerfile mediahubdev/nginx-mediahub mediahubdev/instance mediahubdev/htpasswd mediahub/image.timestamp
	sudo docker build -t mediahubdev mediahubdev
	touch mediahubdev/image.timestamp

mediahubdev/container.timestamp: mediahubdev/image.timestamp
	sudo docker run --name mediahubdev -h mediahubdev -d mediahubdev
	touch mediahubdev/container.timestamp

mediahubdev: mediahubdev/container.timestamp

.PHONY: mediahubauto

mediahubauto/setupscripts/copyfiles: mediahubauto/setupscripts/copyfiles.c
	gcc -o mediahubauto/setupscripts/copyfiles mediahubauto/setupscripts/copyfiles.c

mediahubauto/image.timestamp: mediahubauto/Dockerfile mediahubauto/nginx-mediahubauto mediahub/image.timestamp mediahubauto/setuphtml/index.html mediahubauto/setuphtml/setup.php mediahubauto/setupscripts/copyfiles
	sudo docker build -t mediahubauto mediahubauto
	touch mediahubauto/image.timestamp

mediahubauto: mediahubauto/image.timestamp
	echo sudo docker run -d mediahubauto


