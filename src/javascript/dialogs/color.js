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
(function(API, Utils, _StandardDialog) {
  'use strict';

  /**
   * Color Dialog
   *
   * @param   Object          opts    Options
   * @param   Function        onClose Callback on close => fn(button, rgb, hex, alpha)
   *
   * @api OSjs.Dialogs.Color
   * @see OSjs.Dialogs._StandardDialog
   *
   * @extends _StandardDialog
   * @class
   */
  var ColorDialog = function(opts, onClose) {
    opts = opts || {};
    if ( typeof opts.alpha === 'undefined' ) {
      opts.alpha = 1.0;
    }

    _StandardDialog.apply(this, ['ColorDialog', {
      title: API._('DIALOG_COLOR_TITLE'),
      icon: 'apps/gnome-settings-theme.png',
      buttons: ['cancel', 'ok']
    }, {width:450, height:250}, onClose]);

    if ( typeof opts.color === 'object' ) {
      this.currentRGB = opts.color;
    } else {
      this.currentRGB = Utils.convertToRGB(opts.color || '#ffffff');
    }
    this.showAlpha    = opts.showAlpha ? true : false;
    this.currentAlpha = opts.alpha * 100;
    this.$color       = null;
  };

  ColorDialog.prototype = Object.create(_StandardDialog.prototype);

  ColorDialog.prototype.init = function() {
    var self  = this;
    var root  = _StandardDialog.prototype.init.apply(this, arguments);
    var color = this.currentRGB;

    var el        = document.createElement('div');
    el.className  = 'ColorDialog';

    var sliders       = document.createElement('div');
    sliders.className = 'ColorSliders';

    var label       = document.createElement('div');
    label.className = 'Label LabelR';
    label.innerHTML = API._('DIALOG_COLOR_R', 0);
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderR', {min: 0, max: 255, val: color.r, onUpdate: function(value, percentage) {
      self.setColor(value, self.currentRGB.g, self.currentRGB.b, null, true);
    }}), sliders);

    label           = document.createElement('div');
    label.className = 'Label LabelG';
    label.innerHTML = API._('DIALOG_COLOR_G', 0);
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderG', {min: 0, max: 255, val: color.g, onUpdate: function(value, percentage) {
      self.setColor(self.currentRGB.r, value, self.currentRGB.b, null, true);
    }}), sliders);

    label           = document.createElement('div');
    label.className = 'Label LabelB';
    label.innerHTML = API._('DIALOG_COLOR_B', 0);
    sliders.appendChild(label);
    this._addGUIElement(new OSjs.GUI.Slider('SliderB', {min: 0, max: 255, val: color.b, onUpdate: function(value, percentage) {
      self.setColor(self.currentRGB.r, self.currentRGB.g, value, null, true);
    }}), sliders);

    if ( this.showAlpha ) {
      label           = document.createElement('div');
      label.className = 'Label LabelA';
      label.innerHTML = API._('DIALOG_COLOR_A', 0);
      sliders.appendChild(label);
      this._addGUIElement(new OSjs.GUI.Slider('SliderA', {min: 0, max: 100, val: this.currentAlpha, onUpdate: function(value, percentage) {
        self.setColor(self.currentRGB.r, self.currentRGB.g, self.currentRGB.b, value, true);
      }}), sliders);
    }

    this.$color           = document.createElement('div');
    this.$color.className = 'ColorSelected';

    this._addGUIElement(new OSjs.GUI.ColorSwatch('ColorDialogColorSwatch', {width: 200, height: 200, onSelect: function(r, g, b) {
      self.setColor(r, g, b);
    }}), this.$element);

    this.$element.appendChild(sliders);
    this.$element.appendChild(this.$color);

  };
  ColorDialog.prototype._inited = function() {
    if ( !this._rendered ) {
      var rgb = this.currentRGB;
      this.setColor(rgb.r, rgb.g, rgb.b, this.currentAlpha, false);
    }

    _StandardDialog.prototype._inited.apply(this, arguments);
  };

  ColorDialog.prototype.setColor = function(r, g, b, a, fromElement) {
    this.currentAlpha = (typeof a === 'undefined' ? this.currentAlpha : a);
    this.currentRGB   = {r:r, g:g, b:b};

    this.$color.style.background = 'rgb(' + ([r, g, b]).join(',') + ')';

    if ( !fromElement ) {
      this._getGUIElement('SliderR').setValue(r);
      this._getGUIElement('SliderG').setValue(g);
      this._getGUIElement('SliderB').setValue(b);
    }

    this.$element.getElementsByClassName('LabelR')[0].innerHTML = API._('DIALOG_COLOR_R', r);
    this.$element.getElementsByClassName('LabelG')[0].innerHTML = API._('DIALOG_COLOR_G', g);
    this.$element.getElementsByClassName('LabelB')[0].innerHTML = API._('DIALOG_COLOR_B', b);

    if ( this.showAlpha ) {
      var ca = (this.currentAlpha/100);
      if ( !fromElement ) {
        this._getGUIElement('SliderA').setValue(this.currentAlpha);
      }
      this.$element.getElementsByClassName('LabelA')[0].innerHTML = API._('DIALOG_COLOR_A', ca);
    }

  };

  ColorDialog.prototype.onButtonClick = function(btn, ev) {
    if ( this.buttons[btn] ) {
      if ( btn === 'cancel' ) {
        this.end('cancel', null, null);
      } else if ( btn === 'ok' ) {
        this.end('ok', this.currentRGB, Utils.convertToHEX(this.currentRGB), (this.currentAlpha/100));
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.Color              = ColorDialog;

})(OSjs.API, OSjs.Utils, OSjs.Dialogs._StandardDialog);
