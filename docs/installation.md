# Installation Guide

There are quite a number of ways in which the wototo service can be deployed. At some point it may be available on a subscription basis (i.e. Software as a Service, SaaS). In the mean time you will need to set up and maintain your own personal wototo service, either on a desktop or laptop computer, or on a server. 

You should be able to run Wototo on a moderate specification desktop or laptop computer running a reasonably recent version of Linux, Windows or MacOS X. If you run Wototo on a desktop or laptop computer then you will probably not be able to use the Forms functionality, and if you want publish material generally then you will also need space on a web server that supports static files and PHP.

To run wototo on a server you will need an Internet-accessible Unix (Linux) server with shell access and root/admin permission; typically this will be a virtual machine (VM) or virtual private server (VPS). On a server Wototo can run alongside other services, but you will need to set up your existing web server (assuming you are running one) to forward requests to Wototo.



## Personal / test instance

### Creating

You can create a single personal or test instance of the mediahub using the pre-built docker image `cgreenhalgh/mediahub-test`.

- install docker as per the [docker installation](http://docs.docker.com/installation/) for your operating system. (If you are using windows and having trouble see notes below.)

- if on windows or Mac start boot2docker as per the installation guide, e.g. on Windows click `boot2docker start`. (If you are using Linux then docker will run directly on your machine.)

- download the docker image `cgreenhalgh/mediahub-test:latest` (if on windows or Mac do this in the boot2docker window; on Linux do it in a `term` window - on Linux you will need to be root us add `sudo` to the beginning of the line):
```
docker pull cgreenhalgh/mediahub-test:latest
```

- start a new mediahub instance from that image (and by default make it accessible via port 80 on the docker host):
```
docker run -d -p :80:80 cgreenhalgh/mediahub-test:latest
```

- If on windows or Mac and you want to access the mediahub from other machines on the network then you will need to make the port accessible, e.g. on Windows open `Oracle VM VirtualBox`, find the entry on the left for `boot2docker-vm`, select it and click `Settings`, select `Network`, on the `Adapter 1` tab click `Port Forwarding`, click `Insert new rule` (diamond/plus icon), and enter `Host Port` `80` and `Guest Port` `80`; click `OK`, `OK`.

- Open a browser and enter the URL of the new instance. Note: don't use `localhost` or `127.0.0.1` - find the actual IP address of your machine (or the docker host vm), e.g. on windows open a `Command Prompt` and type `ipconfig`, find the first `Ethernet adapter...` entry if using Ethernet (`Wifi adapter...` or equivalent if using Wifi) and look at the row `IPv4 Address...` - copy this address (four numbers with dots in between) into the web browser. 

- with a bit of luck you'll now see a simple web page with a title (OpenSharingToolkit Mediahub) and a link `Editor` - click this for the authoring and publishing view. The username and password are `test` and `test` - this isn't intended for use on a publicly accessible machine!

- Now try the tutorial in the [user guide](userguide.md)

### Checking / restarting

Note that if you restart your computer or boot2docker, depending on how you do it, the mediahub instance may not be running afterwards. You can check and if necessary restart it as follows:

- If on Windows or Mac check that boot2docker is running, and if not start it (as above).

- Check if it is still running (as above, if on windows or Mac do this in the boot2docker window; on Linux do it in a `term` window - on Linux you will need to be root us add `sudo` to the beginning of the line):
```
docker ps | grep mediahub
```
- if you see an entry for the mediahub in this list of running docker "containers" then no need to worry - it is running. Otherwise...

- find the stopped container which is your instance:
```
docker ps -a | grep mediahub
```
- if there is NO entry then you don't have an instance here - you'll have to start a new one as above. If there is an entry...
- copy the first "word" in the line (about 12 letters and digits) and paste this instead of `CONTAINERD` below:
```
docker start CONTAINERID
```
- with a bit of luck that will restart the mediahub instance, and you can access it from your browser as before.

### Boot2Docker Windows issues

As of 2014-09-10 following the [docker installation for windows](http://docs.docker.com/installation/windows/) instructions didn't work for me - clicking on the `boot2docker start` link just opened an editor. This may be because I am using a University computer. If you have similar issues then check out the [windows installer issues list](https://github.com/boot2docker/windows-installer/issues). In my case I had to open the control panel, search for `environment` and open the `Edit environment variables for your account` option, add a `New...` user variable `Variable name:` `PATH` and `Variable value:` `%PATH%;C:\Program Files (x86)\Git\`. I also had to `change the file type associated with a file extension` (again in the control panel) for the file extension `.sh` to the program (`Change program...`, `Browse...`) `C:\Program Files (x86)\Git\bin\bash.exe`.


