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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Main Window Constructor
   */
  function ApplicationnguiWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationnguiWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 700,
      height: 600
    }, app, scheme]);
  }

  ApplicationnguiWindow.prototype = Object.create(Window.prototype);

  ApplicationnguiWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);

    scheme.renderWindow(this, 'MyWindowID', root);

    scheme.getElement(this, 'MyButtonOne').on('click', function() {
      alert("You clicked me");
    });

    scheme.getElement(this, 'MyIconView').on('select', function(ev) {
      console.warn('iconview', ev);
    });

    scheme.getElement(this, 'MyTabs').on('change', function(ev) {
      console.warn('tab', ev);
    });

    scheme.getElement(this, 'MyMenuBar').on('select', function(ev) {
      console.warn('menubar', ev);
    });

    scheme.getElement(this, 'MySubMenu').on('select', function(ev) {
      console.warn('menubar submenu', ev);
    });

    scheme.getElement(this, 'MyColor').on('change', function(ev) {
      console.warn('color', ev);
    });

    scheme.getElement(this, 'MyText').on('change', function(ev) {
      console.warn('text change', ev);
    });
    scheme.getElement(this, 'MyText').on('enter', function(ev) {
      console.warn('enter', ev, this.get('value'));
    });

    return root;
  };

  ApplicationnguiWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application constructor
   */
  var Applicationngui = function(args, metadata) {
    Application.apply(this, ['Applicationngui', args, metadata]);
  };

  Applicationngui.prototype = Object.create(Application.prototype);

  Applicationngui.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  Applicationngui.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var scheme = new OSjs.GUING.Scheme(this);
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationnguiWindow(self, metadata, scheme));
    });

  };

  Applicationngui.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);
    if ( msg == 'destroyWindow' && obj._name === 'ApplicationnguiWindow' ) {
      this.destroy();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.Applicationngui = OSjs.Applications.Applicationngui || {};
  OSjs.Applications.Applicationngui.Class = Applicationngui;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
