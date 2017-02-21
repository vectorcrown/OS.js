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
   * An 'Application Chooser' dialog
   *
   * @example
   *
   * OSjs.API.createDialog('ApplicationChooser', {}, fn);
   *
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {String}          args.message      Dialog message
   * @param  {OSjs.VFS.File}   args.file         The file to open
   * @param  {CallbackDialog}  callback          Callback when done
   *
   * @constructor ApplicationChooser
   * @memberof OSjs.Dialogs
   */
  function ApplicationChooserDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});

    DialogWindow.apply(this, ['ApplicationChooserDialog', {
      title: args.title || API._('DIALOG_APPCHOOSER_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
  }

  ApplicationChooserDialog.prototype = Object.create(DialogWindow.prototype);
  ApplicationChooserDialog.constructor = DialogWindow;

  ApplicationChooserDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var cols = [{label: API._('LBL_NAME')}];
    var rows = [];
    var metadata = OSjs.Core.getPackageManager().getPackages();

    (this.args.list || []).forEach(function(name) {
      var iter = metadata[name];

      if ( iter && iter.type === 'application' ) {
        var label = [iter.name];
        if ( iter.description ) {
          label.push(iter.description);
        }
        rows.push({
          value: iter,
          columns: [
            {label: label.join(' - '), icon: API.getIcon(iter.icon, null, name), value: JSON.stringify(iter)}
          ]
        });
      }
    });

    this._find('ApplicationList').set('columns', cols).add(rows).on('activate', function(ev) {
      self.onClose(ev, 'ok');
    });

    var file = '<unknown file>';
    var label = '<unknown mime>';
    if ( this.args.file ) {
      file = Utils.format('{0} ({1})', this.args.file.filename, this.args.file.mime);
      label = API._('DIALOG_APPCHOOSER_SET_DEFAULT', this.args.file.mime);
    }

    this._find('FileName').set('value', file);
    this._find('SetDefault').set('label', label);

    return root;
  };

  ApplicationChooserDialog.prototype.onClose = function(ev, button) {
    var result = null;

    if ( button === 'ok' ) {
      var useDefault = this._find('SetDefault').get('value');
      var selected = this._find('ApplicationList').get('value');
      if ( selected && selected.length ) {
        result = selected[0].data.className;
      }

      if ( !result ) {
        OSjs.API.createDialog('Alert', {
          message: API._('DIALOG_APPCHOOSER_NO_SELECTION')
        }, null, this);

        return;
      }
      result = {
        name: result,
        useDefault: useDefault
      };
    }

    this.closeCallback(ev, button, result);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.ApplicationChooser = Object.seal(ApplicationChooserDialog);

})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);
