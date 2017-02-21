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
(function(API, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'Confirm' dialog
   *
   * @example
   *
   * OSjs.API.createDialog('Confirm', {}, fn);
   *
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {String}          args.message      Dialog message
   * @param  {Array}           args.buttons      Dialog buttons (default=yes,no,cancel)
   * @param  {CallbackDialog}  callback          Callback when done
   *
   * @constructor Confirm
   * @memberof OSjs.Dialogs
   */
  function ConfirmDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      buttons: ['yes', 'no', 'cancel']
    });

    DialogWindow.apply(this, ['ConfirmDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-question.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.constructor = DialogWindow;

  ConfirmDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var msg = DialogWindow.parseMessage(this.args.message);
    this._find('Message').empty().append(msg);

    var buttonMap = {
      yes: 'ButtonYes',
      no: 'ButtonNo',
      cancel: 'ButtonCancel'
    };

    var hide = [];
    (['yes', 'no', 'cancel']).forEach(function(b) {
      if ( self.args.buttons.indexOf(b) < 0 ) {
        hide.push(b);
      }
    });

    hide.forEach(function(b) {
      self._find(buttonMap[b]).hide();
    });

    return root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.Confirm = Object.seal(ConfirmDialog);

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
