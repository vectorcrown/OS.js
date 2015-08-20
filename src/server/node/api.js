/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2015, Anders Evenrud <andersevenrud@gmail.com>
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
(function(_path, _url, _request, _vfs) {

  exports.register = function(CONFIG, API, HANDLER) {
    console.info('-->', 'Registering default API methods');

    API.application = function(args, callback, request, response) {
      if ( !HANDLER.checkPrivilege(request, response, 'application') ) {
        return;
      }

      var apath = args.path || null;
      var aname = args.application || null;
      var ameth = args.method || null;
      var aargs = args['arguments'] || [];

      var aroot = _path.join(CONFIG.repodir, apath);
      var fpath = _path.join(aroot, "api.js");

      try {
        var api = require(fpath);
        api[aname].call(ameth, aargs, function(result, error) {
          error = error || null;
          if ( error !== null ) {
            result = null;
          }
          callback(error, result);
        });
      } catch ( e ) {
        callback("Application API error or missing: " + e.toString(), null);
      }
    };

    API.fs = function(args, callback, request, response) {
      if ( !HANDLER.checkPrivilege(request, response, 'vfs') ) {
        return;
      }

      var m = args.method;
      var a = args['arguments'] || [];

      if ( _vfs[m] ) {
        _vfs[m](a, request, function(json) {
          if ( !json ) json = { error: 'No data from response' };
          callback(json.error, json.result);
        }, CONFIG);
      } else {
        throw "Invalid VFS method: " + m;
      }
    };

    API.curl = function(args, callback, request, response) {
      if ( !HANDLER.checkPrivilege(request, response, 'curl') ) {
        return;
      }

      var url = args.url;
      var method = args.method || 'GET';
      var query = args.query || {};
      var timeout = args.timeout || 0;
      var binary = args.binary === true;
      var mime = args.mime || null;

      if ( !mime && binary ) {
        mime = 'application/octet-stream';
      }

      if ( !url ) {
        callback('cURL expects an "url"');
        return;
      }

      var opts = {
        url: url,
        method: method,
        timeout: timeout * 1000
      };

      if ( method === 'POST' ) {
        opts.json = true;
        opts.body = query;
      }

      _request(opts, function(error, response, body) {
        if ( error ) {
          callback(error);
          return;
        }

        if ( binary && body ) {
          body = "data:" + mime + ";base64," + (new Buffer(body).toString('base64'));
        }

        var data = {
          httpCode: response.statusCode,
          body: body
        };

        callback(false, data);
      });
    };

  };

})(
  require("path"),
  require("url"),
  require("request"),
  require("./vfs.js")
);
