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
   * An 'Font Selection' dialog
   *
   * @example
   *
   * OSjs.API.createDialog('Font', {}, fn);
   *
   * @param  {Object}          args                                An object with arguments
   * @param  {String}          args.title                          Dialog title
   * @param  {String}          [args.fontName=internal]            Current font name
   * @param  {Number}          [args.fontSize=12]                  Current font size
   * @param  {String}          [args.fontColor=#00000]             Font color
   * @param  {String}          [args.backgroundColor=#ffffff]      Background color
   * @param  {Array}           [args.fonts]                        Default font list
   * @param  {Number}          [args.minSize=6]                    Minimun size
   * @param  {Number}          [args.maxSize=30]                   Maximum size
   * @param  {String}          [args.text]                         Preview text
   * @param  {String}          [args.unit=px]                      Size unit
   * @param  {CallbackDialog}  callback                            Callback when done
   *
   * @constructor Font
   * @memberof OSjs.Dialogs
   */
  function FontDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      fontName: API.getConfig('Fonts.default'),
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      fonts: API.getConfig('Fonts.list'),
      minSize: 6,
      maxSize: 30,
      text: 'The quick brown fox jumps over the lazy dog',
      unit: 'px'
    });

    if ( args.unit === 'null' || args.unit === 'unit' ) {
      args.unit = '';
    }

    DialogWindow.apply(this, ['FontDialog', {
      title: args.title || API._('DIALOG_FONT_TITLE'),
      width: 400,
      height: 300
    }, args, callback]);

    this.selection = {
      fontName: args.fontName,
      fontSize: args.fontSize + args.unit
    };
  }

  FontDialog.prototype = Object.create(DialogWindow.prototype);
  FontDialog.constructor = DialogWindow;

  FontDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var preview = this._find('FontPreview');
    var sizes = [];
    var fonts = [];

    for ( var i = this.args.minSize; i < this.args.maxSize; i++ ) {
      sizes.push({value: i, label: i});
    }
    for ( var j = 0; j < this.args.fonts.length; j++ ) {
      fonts.push({value: this.args.fonts[j], label: this.args.fonts[j]});
    }

    function updatePreview() {
      preview.querySelector('textarea').style.fontFamily = self.selection.fontName;
      preview.querySelector('textarea').style.fontSize = self.selection.fontSize;
    }

    var listFonts = this._find('FontName');
    listFonts.add(fonts).set('value', this.args.fontName);
    listFonts.on('change', function(ev) {
      self.selection.fontName = ev.detail;
      updatePreview();
    });

    var listSizes = this._find('FontSize');
    listSizes.add(sizes).set('value', this.args.fontSize);
    listSizes.on('change', function(ev) {
      self.selection.fontSize = ev.detail + self.args.unit;
      updatePreview();
    });

    preview.$element.style.color = this.args.fontColor;
    preview.$element.style.backgroundColor = this.args.backgroundColor;
    preview.set('value', this.args.text);

    if ( this.args.fontSize < 0 ) {
      this._find('FontSizeContainer').hide();
    }

    updatePreview();

    return root;
  };

  FontDialog.prototype.onClose = function(ev, button) {
    var result = button === 'ok' ? this.selection : null;
    this.closeCallback(ev, button, result);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.Font = Object.seal(FontDialog);

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
