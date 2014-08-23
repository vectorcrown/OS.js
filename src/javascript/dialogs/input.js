/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2014, Anders Evenrud <andersevenrud@gmail.com>
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
(function(StandardDialog) {
  'use strict';

  /**
   * Input Dialog
   */
  var InputDialog = function(msg, val, onClose) {
    StandardDialog.apply(this, ['InputDialog', {title: OSjs._('Input Dialog'), message: msg}, {width:300, height:150}, onClose]);
    this._icon = 'status/dialog-information.png';

    this.value = val || '';
    this.input = null;
  };

  InputDialog.prototype = Object.create(StandardDialog.prototype);

  InputDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);

    var inputd = document.createElement('div');

    this.input = this._addGUIElement(new OSjs.GUI.Text('TextInput', {value: this.value, onKeyPress: function(ev) {
      if ( ev.keyCode === OSjs.Utils.Keys.ENTER ) {
        self.buttonConfirm.onClick(ev);
        return;
      }
    }}), inputd);
    this.$element.appendChild(inputd);
    return root;
  };

  InputDialog.prototype._focus = function() {
    StandardDialog.prototype._focus.apply(this, arguments);
    if ( this.input ) {
      this.input.focus();
      this.input.select();
    }
  };

  InputDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
    this.end('ok', this.input.getValue());
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.Input              = InputDialog;

})(OSjs.Dialogs.StandardDialog);
