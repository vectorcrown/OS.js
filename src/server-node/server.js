/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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

(function(_http, _path, _url, _fs, _qs, _multipart, _cookies, _api, _vfs)
{
  /**
   * Globals and default settings etc.
   */
  var HANDLER = null;
  var ROOTDIR = _path.join(_path.dirname(__filename), '/../../');
  var DISTDIR = (process && process.argv.length > 2) ? process.argv[2] : 'dist';
  var API     = {};
  var CONFIG  = {
    port:       8000,
    directory:  null, // Automatic
    appdirs:    null, // Automatic, but overrideable
    vfsdir:     _path.join(ROOTDIR, 'vfs/home'),
    tmpdir:     _path.join(ROOTDIR, 'vfs/tmp'),
    publicdir:  _path.join(ROOTDIR, 'vfs/public'),
    repodir:    _path.join(ROOTDIR, 'src/packages'),
    distdir:    _path.join(ROOTDIR, DISTDIR),
    mimes:      {}
  };

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * HTTP Output
   */
  var respond = function(data, mime, response, headers, code) {
    data    = data    || '';
    headers = headers || [];
    mime    = mime    || "text/html; charset=utf-8";
    code    = code    || 200;

    //console.log(">>>", 'respond()', mime, data.length);

    for ( var i = 0; i < headers.length; i++ ) {
      response.writeHead.apply(response, headers[i]);
    }

    response.writeHead(code, {"Content-Type": mime});
    response.write(data);
    response.end();
  };

  var respondJSON = function(data, response, headers) {
    data = JSON.stringify(data);
    console.log(">>>", 'application/json', data.length || 0);
    respond(data, 'application/json', response, headers);
  };

  /**
   * File Output
   */
  var respondFile = function(path, request, response, jpath) {
    var fullPath = jpath ? _path.join(CONFIG.directory, path) : _vfs.getRealPath(path, CONFIG, request).root;
    _fs.exists(fullPath, function(exists) {
      if ( exists ) {
        _fs.readFile(fullPath, function(error, data) {
          if ( error ) {
            console.log(">>>", '500', fullPath);
            console.warn(error);
            respond("500 Internal Server Error", null, response, null, 500);
          } else {
            var mime = _vfs.getMime(fullPath, CONFIG);
            console.log(">>>", '200', mime, fullPath, data.length);
            respond(data, mime, response);
          }
        });
      } else {
        console.log('!!!', '404', fullPath);
        respond("404 Not Found", null, response, null, 404);
      }
    });
  };

  var readConfig = function(filename) {
    var path = _path.join(ROOTDIR, filename);
    if ( _fs.existsSync(path) ) {
      try {
        console.info('-->', 'Found configuration', filename);
        return JSON.parse(_fs.readFileSync(path).toString());
      } catch ( e ) {
        console.warn('!!!', 'Failed to parse configuration', filename, e);
      }
    } else {
      console.warn('!!!', 'Did not find configuration', path);
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * OS.js API
   */
  var api = {
    FileGET : function(path, request, response, arg) {
      if ( !arg ) {
        console.log('---', 'FileGET', path);
      }
      respondFile(unescape(path), request, response, arg);
    },

    FilePOST : function(fields, files, request, response) {
      var srcPath = files.upload.path;
      var tmpPath = (fields.path + '/' + files.upload.name).replace('////', '///'); // FIXME
      var dstPath = _vfs.getRealPath(tmpPath, CONFIG, request).root;

      _fs.exists(srcPath, function(exists) {
        if ( exists ) {
          _fs.exists(dstPath, function(exists) {
            if ( exists ) {
              respond('Target already exist!', "text/plain", response, null, 500);
            } else {
              _fs.rename(srcPath, dstPath, function(error, data) {
                if ( error ) {
                  respond('Error renaming/moving: ' + error, "text/plain", response, null, 500);
                } else {
                  respond("1", "text/plain", response);
                }
              });
            }
          });
        } else {
          respond('Source does not exist!', "text/plain", response, null, 500);
        }
      });
    },

    CoreAPI : function(url, path, POST, request, response) {
      if ( path.match(/^\/API/) ) {
        try {
          var data   = JSON.parse(POST);
          var method = data.method;
          var args   = data['arguments'] || {}

          console.log('---', 'CoreAPI', method, args);
          if ( API[method] ) {
            API[method](args, function(error, result) {
              respondJSON({result: result, error: error}, response);
            }, request, response);
          } else {
            throw "Invalid method: " + method;
          }
        } catch ( e ) {
          console.error("!!! Caught exception", e);
          console.warn(e.stack);

          respondJSON({result: null, error: "500 Internal Server Error: " + e}, response);
        }
        return true;
      }
      return false;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // MAIN
  /////////////////////////////////////////////////////////////////////////////

  console.log('***');
  console.log('***', 'THIS IS A WORK IN PROGRESS!!!');
  console.log('***');

  /**
   * Initialize config
   */
  (function() {

    var settConfig = readConfig("src/server-node/settings.json");
    if ( settConfig !== false ) {
      for ( var i in settConfig ) {
        if ( settConfig.hasOwnProperty(i) && CONFIG.hasOwnProperty(i) ) {
          CONFIG[i] = settConfig[i];
        }
      }
    }

    var mimeConfig = readConfig("src/mime.json");
    if ( mimeConfig !== false ) {
      CONFIG.mimes = mimeConfig.mapping;
    }

    var repoConfig = readConfig("src/packages/repositories.json");
    if ( repoConfig !== false ) {
      CONFIG.appdirs = repoConfig;
    }

    if ( !CONFIG.directory ) {
      CONFIG.directory = _fs.realpathSync('.');
    }

    HANDLER = require(_path.join(ROOTDIR, 'src', 'server-node', 'handlers', settConfig.handler , 'handler.js'));

    _api.register(CONFIG, API);
    if ( settConfig.extensions ) {
      var exts = JSON.parse(settConfig.extensions);
      exts.forEach(function(f) {
        console.info('-->', 'Registering external API methods', f);
        require(f).register(settConfig, API);
      });
    }

  })();

  console.log(JSON.stringify(CONFIG, null, 2));
  if ( !HANDLER ) {
    console.log("Invalid handler %s defined", CONFIG.handler);
    return;
  }
  HANDLER.register(CONFIG, API);

  /**
   * Server instance
   */
  _http.createServer(function(request, response) {

      var url     = _url.parse(request.url, true),
          path    = decodeURIComponent(url.pathname),
          cookies = new _cookies(request, response);

      request.cookies = cookies;

      if ( path === "/" ) path += "index.html";
      console.log('<<<', path);

      if ( request.method == 'POST' ) 
      {
        // File Uploads
        if ( path.match(/^\/FS$/) ) {
          var form = new _multipart.IncomingForm();
          form.parse(request, function(err, fields, files) {
            api.FilePOST(fields, files, request, response);
          });
        }

        // API Calls
        else {
          var body = '';
          request.on('data', function (data) {
            body += data;
          });

          request.on('end', function () {
            if ( !api.CoreAPI(url, path, body, request, response) ) {
              console.log(">>>", '404', path);
              respond("404 Not Found", null, response, [[404, {}]]);
            }
          });
        }
      }

      // File Gets
      else {
        if ( path.match(/^\/FS/) ) {
          api.FileGET(path.replace(/^\/FS/, ''), request, response, false);
        } else {
          api.FileGET(_path.join(DISTDIR, path), request, response, true);
        }
      }
  }).listen(CONFIG.port);

})(
  require("http"),
  require("path"),
  require("url"),
  require("node-fs-extra"),
  require("querystring"),
  require("formidable"),
  require("cookies"),
  require("./api.js"),
  require("./vfs.js")
);
