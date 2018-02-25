<p align="center">
  <img alt="OS.js Logo" src="https://raw.githubusercontent.com/os-js/gfx/master/logo-big.png" />
</p>

[OS.js](https://www.os-js.org/) is an [open-source](https://raw.githubusercontent.com/os-js/OS.js/master/LICENSE) desktop implementation for your browser with a fully-fledged window manager, Application APIs, GUI toolkits and filesystem abstraction.

[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.os-js.org/)
[![JS.ORG](https://img.shields.io/badge/js.org-os-ffb400.svg)](http://js.org)
[![Donate](https://img.shields.io/badge/liberapay-donate-yellowgreen.svg)](https://liberapay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=andersevenrud%40gmail%2ecom&lc=NO&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)

# OS.js Base Project

This is the base project that can be used to make, deploy or develop OS.js.

**PLEASE NOTE THAT THIS IS AN ALPHA PRE-RELEASE AND SUBJECT TO CHANGE WITHOUT NOTICE**

**ALSO PLEASE NOTE THAT THE DEPENDENCIES ARE NOT PUBLISHED NPM AS OF NOW, SO YOU NEED TO USE 'npm link'**

https://github.com/os-js/OS.js/issues/671

## Requirements

Node 8 (or newer) and any modern web-browser.

**NOT TESTED ON WINDOWS AT THE MOMENT**

## Installation

```
git clone -b v3 https://github.com/os-js/OS.js.git
cd OS.js
npm install

# Build package manifests
npm run build:manifest

# Build your project
npm run build:dist

# Start serving
npm run serve
```

## Development

```
npm run watch:dist
```

## Documentation

TODO
