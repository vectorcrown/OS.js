"use strict";
/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
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
(function() {

  window.OSjs = window.OSjs || {};
  OSjs.Utils = OSjs.Utils || {};

  var _LOADED = {};

  var checkLoadedStyle = function(path) {
    var lst = document.styleSheet || [];
    if ( lst.length ) {
      for ( var i = 0; i < lst.length; i++ ) {
        if ( lst[i].href.indexOf(path) !== -1 ) {
          return true;
        }
      }
    }
    return false;
  };

  var createStyle = function(src, callback, opts) {
    opts = opts || {};

    if ( typeof opts.check === 'undefined' ) {
      opts.check = true;
    }

    var interval  = opts.interval || 50;
    var maxTries  = opts.maxTries || 10;

    var _finished = function(result) {
      console.info("Preloader->createStyle()", result ? 'success' : 'error', src);
      callback(result);
    };

    if ( document.createStyleSheet ) {
      document.createStyleSheet(src);
      _finished(true);
    } else {
      var res    = document.createElement("link");
      res.rel    = "stylesheet";
      res.type   = "text/css";
      res.href   = src;
      document.getElementsByTagName("head")[0].appendChild(res);

      if ( opts.check === false || (typeof document.styleSheet === 'undefined') ) {
        _finished(true);
      } else if ( !checkLoadedStyle(src) ) {
        var ival;

        var _clear = function(result) {
          if ( ival ) {
            clearInterval(ival);
            ival = null;
          }
          _finished(result);
        };

        ival = setInterval(function() {
          console.debug("Preloader->createStyle()", 'check', src);
          if ( checkLoadedStyle(src) ) {
            return _clear(true);
          } else if ( maxTries <= 0 ) {
            return _clear(false);
          }
          maxTries--;
        }, interval);
      }
    }
  };

  var createScript = function(src, callback) {
    var _finished = function(result) {
      console.info("Preloader->createScript()", result ? 'success' : 'error', src);
      callback(result);
    };

    var loaded  = false;
    var res     = document.createElement("script");
    res.type    = "text/javascript";
    res.charset = "utf-8";
    res.onreadystatechange = function() {
      if ( (this.readyState == 'complete' || this.readyState == 'loaded') && !loaded) {
        loaded = true;
        _finished(true);
      }
    };
    res.onload = function() {
      if ( loaded ) return;
      loaded = true;
      _finished(true);
    };
    res.onerror = function() {
      if ( loaded ) return;
      loaded = true;

      _finished(false);
    };
    res.src = src;

    document.getElementsByTagName("head")[0].appendChild(res);
  };

  OSjs.Utils.Preload = function(list, callback) {
    list     = list     || [];
    callback = callback || function() {};

    var count       = list.length;
    var successes   = 0;
    var failed      = [];

    var _finished = function() {
      callback(count, failed.length, failed);
    };

    var _loaded = function(success, src) {
      if ( success ) {
        successes++;
      } else {
        failed.push(src);
      }


      if ( list.length ) {
        _next();
      } else {
        _finished();
      }
    };

    var _next = function() {
      if ( list.length ) {
        var item = list.pop();
        if ( _LOADED[item.src] ) {
          _loaded(true);
          return;
        }
        _LOADED[item.src] = true;

        if ( item.type.match(/^style/) ) {
          createStyle(item.src, _loaded);
        } else if ( item.type.match(/script$/) ) {
          createScript(item.src, _loaded);
        }
      }
    };

    if ( list.length ) {
      console.log("Preloader", count, "file(s)", list);
      _next();
    } else {
      _finished();
    }
  };

})();
