/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
/*eslint strict:["error", "global"]*/
'use strict';

const _fs = require('fs-extra');
const _passwd = require('passwd-linux');
const _userid = require('userid');
const _settings = require('./../../core/settings.js');

function _readFile(username, path, resolve) {
  function _done(data) {
    data = data || {};
    resolve(username ? (data[username] || []) : data);
  }

  _fs.readFile(path, (err, data) => {
    if ( err ) {
      _done(null);
    } else {
      try {
        _done(JSON.parse(data));
      } catch ( e ) {
        console.warn('Failed to read', path);
        _done({});
      }
    }
  });
}

module.exports.login = function(http, data) {
  return new Promise((resolve, reject) => {
    _passwd.checkPass(data.username, data.password, (err, res) => {
      if ( !err && res !== 'passwordCorrect' ) {
        err = 'Invalid credentials';
      }

      if ( err ) {
        reject(err);
      } else {
        resolve({
          id: _userid.uid(data.username),
          username: data.username,
          name: data.username
        });
      }
    });
  });
};

module.exports.logout = function(http) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.manage = function(http) {
  return new Promise((resolve, reject) => {
    reject('Not available');
  });
};

module.exports.initSession = function(http) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.checkPermission = function(http, type, options) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.checkSession = function(http) {
  return new Promise((resolve, reject) => {
    if ( http.session.get('username') ) {
      resolve();
    } else {
      reject('You have no OS.js Session, please log in!');
    }
  });
};

module.exports.getGroups = function(http, username) {
  const config = _settings.get();
  const path = config.modules.auth.shadow.groups;
  return new Promise((resolve) => {
    _readFile(username, path, resolve);
  });
};

module.exports.getBlacklist = function(http, username) {
  const config = _settings.get();
  const path = config.modules.auth.shadow.blacklist;
  return new Promise((resolve) => {
    _readFile(username, path, resolve);
  });
};

module.exports.setBlacklist = function(http, username, list) {
  return new Promise((resolve) => {
    resolve(true);
  });
};

module.exports.register = function(config) {
  return Promise.resolve();
};

module.exports.destroy = function() {
  return Promise.resolve();
};
