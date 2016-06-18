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
(function(Utils, API) {
  'use strict';

  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var OSjsStorage = {};
  OSjsStorage.url = function(item, callback) {
    var root = window.location.pathname || '/';
    if ( root === '/' || window.location.protocol === 'file:' ) {
      root = '';
    }

    var url = item.path.replace(OSjs.VFS.Modules.OSjs.match, root);
    callback(false, url);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WRAPPERS
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};

    var restricted = ['write', 'copy', 'move', 'unlink', 'mkdir', 'exists', 'fileinfo', 'trash', 'untrash', 'emptyTrash', 'freeSpace'];
    if ( OSjsStorage[name] ) {
      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      return OSjsStorage[name].apply(OSjsStorage, fargs);
    } else if ( restricted.indexOf(name) !== -1 ) {
      return callback(API._('ERR_VFS_UNAVAILABLE'));
    }
    OSjs.VFS.Transports.Internal.request.apply(null, arguments);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * This is a virtual module for showing 'dist' files in OS.js
   *
   * @see OSjs.VFS.Transports.Internal
   * @api OSjs.VFS.Modules.OSjs
   */
  OSjs.VFS.Modules.OSjs = OSjs.VFS.Modules.OSjs || OSjs.VFS._createMountpoint({
    readOnly: true,
    description: 'OS.js',
    root: 'osjs:///',
    match: /^osjs\:\/\//,
    icon: 'devices/harddrive.png',
    visible: true,
    internal: true,
    searchable: true,
    enabled: function() {
      return OSjs.VFS.isInternalEnabled('osjs');
    },
    request: makeRequest
  });

})(OSjs.Utils, OSjs.API);
