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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  var PanelItemButtons = function(settings) {
    PanelItem.apply(this, ['PanelItemButtons PanelItemFill', 'Buttons', settings, {
      buttons: [
        {
          title: API._('LBL_APPLICATIONS'),
          icon: 'osjs-white.png',
          system: 'applications'
        },
        {
          title: API._('LBL_SETTINGS'),
          icon: 'categories/applications-system.png',
          system: 'settings'
        },
        {
          title: API._('DIALOG_LOGOUT_TITLE'),
          icon: 'actions/exit.png',
          system: 'exit'
        }
      ]
    }]);

    this.$container = null;
  };

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.Name = 'Buttons'; // Static name
  PanelItemButtons.Description = 'Button Bar'; // Static description
  PanelItemButtons.Icon = 'actions/stock_about.png'; // Static icon

  PanelItemButtons.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    this.renderButtons();

    /*
    this.addButton(API._('LBL_APPLICATIONS'), 'osjs-white.png', function(ev) {
      ev.stopPropagation();

      OSjs.Applications.CoreWM.showMenu(ev);
      return false;
    });

    this.addButton(API._('LBL_SETTINGS'), 'categories/applications-system.png', function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.showSettings();
      }
      return false;
    });

    this.addButton(API._('DIALOG_LOGOUT_TITLE'), 'actions/exit.png', function(ev) {
      OSjs.Session.signOut();
    });
    */

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    this.$container = null;
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.clearButtons = function() {
    Utils.$empty(this.$container);
  };

  PanelItemButtons.prototype.renderButtons = function() {
    var self = this;
    var systemButtons = {
      applications: function(ev) {
        OSjs.Applications.CoreWM.showMenu(ev);
      },
      settings: function(ev) {
        var wm = OSjs.Core.getWindowManager();
        if ( wm ) {
          wm.showSettings();
        }
      },
      exit: function(ev) {
        OSjs.Session.signOut();
      }
    };

    var systemMenu = [{
      title: 'Remove button', // FIXME: Locale
      disabled: true
    }];
    var normalMenu = [{
      title: 'Remove button',
      onClick: function() {
      }
    }];

    (this._settings.get('buttons') || []).forEach(function(btn) {
      var menu = normalMenu;
      var callback = function() {
        API.launch(btn.launch);
      };

      if ( btn.system ) {
        menu = null; //systemMenu;
        callback = function(ev) {
          ev.stopPropagation();

          systemButtons[btn.system](ev);
        };
      }
      self.addButton(btn.title, btn.icon, menu, callback);
    });
  };

  PanelItemButtons.prototype.addButton = function(title, icon, menu, callback) {
    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + API.getIcon(icon) + '" />';

    Utils.$bind(sel, 'click', callback);
    Utils.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ( menu ) {
        API.createMenu(menu, ev);
      }
    });

    this.$container.appendChild(sel);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Buttons          = PanelItemButtons;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);
