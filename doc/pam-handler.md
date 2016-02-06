With the *pam* handler you can enable a login prompt for OS.js and connect it to your system authentication system.

## Setup

```
# Install node dependencies (you need PAM development package on your system)
$ npm install nan@1.1.0
$ npm install authenticate-pam
$ npm install userid

# Set up groups
$ mkdir /etc/osjs
$ edit /etc/osjs/groups.json

# Set up package blacklist (optional)
$ edit /etc/osjs/blacklist.json

# Change `handler` to `pam`
$ grunt config:set:handler:pam

# Optionally configure the paths used
$ edit src/conf/190-handler.json

# Update configuration and template files
$ grunt config

# Rebuild (only required if you use `dist`)
# grunt core

```


**NOTE:** On some systems you might have to install `authenticate-pam` with `npm install -g` or else you might get a *Error in service module* upon request.

**NOTE:** Also, on some systems you might have to run OS.js server as an administrator (`sudo`) depending on the PAM setup.


### groups.json

This is an example file for `groups.json`

```
{
  "anders": ["admin"],
  "guest": ["api", "application", "upload", "vfs"],
  "marcello": ["api", "application", "curl", "upload", "vfs"]
}
```

### blacklist.json

This is an example file for `blacklist.json`

```

{
  "anders": ["ApplicationDraw"]
}

```
