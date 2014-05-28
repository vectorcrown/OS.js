# Installation
Installation only requires a few small steps.

* **Pull code:** `git pull --recursive https://github.com/andersevenrud/OS.js-v2.git`
* Run `make`
* Set up a web-server (look below)

Links:

* [Installation overview](https://github.com/andersevenrud/OS.js-v2/wiki/Installation-overview)
* [Installation and configuration help](https://github.com/andersevenrud/OS.js-v2/wiki/Installation%20and%20Configuration)
* [Installation without Git](https://github.com/andersevenrud/OS.js-v2/wiki/Installation%20and%20Configuration#installation-without-git)

## Notes

By default OS.js filesystem is restricted to `/opt/OSjs/tmp` and `/opt/OSjs/home`.
Make sure these directories exist and are readable+writable by the running web-server process.

More information on configuring the backend and frontend on Wiki.

*Small Note: OS.js will not run without a web-server unless you modify browser cross-origin settings and update files to load from relative paths.*


### PHP5 With Apache

See `doc/apache.conf` for an example

* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", you can most likely skip this)
  * Make sure .htaccess is allowed
  * Make sure mod_rewrite is enabled

### PHP5 Internal Web-server
*This is mostly used for debugging and testing purposes (PHP 5.4+)*

* Run `make php-webserver`

### Node.js
*Please note that the node server is not finished yet, but is working for development purposes*

* Run `make node-webserver` or `node src/server-node/server.js`

### Lighttpd

See `doc/lighttpd.conf` for an example
