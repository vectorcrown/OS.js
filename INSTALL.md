# Installation
Installation only requires a few small steps.

## Frontend
You can override default settings by creating your own `settings.js` file. More information in Wiki

## Backend
By default OS.js filesystem is restricted to `/opt/OSjs/tmp` and `/opt/OSjs/home`.
Make sure these directories exist and are readable+writable by the running web-server process.

More information on configuring the backend on Wiki.

### Apache + PHP
* Clone OS.js-v2 with (git --recursive)
* Set up an Apache vhost and point to cloned directory (If you have a "web hosting service", you can most likely skip this)
  * Make sure .htaccess is allowed
  * Make sure mod_rewrite is enabled

You should now be up and running :)

### Node.js
**NOT IN REPOSITORY YET**
* Clone OS.js-v2 with (git --recursive)
* Run `backend/server.js`

You should now be up and running :)
