# OS.js on Node

Just start a server like noted in the INSTALL.md file.

You can install [node supervisor](https://github.com/petruisfan/node-supervisor) and the development (dist-dev) server will automatically reload on change.

## Running behind a webserver

You can use nginx to run behind a webserver to increase performance and security using a *reverse proxy*. See the included [nginx-node](https://github.com/os-js/OS.js/blob/master/doc/configs/nginx-node.conf) configuration file (for a very basic example)
