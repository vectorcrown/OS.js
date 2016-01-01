/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

(function(_path, _fs) {

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function readConfig(filename) {
    var path = _path.join(ROOTDIR, filename);
    if ( _fs.existsSync(path) ) {
      try {
        console.info('-->', 'Found configuration', filename);
        var str = _fs.readFileSync(path).toString();
        var droot = ROOTDIR.replace(/\/$/, '');

        if ( ISWIN ) {
          str = str.replace(/%DROOT%/g,       droot.replace(/(["\s'$`\\])/g,'\\$1'));
        } else {
          str = str.replace(/%DROOT%/g,       droot);
        }

        return JSON.parse(str);
      } catch ( e ) {
        console.warn('!!!', 'Failed to parse configuration', filename, e);
      }
    } else {
      console.warn('!!!', 'Did not find configuration', path);
    }
    return false;
  }

  function checkPrivilege(request, response, privilege, respond) {
    if ( typeof privilege !== 'boolean' ) {
      if ( !privilege ) privilege = [];
      if ( !(privilege instanceof Array) && privilege ) privilege = [privilege];
    }

    function check() {
      var groups = [];
      try {
        groups = JSON.parse(request.cookies.get('groups'));
      } catch ( e ) {
        groups = [];
      }

      if ( groups.indexOf('admin') < 0 ) {
        var allowed = true;
        privilege.forEach(function(p) {
          if ( groups.indexOf(p) < 0 ) {
            allowed = false;
          }
          return allowed;
        });
        return allowed;
      }

      return true;
    }

    var uname = request.cookies.get('username');
    if ( !uname ) {
      respond('You have no OS.js Session, please log in!', "text/plain", response, null, 500);
      return false;
    }

    if ( privilege.length && !check() ) {
      respond('You are not allowed to use this API function!', "text/plain", response, null, 403);
      return false;
    }

    return true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var ISWIN   = /^win/.test(process.platform);
  var HANDLER = null;
  var ROOTDIR = _path.join(_path.dirname(__filename), '/../../../');
  var DISTDIR = (process && process.argv.length > 2) ? process.argv[2] : 'dist';

  if ( (process.argv[1] || '').match(/(mocha|grunt)$/) ) {
    DISTDIR = 'dist-dev';
  }

  var API     = {};
  var CONFIG  = {
    port:       8000,
    directory:  null, // Automatic
    tmpdir:     '/tmp',
    handler:    'demo',
    vfs:        {
      'homes':   _path.join(ROOTDIR, 'vfs/home'),
      'tmp':     _path.join(ROOTDIR, 'vfs/tmp'),
      'public':  _path.join(ROOTDIR, 'vfs/public')
    },
    repodir:    _path.join(ROOTDIR, 'src/packages'),
    distdir:    _path.join(ROOTDIR, DISTDIR),
    mimes:      {}
  };

  /////////////////////////////////////////////////////////////////////////////
  // CONFIG PARSING
  /////////////////////////////////////////////////////////////////////////////

  var settConfig = readConfig("src/server/settings.json");
  if ( settConfig !== false ) {
    for ( var i in settConfig ) {
      if ( settConfig.hasOwnProperty(i) && CONFIG.hasOwnProperty(i) ) {
        CONFIG[i] = settConfig[i];
      }
    }
  }

  var tmpConfig = readConfig("src/conf/130-mime.json");
  if ( tmpConfig ) {
    CONFIG.mimes = tmpConfig.mime.mapping;
  }

  if ( !CONFIG.directory ) {
    CONFIG.directory = _fs.realpathSync('.');
  }

  /////////////////////////////////////////////////////////////////////////////
  // HANDLER INIT
  /////////////////////////////////////////////////////////////////////////////

  console.info('-->', 'Loading handler', CONFIG.handler);
  HANDLER = require(_path.join(ROOTDIR, 'src', 'server', 'node', 'handlers', CONFIG.handler , 'handler.js'));
  if ( !HANDLER.checkPrivilege ) {
    HANDLER.checkPrivilege = checkPrivilege;
  }

  if ( CONFIG.extensions ) {
    var exts = CONFIG.extensions;
    exts.forEach(function(f) {
      if ( f.match(/\.js$/) ) {
        console.info('-->', 'Registering external API methods', f);
        require(ROOTDIR + f).register(CONFIG, API, HANDLER);
      }
    });
  }

  if ( !HANDLER ) {
    console.log("Invalid handler %s defined", CONFIG.handler);
    return;
  }
  HANDLER.register(CONFIG, API, HANDLER);

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  module.exports = {
    ISWIN: ISWIN,
    HANDLER: HANDLER,
    ROOTDIR: ROOTDIR,
    DISTDIR: DISTDIR,
    API: API,
    CONFIG: CONFIG
  };
})(
  require("path"),
  require("node-fs-extra")
);
