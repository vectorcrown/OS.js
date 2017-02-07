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

//const _vfs = require('./../../core/vfs.js');
//const _http = require('./../../core/http.js');
const _instance = require('./../../core/instance.js');

/*
 * Unloads the VFS watching
 */
module.exports.destroy = function() {
  return Promise.resolve();
};

/*
 * Registers VFS watching
 */
module.exports.register = function(env, config, servers) {
  const logger = _instance.getLogger();

  /*
  try {
    const wss = servers.websocketServer;
    if ( !wss ) {
      return;
    }

    const list = _vfs.initWatch((data) => {
      const username = data.watch.args['%USERNAME'];
      _http.broadcastMessage(username, 'vfs:watch', {
        event: data.watch.event,
        file: {
          path: data.watch.path
        }
      });
    });

    if ( list.length ) {
      logger.lognt('INFO', 'Service:', logger.colored('Watching', 'bold'), list.join(', '));
    }
  } catch ( e ) {
    logger.lognt('ERROR', e);
  }
  */

  logger.lognt('WARN', logger.colored('VFS watching module is disabled due to issues related to third-party modules. Client-side watching is used instead....', 'yellow'));
};
