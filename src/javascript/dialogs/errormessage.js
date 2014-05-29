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
(function(DialogWindow) {

  /**
   * ErrorDialog implementation
   */
  var ErrorDialog = function() {
    this.data = {title: 'No title', message: 'No message', error: ''};

    DialogWindow.apply(this, ['ErrorDialog', {width:400, height:290}]);
    this._icon = 'status/dialog-error.png';
    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;
  };

  ErrorDialog.prototype = Object.create(DialogWindow.prototype);

  ErrorDialog.prototype.init = function(wmRef) {
    var bugData = this.data;
    var self = this;
    this._title = this.data.title;

    var label;

    var root        = DialogWindow.prototype.init.apply(this, arguments);
    root.className += ' ErrorDialog';

    var messagel        = document.createElement('div');
    messagel.className  = OSjs._('Message');
    messagel.innerHTML  = this.data.message;
    root.appendChild(messagel);

    label           = document.createElement('div');
    label.className = 'Label';
    label.innerHTML = OSjs._('Summary');
    root.appendChild(label);

    var messaged = this._addGUIElement(new OSjs.GUI.Textarea('Summary'), root);
    messaged.setValue(this.data.error);

    var exception = this.data.exception;
    if ( exception ) {
      root.className += ' WithTrace';
      var error = '';
      if ( exception.stack ) {
        error = exception.stack;
      } else {
        error = exception.name;
        error += "\nFilename: " + exception.fileName || '<unknown>';
        error += "\nLine: " + exception.lineNumber;
        error += "\nMessage: " + exception.message;
        if ( exception.extMessage ) {
          error += "\n" + exception.extMessage;
        }
      }

      bugData.exceptionDetail = '' + error;

      label           = document.createElement('div');
      label.className = 'Label';
      label.innerHTML = OSjs._('Trace');
      root.appendChild(label);

      var traced = this._addGUIElement(new OSjs.GUI.Textarea('Trace'), root);
      traced.setValue(error);
    }

    var ok = this._addGUIElement(new OSjs.GUI.Button('OK', {label: OSjs._('Close'), onClick: function() {
      self._close();
    }}), root);

    if ( this.data.bugreport ) {
      var _onBugError = function(error) {
        self._error(self._title, "Bugreport error", error, null, false);
      };
      var _onBugSuccess = function() {
        var wm = OSjs.API.getWMInstance();
        if ( wm ) {
          wm.addWindow(new OSjs.Dialogs.Alert("The error was reported and will be looked into"));
        }

        ok.onClick();
      };

      var sendBug = this._addGUIElement(new OSjs.GUI.Button('Bug', {label: OSjs._('Bugreport'), onClick: function() {
        OSjs.API.call('bugreport', {data: bugData}, function(res) {
          if ( res ) {
            if ( res.result ) {
              _onBugSuccess();
              return;
            } else if ( res.error ) {
              _onBugError(res.error);
              return;
            }
          }
          _onBugError("Something went wrong during reporting. You can mail it to andersevenrud@gmail.com");
        }, function(error) {
          _onBugError(error);
        });
      }}), root);
    }
  };

  ErrorDialog.prototype.setError = function(title, message, error, exception, bugreport) {
    this.data = {title: title, message: message, error: error, exception: exception, bugreport: bugreport};
  };

  ErrorDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === OSjs.Utils.Keys.ESC ) {
      this._close();
    }
  };


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.ErrorMessage       = ErrorDialog;

})(OSjs.Core.DialogWindow);
