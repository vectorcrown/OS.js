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
(function(API, VFS, Utils, DialogWindow) {
  'use strict';

  /**
   * An 'FileUpload' dialog
   *
   * @example
   *
   * OSjs.API.createDialog('FileUpload', {}, fn);
   *
   * @param  {Object}          args              An object with arguments
   * @param  {String}          args.title        Dialog title
   * @param  {String}          args.dest         VFS destination
   * @param  {OSjs.VFS.File}   [args.file]       File to upload
   * @param  {CallbackDialog}  callback          Callback when done
   *
   * @constructor FileUpload
   * @memberof OSjs.Dialogs
   */
  function FileUploadDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      dest:     API.getDefaultPath(),
      progress: {},
      file:     null
    });

    DialogWindow.apply(this, ['FileUploadDialog', {
      title: args.title || API._('DIALOG_UPLOAD_TITLE'),
      icon: 'actions/document-new.png',
      width: 400,
      height: 100
    }, args, callback]);
  }

  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);
  FileUploadDialog.constructor = DialogWindow;

  FileUploadDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var message = this._find('Message');
    var maxSize = API.getConfig('VFS.MaxUploadSize');

    message.set('value', API._('DIALOG_UPLOAD_DESC', this.args.dest, maxSize), true);

    var input = this._find('File');
    if ( this.args.file ) {
      this.setFile(this.args.file, input);
    } else {
      input.on('change', function(ev) {
        self.setFile(ev.detail, input);
      });
    }

    return root;
  };

  FileUploadDialog.prototype.setFile = function(file, input) {
    var self = this;
    var progressDialog;

    function error(msg, ev) {
      API.error(
        OSjs.API._('DIALOG_UPLOAD_FAILED'),
        OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'),
        msg || OSjs.API._('DIALOG_UPLOAD_FAILED_UNKNOWN')
      );

      progressDialog._close(true);
      self.onClose(ev, 'cancel');
    }

    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }

      if ( input ) {
        input.set('disabled', true);
      }

      this._find('ButtonCancel').set('disabled', true);

      var desc = OSjs.API._('DIALOG_UPLOAD_MSG_FMT', file.name, file.type, fileSize, this.dest);

      progressDialog = API.createDialog('FileProgress', {
        message: desc,
        dest: this.args.dest,
        filename: file.name,
        mime: file.type,
        size: fileSize
      }, function(ev, button) {
        // Dialog closed
      }, this);

      if ( this._wmref ) {
        this._wmref.createNotificationIcon(this.notificationId, {className: 'BusyNotification', tooltip: desc, image: false});
      }

      OSjs.VFS.upload({files: [file], destination: this.args.dest}, function(err, result, ev) {
        if ( err ) {
          error(err, ev);
          return;
        }
        progressDialog._close();
        self.onClose(ev, 'ok', file);
      }, {
        onprogress: function(ev) {
          if ( ev.lengthComputable ) {
            var p = Math.round(ev.loaded * 100 / ev.total);
            progressDialog.setProgress(p);
          }
        }
      });

      setTimeout(function() {
        if ( progressDialog ) {
          progressDialog._focus();
        }
      }, 100);
    }
  };

  FileUploadDialog.prototype.onClose = function(ev, button, result) {
    result = result || null;
    this.closeCallback(ev, button, result);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.FileUpload = Object.seal(FileUploadDialog);

})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);
