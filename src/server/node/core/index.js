/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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
(function(_path, _fs, _cp) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // GLOBALS
  /////////////////////////////////////////////////////////////////////////////

  var apiNamespace = {};
  var vfsNamespace = {};
  var config = {};

  function defaultResponse() {
    return {
      statusCode: 200
    };
  }

  function defaultRequest() {
    return {
      session: {
        get: function(k) {
          if ( k === 'username' ) {
            return 'demo';
          } else if ( k === 'groups' ) {
            return ['admin'];
          }
          return null;
        },
        set: function() {
        }
      }
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // METHODS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * API Request proxy
   */
  function request(isVfs, method, args, callback, req, response, handler) {
    response = response || defaultResponse();
    req = req || defaultRequest();

    var server = {
      request: req,
      response: response,
      config: config,
      handler: handler
    };

    if ( isVfs ) {
      if ( vfsNamespace[method] && ((['getMine', 'getRealPath']).indexOf(method) < 0) ) {
        vfsNamespace[method](server, args, callback);
        return;
      }
      throw 'Invalid VFS method: ' + method;
    } else {
      if ( apiNamespace[method] ) {
        apiNamespace[method](server, args, callback);
        return;
      }
    }

    throw 'Invalid method: ' + method;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Initializes OS.js APIs and configurations
   *
   * @param   Object    setup       Configuration
   *
   * @option  setup     int       port        Listening port (default=null/auto)
   * @option  setup     String    dist        Build name (default=dist)
   * @option  setup     String    dirname     Server running dir (ex: /osjs/src/server/node)
   * @option  setup     String    root        Installation root directory (ex: /osjs)
   * @option  setup     boolean   nw          NW build (default=false)
   * @option  setup     boolean   logging     Enable logging (default=true)
   * @option  setup     Mixed     settings    (Optional) Auto-detected. Path to Settings JSON file or Object
   * @option  setup     String    repodir     (Optional) Auto-detected. Package repository root directory (ex: /osjs/src/packages)
   * @option  setup     String    distdir     (Optional) Auto-detected. Build root directory (ex: /osjs/dist)
   *
   * @return  Object                          Returns an object with `api`, `vfs`, `request`, `handler` and `config`/`setup` helpers
   *
   * @api     osjs.init
   */
  module.exports.init = function(setup) {
    (function _setDefaultInitParams() {
      setup.dist     = setup.dist     || 'dist';
      setup.settings = setup.settings || _path.join(_path.dirname(setup.dirname), 'settings.json');
      setup.repodir  = setup.repodir  || _path.join(setup.root, 'src', 'packages');
      setup.distdir  = setup.distdir  || _path.join(setup.root, setup.dist);
      setup.logging  = typeof setup.logging === 'undefined' || setup.logging === true;
    })();

    if ( setup.nw ) {
      setup.repodir = _path.join(setup.root, 'packages');
      setup.distdir = setup.root;
    }

    // Register manifest
    var metadata = JSON.parse(_fs.readFileSync(_path.join(_path.dirname(setup.dirname), 'packages.json')));
    var children = [];

    // Register configuration
    config = require('./config.js').init(setup);

    function down() {
      children.forEach(function(c) {
        c.kill();
      });
    }

    // Public namespace
    var instance = {
      _vfs: require('./vfs.js'),
      _api: require('./api.js'),
      api: apiNamespace,
      vfs: vfsNamespace,
      metadata: metadata,
      request: request,
      config: config,
      setup: setup,
      down: down
    };

    // Set tmpdir
    process.env.TMPDIR = config.tmpdir || '/tmp';

    // Register handler
    instance.handler = require('./handler.js').init(instance);

    // Register package extensions
    (function(exts) {
      exts.forEach(function(f) {
        if ( f.match(/\.js$/) ) {
          if ( setup.logging ) {
            console.info('+++', f);
          }
          if ( _fs.existsSync(config.rootdir + f) ) {
            require(config.rootdir + f).register(instance.api, instance.vfs, instance);
          }
        }
      });
    })(config.extensions || []);

    // Package spawners
    Object.keys(metadata).forEach(function(pn) {
      var p = metadata[pn];
      if ( p.type === 'extension' && p.enabled !== false && p.spawn && p.spawn.enabled ) {
        var dir = _path.join(setup.repodir, pn, p.spawn.exec);
        if ( setup.logging ) {
          console.log('###', 'Starting spawner', pn, dir.replace(setup.root, '/'));
        }

        children.push(_cp.fork(dir), [], {
          stdio: 'pipe'
        });
      }
    });

    // Proxies
    (function() {
      if ( config.proxies && setup.logging ) {
        Object.keys(config.proxies).forEach(function(k) {
          console.info('---', k, 'is a proxy!');
        });
      }
    })();

    return instance;
  };

})(require('path'), require('fs'), require('child_process'));
