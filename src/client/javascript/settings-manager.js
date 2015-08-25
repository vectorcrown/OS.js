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

(function(Utils, VFS, API) {
  'use strict';

  /**
   * Settings Manager Class
   *
   * For maintaining settings
   *
   * You can only get an instance with `Core.getSettingsManager()`
   *
   * @api     OSjs.Core.SettingsManager
   * @class
   */
  var SettingsManager = {
    storage: {},
    defaults: {}
  };

  /**
   * Initialize SettingsManager.
   * This is run when a user logs in. It will give saved data here
   *
   * @param Object    settings      Entire settings tree
   *
   * @return  void
   *
   * @method  SettingsManager::init()
   */
  SettingsManager.init = function(settings) {
    this.storage = settings || {};
  };

  /**
   * Gets either the full tree or tree entry by key
   *
   * @param  String     pool      Name of settings pool
   * @param  String     key       (Optional) Key entry of tree
   *
   * @return  Mixed
   *
   * @method  SettingsManager::get()
   */
  SettingsManager.get = function(pool, key) {
    try {
      if ( this.storage[pool] && Object.keys(this.storage[pool]).length ) {
        return key ? this.storage[pool][key] : this.storage[pool];
      }

      return key ? this.defaults[pool][key] : this.defaults[pool];
    } catch ( e ) {
      console.warn('SettingsManager::get()', 'exception', e, e.stack);
    }

    return false;
  };

  /**
   * Sets either full tree or a tree entry by key
   *
   * @param  String     pool      Name of settings pool
   * @param  String     key       (Optional) Key entry of tree
   * @param  Mixed      value     The value (or entire tree if no key given)
   * @param  Mixed      save      (Optional) boolean or callback function for saving
   *
   * @return  boolean
   *
   * @method  SettingsManager::set()
   */
  SettingsManager.set = function(pool, key, value, save) {
    try {
      if ( key ) {
        if ( typeof this.storage[pool] === 'undefined' ) {
          this.storage[pool] = {};
        }
        this.storage[pool][key] = value;
      } else {
        this.storage[pool] = value;
      }
    } catch ( e ) {
      console.warn('SettingsManager::set()', 'exception', e, e.stack);
    }

    if ( save ) {
      this.save(pool, save);
    }

    return true;
  };

  /**
   * Saves the storage to a location
   *
   * @param  String     pool      Name of settings pool
   * @param  Function   callback  Callback
   *
   * @return  void
   *
   * @method  SettingsManager::save()
   */
  SettingsManager.save = function(pool, callback) {
    callback = callback || function() {};
    if ( typeof callback !== 'function' ) {
      callback = function() {};
    }

    var handler = OSjs.Core.getHandler();
    handler.saveSettings(pool, this.storage, callback);
  };

  /**
   * Sets the defaults for a spesific pool
   *
   * @param  String     pool      Name of settings pool
   * @param  Object     default   (Optional) Default settings tree
   *
   * @return  void
   *
   * @method SettingsManager::defaults()
   */
  SettingsManager.defaults = function(pool, defaults) {
    this.defaults[pool] = defaults;
  };

  /**
   * Creates a new proxy instance
   *
   * @param  String     pool      Name of settings pool
   * @param  Object     default   (Optional) Default settings tree
   *
   * @return Object
   *
   * @method SettingsManager::instance()
   */
  SettingsManager.instance = function(pool, defaults) {
    if ( arguments.length > 1 ) {
      SettingsManager.defaults(pool, defaults);
    }

    return new OSjs.Helpers.SettingsFragment(this.storage[pool]).mergeDefaults(defaults);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get the current SettingsManager  instance
   *
   * @return SettingsManager
   * @api OSjs.Core.getSettingsManager()
   */
  OSjs.Core.getSettingsManager = function() {
    return SettingsManager;
  };

})(OSjs.Utils, OSjs.VFS, OSjs.API);
