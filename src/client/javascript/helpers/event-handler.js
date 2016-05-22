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

(function(Utils, API, GUI, Window) {
  'use strict';

  var OSjs = window.OSjs = window.OSjs || {};

  OSjs.Helpers = OSjs.Helpers || {};

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Event Handler Class
   *
   * This class just holds a map of events that you can trigger.
   *
   * @param   String      name        A name (identifier)
   * @param   Array       names       List of initial event names
   *
   * @see     OSjs.Helpers.EventHandler
   * @api     OSjs.Core.Window
   * @class
   */
  function EventHandler(name, names) {
    this.name   = name;
    this.events = {};

    (names || []).forEach(function(n) {
      this.events[n] = [];
    }, this);

    console.debug('EventHandler::constructor()', this.events);
  }

  EventHandler.prototype.destroy = function() {
    this.events = {};
  };

  /**
   * Register an event
   *
   * You can also give a RegExp pattern as a name to match multiple entries,
   * as well as a comma separated string.
   *
   * @param   String    name        Event name
   * @param   Function  cb          Callback function
   * @param   Object    thisArg     (Optional) Set 'this'
   *
   * @method  EventHandler::on()
   */
  EventHandler.prototype.on = function(name, cb, thisArg) {
    thisArg = thisArg || this;

    if ( !(cb instanceof Function) ) {
      throw new TypeError('EventHandler::on() expects cb to be a Function');
    }

    var self = this;
    var added = [];

    function _register(n) {
      if ( !(self.events[n] instanceof Array) ) {
        self.events[n] = [];
      }

      added.push(self.events[n].push(function(args) {
        return cb.apply(thisArg, args);
      }));
    }

    if ( name instanceof RegExp ) {
      Object.keys(this.events).forEach(function(n) {
        if ( name.test(n) ) {
          _register(n);
        }
      });
    } else {
      name.replace(/\s/g, '').split(',').forEach(function(n) {
        _register(n);
      });
    }

    return added.length === 1 ? added[0] : added;
  };

  /**
   * Unregister an event
   *
   * @param   String    name        Event name
   * @param   integer   index       Event index (as returned by on())
   *
   * @method  EventHandler::off()
   */
  EventHandler.prototype.off = function(name, index) {
    if ( !(this.events[name] instanceof Array) ) {
      throw new TypeError('Invalid event name');
    }

    if ( arguments.length > 1 && typeof index === 'number' ) {
      this.events[name].splice(index, 1);
    } else {
      this.events[name] = [];
    }
  };

  /**
   * Fire an event
   *
   * @param   String    name        Event name
   * @param   Array     args        List of arguments to send to .apply()
   *
   * @method  EventHandler::emit()
   */
  EventHandler.prototype.emit = function(name, args) {
    args = args || [];

    if ( !(this.events[name] instanceof Array) ) {
      return;
    }

    (this.events[name]).forEach(function(fn) {
      try {
        fn(args);
      } catch ( e ) {
        console.warn('EventHandler::emit() exception', name, e);
        console.warn(e.stack);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Helpers.EventHandler = EventHandler;

})(OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.Core.Window);
