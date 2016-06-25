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

(function(Utils, VFS, API) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // PACKAGE MANAGER
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Package Manager Class
   *
   * For maintaining packages
   *
   * You can only get an instance with `Core.getPackageManager()`
   *
   * @api  OSjs.Core.PackageManager
   * @class
   */
  var PackageManager = (function() {
    var blacklist = [];
    var packages = [];
    var uri = Utils.checkdir(API.getConfig('Connection.MetadataURI'));

    return Object.seal({

      /**
       * Load Metadata from server and set packages
       *
       * @param  Function callback      callback
       *
       * @return void
       *
       * @method PackageManager::load()
       */
      load: function(callback) {
        var self = this;
        callback = callback || {};

        console.debug('PackageManager::load()');

        function loadMetadata(cb) {
          self._loadMetadata(function(err) {
            if ( err ) {
              callback(err);
              return;
            }

            var len = Object.keys(packages).length;
            if ( len ) {
              cb();
              return;
            }

            callback(false, 'No packages found!');
          });
        }

        loadMetadata(function() {
          self._loadExtensions(function() {
            callback(true);
          });
        });
      },

      /**
       * Internal method for loading all extensions
       *
       * @param  Function callback      callback
       *
       * @return void
       *
       * @method PackageManager::_loadExtensions()
       */
      _loadExtensions: function(callback) {
        var preloads = [];

        Object.keys(packages).forEach(function(k) {
          var iter = packages[k];
          if ( iter.type === 'extension' && iter.sources ) {
            iter.sources.forEach(function(p) {
              preloads.push(p);
            });
          }
        });

        if ( preloads.length ) {
          Utils.preload(preloads, function(total, failed) {
            callback();
          });
        } else {
          callback();
        }
      },

      /**
       * Internal method for loading all package metadata
       *
       * @param  Function callback      callback
       *
       * @return void
       *
       * @method PackageManager::_loadMetadata()
       */
      _loadMetadata: function(callback) {
        var self = this;

        packages = {};

        function _loadSystemMetadata(cb) {
          var preload = [{type: 'javascript', src: uri}];
          Utils.preload(preload, function(total, failed) {
            if ( failed.length ) {
              callback('Failed to load package manifest', failed);
              return;
            }
            var packages = OSjs.Core.getMetadata();
            self._addPackages(packages, 'system');
            cb();
          });
        }

        function _loadUserMetadata(cb) {
          var path = API.getConfig('PackageManager.UserMetadata');
          var file = new OSjs.VFS.File(path, 'application/json');
          OSjs.VFS.exists(file, function(err, exists) {
            if ( err || !exists ) {
              cb();
              return;
            }

            OSjs.VFS.read(file, function(err, resp) {
              resp = OSjs.Utils.fixJSON(resp || '');
              if ( err ) {
                console.warn('Failed to read user package metadata', err);
              } else {
                if ( resp ) {
                  self._addPackages(resp, 'user');
                }
              }
              cb();
            }, {type: 'text'});
          });
        }

        _loadSystemMetadata(function(err) {
          if ( err ) {
            callback(err);
            return;
          }

          _loadUserMetadata(function() {
            callback();
          });
        });
      },

      /**
       * Generates user-installed package metadata (on runtime)
       *
       * @param  Function callback      callback
       *
       * @return void
       *
       * @method PackageManager::generateUserMetadata()
       */
      generateUserMetadata: function(callback) {
        var dir = new OSjs.VFS.File(API.getConfig('PackageManager.UserPackages'));
        var found = {};
        var queue = [];
        var self = this;

        console.debug('PackageManager::generateUserMetadata()');

        function _enumPackages(cb) {

          function __runQueue(done) {
            console.debug('PackageManager::generateUserMetadata()', '__runQueue()');

            Utils.asyncs(queue, function(iter, i, next) {
              var file = new OSjs.VFS.File(iter, 'application/json');
              var rpath = iter.replace(/\/metadata\.json$/, '');
              console.debug('PackageManager::generateUserMetadata()', '__runQueue()', 'next()', queue.length, iter);

              OSjs.VFS.read(file, function(err, resp) {
                var meta = OSjs.Utils.fixJSON(resp);
                if ( !err && meta ) {
                  console.debug('PackageManager::generateUserMetadata()', 'ADDING PACKAGE', meta);
                  meta.path = OSjs.Utils.filename(rpath);
                  meta.scope = 'user';
                  meta.preload = meta.preload.map(function(p) {
                    if ( p.src.substr(0, 1) !== '/' && !p.src.match(/^(https?|ftp)/) ) {
                      p.src = rpath + '/' + p.src.replace(/^(\.\/)?/, '');
                    }
                    return p;
                  });

                  found[meta.className] = meta;
                }

                next();
              }, {type: 'text'});
            }, done);
          }

          console.debug('PackageManager::generateUserMetadata()', '_enumPackages()');

          OSjs.VFS.scandir(dir, function(err, resp) {
            if ( err ) {
              console.error('_enumPackages()', err);
            }

            if ( resp && (resp instanceof Array) ) {
              resp.forEach(function(iter) {
                if ( !iter.filename.match(/^\./) && iter.type === 'dir' ) {
                  queue.push(Utils.pathJoin(dir.path, iter.filename, 'metadata.json'));
                }
              });
            }
            __runQueue(cb);
          });
        }

        function _writeMetadata(cb) {
          console.debug('PackageManager::generateUserMetadata()', '_writeMetadata()');

          var path = API.getConfig('PackageManager.UserMetadata');
          var file = new OSjs.VFS.File(path, 'application/json');
          var meta = JSON.stringify(found, null, 4);
          OSjs.VFS.write(file, meta, function() {
            cb();
          });
        }

        OSjs.VFS.mkdir(dir, function() {
          _enumPackages(function() {
            _writeMetadata(function() {
              self._loadMetadata(function() {
                callback();
              });
            });
          });
        });
      },

      /**
       * Add a list of packages
       *
       * @return void
       *
       * @method PackageManager::_addPackages()
       */
      _addPackages: function(result, scope) {
        console.debug('PackageManager::_addPackages()', result);

        var keys = Object.keys(result);
        if ( !keys.length ) {
          return;
        }

        var currLocale = API.getLocale();

        keys.forEach(function(i) {
          var newIter = Utils.cloneObject(result[i]);
          if ( typeof newIter !== 'object' ) {
            return;
          }

          if ( typeof newIter.names !== 'undefined' && newIter.names[currLocale] ) {
            newIter.name = newIter.names[currLocale];
          }
          if ( typeof newIter.descriptions !== 'undefined' && newIter.descriptions[currLocale] ) {
            newIter.description = newIter.descriptions[currLocale];
          }
          if ( !newIter.description ) {
            newIter.description = newIter.name;
          }

          newIter.scope = scope || 'system';
          newIter.type  = newIter.type || 'application';

          packages[i] = newIter;
        });
      },

      /**
       * Installs a package by ZIP
       *
       * @param OSjs.VFS.File   file        The ZIP file
       * @param Function        cb          Callback function
       *
       * @return void
       *
       * @method PackageManager::install()
       */
      install: function(file, cb) {
        var root = API.getConfig('PackageManager.UserPackages');
        var dest = Utils.pathJoin(root, file.filename.replace(/\.zip$/i, ''));

        function installFromZip() {
          OSjs.Helpers.ZipArchiver.createInstance({}, function(error, instance) {
            if ( error ) {
              cb(error);
              return;
            }

            if ( instance ) {
              instance.extract(file, dest, {
                onprogress: function() {
                },
                oncomplete: function() {
                  cb();
                }
              });
            }
          });
        }

        VFS.mkdir(new VFS.File(root), function() {
          VFS.exists(new VFS.File(dest), function(error, exists) {
            if ( error ) {
              cb(error);
            } else {
              if ( exists ) {
                cb(API._('ERR_PACKAGE_EXISTS'));
              } else {
                installFromZip();
              }
            }
          });
        });
      },

      /**
       * Sets the package blacklist
       *
       * @param   Array       list        List of package names
       *
       * @return  vboid
       *
       * @method  PackageManager::setBlacklist()
       */
      setBlacklist: function(list) {
        blacklist = list || [];
      },

      /**
       * Get package by name
       *
       * @param String    name      Package name
       *
       * @return Object
       *
       * @method PackageManager::getPackage()
       */
      getPackage: function(name) {
        if ( typeof packages[name] !== 'undefined' ) {
          return Object.freeze(Utils.cloneObject(packages)[name]);
        }
        return false;
      },

      /**
       * Get all packages
       *
       * @param boolean     filtered      Returns filtered list (default=true)
       *
       * @return Array
       *
       * @method PackageManager::getPackages()
       */
      getPackages: function(filtered) {
        var hidden = OSjs.Core.getSettingsManager().instance('Packages', {hidden: []}).get('hidden');
        var p = Utils.cloneObject(packages);

        function allowed(i, iter) {
          if ( blacklist.indexOf(i) >= 0 ) {
            return false;
          }

          if ( iter && (iter.groups instanceof Array) ) {
            if ( !API.checkPermission(iter.groups) ) {
              return false;
            }
          }

          return true;
        }

        if ( typeof filtered === 'undefined' || filtered === true ) {
          var result = {};
          Object.keys(p).forEach(function(name) {
            var iter = p[name];
            if ( !allowed(name, iter) ) {
              return;
            }
            if ( iter && hidden.indexOf(name) < 0 ) {
              result[name] = iter;
            }
          });

          return Object.freeze(result);
        }

        return Object.freeze(p);
      },

      /**
       * Get packages by Mime support type
       *
       * @param String    mime      MIME string
       *
       * @return  Array
       */
      getPackagesByMime: function(mime) {
        var list = [];
        var p = Utils.cloneObject(packages);

        Object.keys(p).forEach(function(i) {
          if ( blacklist.indexOf(i) < 0 ) {
            var a = p[i];
            if ( a && a.mime ) {
              if ( Utils.checkAcceptMime(mime, a.mime) ) {
                list.push(Object.freeze(Utils.cloneObject(i)));
              }
            }
          }
        });
        return list;
      },

      /**
       * Add a dummy package (useful for having shortcuts in the launcher menu)
       *
       * @param   String      n             Name of your package
       * @param   String      title         The display title
       * @param   String      icon          The display icon
       * @param   Function    fn            The function to run when the package tries to launch
       *
       * @return  void
       */
      addDummyPackage: function(n, title, icon, fn) {
        if ( packages[n] || OSjs.Applications[n] ) {
          throw new Error('A package already exists with this name!');
        }
        if ( typeof fn !== 'function' ) {
          throw new TypeError('You need to specify a function/callback!');
        }

        packages[n] = Object.seal({
          type: 'application',
          className: n,
          description: title,
          name: title,
          icon: icon,
          cateogry: 'other',
          scope: 'system'
        });

        OSjs.Applications[n] = fn;
      }
    });
  })();

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current PackageManager instance
   *
   * @return PackageManager
   * @api OSjs.Core.getPackageManager()
   */
  OSjs.Core.getPackageManager = function() {
    return PackageManager;
  };

})(OSjs.Utils, OSjs.VFS, OSjs.API);
