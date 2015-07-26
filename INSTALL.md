# Installation instructions

Server runs on Linux, OS X, BSD and Windows.


If you just want to check out OS.js without building or running a server, I provide a minimalistic [nightly build](http://osjsv2.0o.no/OS.js-v2-minimal-nightly.zip).
Please note that it might be unstable, also Networking and Filesystem functions is disabled.

# Dependencies

You just need **node** and **npm**. Install them with your package manager or download the [official installer](https://nodejs.org).

**Debian\Ubuntu:** Also install package `nodejs-legacy`.

# Installation

To easily apply updates and other changes, I recommend using **git** to download instead of using a zip-file/automated installer.

## NIX

### Automated

Run `curl -sS http://os.js.org/installer | sh`.

### Manual

```shell
$ sudo npm install -g grunt-cli

# You can also download and extarct the latest zip
$ git clone https://github.com/andersevenrud/OS.js-v2.git
$ cd OS.js-v2
$ npm install
$ grunt
```

## Windows

### Automated

Download and run http://os.js.org/installer.exe.

### Manual

Run `cmd` as *Administrator* (important)!

```shell
$ npm install -g grunt-cli

# You can also download and extarct the latest zip
$ git clone https://github.com/andersevenrud/OS.js-v2.git
$ cd OS.js-v2
$ npm install

# This is required to make the Development Environment work, but is optional.
$ bin\create-windows-symlinks

$ grunt --force
```
## Containers and Virtual Machines

### Vagrant

A [Vagrant](https://www.vagrantup.com/) file is also included so you can easily set up a development or testing environment in a Virtual Machine.

Just use [this configuration file](https://raw.githubusercontent.com/andersevenrud/OS.js-v2/master/Vagrantfile).

### Docker
* Make sure to have `docker.io` installed on your machine.
* Make sure that you are in the `OS.js-v2` directory.
* You can change the `Dockerfile` around, I have left comments to help you configure it.
- Issuing `sudo docker ps` will list all your currently running containers so please refer to this if you forget which container is running your OS.js instance.
- To stop the container issue `sudo docker stop [Container ID]` in seperate terminal session / window.

1. Issue `sudo docker build -t [Image Name] .` (That's not a mistake, make sure to put that period after the image name or it won't build).

2. If built succesfully you can view your image by issueing the command. `sudo docker images`

3. To start image issue `sudo docker start [Image Name]`.

4. While the image is starting up (You can use this window as a debug console), open up another terminal window and issue `sudo docker inspect -f '{{ .NetworkSettings.IPAddress }}' [Container ID]` which will output a IP address.

5. Lastly, open your favorite web browser and type `[Container IP Address]:8000' into the address bar. This should then direct you to the OS.js Desktop. Enjoy!

* If you don't want to build from a Dockerfile or you want to run it on a Windows machine (via. Kitematic) head on over to https://registry.hub.docker.com/u/junland/osjs-dev/ where I have built and uploaded the development version (Instructions included!).

# Setting up a server

Make sure the _VFS_ directories in `vfs/` are given the same permissions as the web-servers running user.

## Standalone

You can run OS.js in `file://` (locally in browser), but this will disable any server-call and filesystem functions.

Just open `dist/index.html` after you build.

## Node

* Production: `./bin/start-node-dist.sh` or `bin\win-start-node-dist`
* Developement: `./bin/start-node-dev.sh` or `bin\win-start-node-dev`

## PHP5

### Internal Web-server for PHP 5.4+

* Production: `./bin/start-php-dist.sh`
* Developement: `./bin/start-php-dev.sh`

### Apache

Run `grunt apache-vhost` to generate config file (or look in doc/ for example)

*Note* You have to enable mod_rewrite for Apache and make sure htaccess is allowed.

### Lighttpd

Run `grunt lighttpd-config` to generate config file (or look in doc/ for example)

### Nginx

Run `grunt nginx-config` to generate config file (or look in doc/ for example)

### WAMP

Works fine. Just look up the Apache section above for configuration.

## Webhost

If you have a "webhost" (or "webhotel") with ex. cPanel without shell access (or no node support), you can run OS.js, but
has to be built on another computer, then transfered over (just follow the instructions above).

The only downside here is that you'd have to run from /OS.js-v2/dist/ without doing modifications to the setup.

## X11

OS.js can run as a *X11* Desktop.

Full documentation [here](https://github.com/andersevenrud/OS.js-v2/blob/master/doc/X11.md).

# Setting up features

I have documentation on how to set up optional core features:

* [Google API and Google Drive](http://os.js.org/doc/manuals/man-google-api.html)
* [Windows Live API and OneDrive](http://os.js.org/doc/manuals/man-windows-live-api.html)
* [Dropbox](http://os.js.org/doc/manuals/man-dropbox.html)
* [Broadway](http://os.js.org/doc/manuals/man-broadway.html)
* [ZIP support](http://os.js.org/doc/manuals/man-zip.html)

# Adding additional applications

You can find instructions [in this manual](http://os.js.org/doc/manuals/man-package-manager.html).

# Update instructions

Download and extract the latest zip, or use the preferred method (git):

```
$ git pull

# Build all changes
$ grunt

# Or just core and packages
$ grunt core packages

```

# Links

* [Manuals](http://osjs-homepage.local/OS.js-v2/doc/manuals/)
