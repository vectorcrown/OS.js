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
(function(StandardDialog) {
  "use strict";

  /**
   * Font Dialog
   */
  var FontDialog = function(args, onClose) {
    args = args || {};
    this.fontName   = args.name       || OSjs.API.getHandlerInstance().getConfig('Fonts')['default'];
    this.fontSize   = args.size       || 12;
    this.background = args.background || '#ffffff';
    this.color      = args.color      || '#000000';
    this.fonts      = args.list       || OSjs.API.getHandlerInstance().getConfig('Fonts').list;
    this.sizeType   = args.sizeType   || 'px';
    this.text       = args.text       || 'The quick brown fox jumps over the lazy dog';

    this.minSize    = typeof args.minSize === 'undefined' ? 6  : args.minSize;
    this.maxSize    = typeof args.maxSize === 'undefined' ? 30 : args.maxSize;

    this.$selectFonts = null;
    this.$selectSize  = null;

    StandardDialog.apply(this, ['FontDialog', {title: OSjs._("Font Dialog")}, {width:450, height:250}, onClose]);
  };

  FontDialog.prototype = Object.create(StandardDialog.prototype);

  FontDialog.prototype.updateFont = function(name, size) {
    var rt = this._getGUIElement('GUIRichText');

    if ( name !== null && name ) {
      this.fontName = name;
    }
    if ( size !== null && size ) {
      this.fontSize = size << 0;
    }

    var styles = [];
    if ( this.sizeType == 'internal' ) {
      styles = [
        'font-family: ' + this.fontName,
        'background: '  + this.background,
        'color: '       + this.color
      ];
      rt.setContent('<font size="' + this.fontSize + '" style="' + styles.join(";") + '">' + this.text + '</font>');
    } else {
      styles = [
        'font-family: ' + this.fontName,
        'font-size: '   + this.fontSize + 'px',
        'background: '  + this.background,
        'color: '       + this.color
      ];
      rt.setContent('<div style="' + styles.join(";") + '">' + this.text + '</div>');
    }
  };

  FontDialog.prototype.init = function() {
    var self = this;
    var root = StandardDialog.prototype.init.apply(this, arguments);
    var option;

    var rt = this._addGUIElement(new OSjs.GUI.RichText('GUIRichText'), this.$element);

    this.$selectFont = document.createElement('select');
    this.$selectFont.className = 'SelectFont';
    this.$selectFont.setAttribute("size", "7");

    for ( var f = 0; f < this.fonts.length; f++ ) {
      option            = document.createElement('option');
      option.value      = f;
      option.appendChild(document.createTextNode(this.fonts[f]));
      this.$selectFont.appendChild(option);
      if ( this.fontName.toLowerCase() == this.fonts[f].toLowerCase() ) {
        this.$selectFont.selectedIndex = f;
      }
    }

    this._addEvent(this.$selectFont, 'onchange', function(ev) {
      var i = this.selectedIndex;
      if ( self.fonts[i] ) {
        self.updateFont(self.fonts[i], null);
      }
    });

    this.$element.appendChild(this.$selectFont);

    if ( this.maxSize > 0 ) {
      this.$selectSize = document.createElement('select');
      this.$selectSize.className = 'SelectSize';
      this.$selectSize.setAttribute("size", "7");

      var i = 0;
      for ( var s = this.minSize; s <= this.maxSize; s++ ) {
        option            = document.createElement('option');
        option.value      = s;
        option.innerHTML  = s;
        this.$selectSize.appendChild(option);
        if ( this.fontSize == s ) {
          this.$selectSize.selectedIndex = i;
        }
        i++;
      }

      this._addEvent(this.$selectSize, 'onchange', function(ev) {
        var i = this.selectedIndex;
        var o = this.options[i];
        if ( o ) {
          self.updateFont(null, o.value);
        }
      });

      this.$element.appendChild(this.$selectSize);
    } else {
      this.$element.className += ' NoFontSizes';
    }

    return root;
  };

  FontDialog.prototype._inited = function() {
    StandardDialog.prototype._inited.apply(this, arguments);
    this.updateFont();
  };

  FontDialog.prototype.onConfirmClick = function(ev) {
    if ( !this.buttonConfirm ) { return; }
    this.end('ok', this.fontName, this.fontSize);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.Font               = FontDialog;

})(OSjs.Dialogs.StandardDialog);
