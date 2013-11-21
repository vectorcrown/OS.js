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
(function(DialogWindow, GUI) {
  window.OSjs = window.OSjs || {};
  OSjs.Dialogs = OSjs.Dialogs || {};

  // TODO: Color Dialog
  // TODO: Font Dialog
  // FIXME: Clean up dialogs
  // FIXME: Merge common dialog stuff into CommonDialog and inherit

  /**
   * ErrorMessageBox implementation
   */
  var ErrorMessageBox = function() {
    this.data = {title: 'No title', message: 'No message', error: ''};

    DialogWindow.apply(this, ['ErrorMessageBox', {width:400, height:200}]);
  };

  ErrorMessageBox.prototype = Object.create(DialogWindow.prototype);

  ErrorMessageBox.prototype.init = function() {
    this._title = this.data.title;

    DialogWindow.prototype.init.apply(this, arguments);

    var messagel = document.createElement('div');
    messagel.className = 'message';
    messagel.innerHTML = this.data.message;
    this._$root.appendChild(messagel);

    var messaged = document.createElement('div');
    messaged.className = 'summary';
    messaged.innerHTML = this.data.error;
    this._$root.appendChild(messaged);

    var ok = document.createElement('button');
    ok.innerHTML = 'Close';

    var self = this;
    ok.onclick = function() {
      self._close();
    };

    this._$root.appendChild(ok);
  };

  ErrorMessageBox.prototype.setError = function(title, message, error) {
    this.data = {title: title, message: message, error: error};
  };

  /**
   * File Progress dialog
   */
  var FileProgressDialog = function() {
    DialogWindow.apply(this, ['FileUploadDialog', {width:400, height:120}]);

    this.$desc = null;
    this.$barContainer = null;
    this.$barInner = null;
    this._title = "Upload Progress";
    this._properties.allow_close = false;
  };

  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);

  FileProgressDialog.prototype.destroy = function() {
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileProgressDialog.prototype.init = function() {
    DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var root = this._$root;

    var el = document.createElement('div');
    el.className = 'FileProgressDialog';

    var desc = document.createElement('div');
    desc.className = 'Description';
    desc.innerHTML = 'Loading...';

    var outer = document.createElement('div');
    outer.className = 'BarContainer';

    var inner = document.createElement('div');
    inner.className = 'Bar';

    outer.appendChild(inner);
    el.appendChild(desc);
    el.appendChild(outer);
    root.appendChild(el);

    this.$desc = desc;
    this.$barContainer = outer;
    this.$bar = inner;
  };

  FileProgressDialog.prototype.setDescription = function(d) {
    if ( !this.$desc ) return;
    this.$desc.innerHTML = d;
  };

  FileProgressDialog.prototype.setProgress = function(p) {
    if ( !this.$barContainer ) return;
    this.$bar.innerHTML = p + "%";
    this.$bar.style.width = p + "%";
  };

  /**
   * File Upload Dialog
   */
  var FileUploadDialog = function(dest, file, onDone) {
    DialogWindow.apply(this, ['FileUploadDialog', {width:400, height:120}]);

    this.dest   = dest;
    this.dialog = null;
    this.button = null;
    this.file   = file || null;
    this.onDone = onDone || function() { };
    this._wmref = null;
    this._title = "Upload File";
  };

  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);

  FileUploadDialog.prototype.init = function(wm) {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    this._wmref = wm;

    var self = this;

    var el = document.createElement('div');
    el.className = 'FileUploadDialog';

    var desc = document.createElement('div');
    desc.className = 'Description';
    desc.innerHTML = 'Upload file to <span>' + this.dest + '</span>';

    var file = document.createElement('input');
    file.type = 'file';
    file.name = 'upload';
    file.onchange = function(ev) {
      self.onFileSelected(ev, file.files[0]);
    };
    root.appendChild(file);

    var ok = document.createElement('button');
    ok.innerHTML = 'Close';
    ok.className = "OK";
    ok.onclick = function() {
      if ( this.getAttribute("disabled") == "disabled" ) return;
      self._close();
    };

    el.appendChild(desc);
    el.appendChild(file);
    el.appendChild(ok);
    root.appendChild(el);

    this.button = ok;

    if ( this.file ) {
      this.onFileSelected(null, this.file);
    }
  };

  FileUploadDialog.prototype.destroy = function() {
    this.onDone.call(this, 'close');

    this._wmref = null;
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }

    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileUploadDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.onDone.call(this, 'escape', ev);

      if ( this.dialog ) {
        this.dialog._close();
        this.dialog = null;
      }
      this._close();
    }
  };

  FileUploadDialog.prototype._close = function(ev) {
    if ( this.button && (this.button.disabled === "disabled") ) {
      return;
    }
    return DialogWindow.prototype._close.apply(this, arguments);
  };

  FileUploadDialog.prototype.upload = function(file, size) {
    var self = this;

    this.button.disabled = "disabled";

    this.dialog = this._wmref.addWindow(new FileProgressDialog());
    this.dialog.setDescription("Uploading '" + file.name + "' (" + file.type + " " + size + ") to " + this.dest);
    this.dialog.setProgress(0);
    //this._addChild(this.dialog); // Importante!

    var xhr = new XMLHttpRequest();
    var fd  = new FormData();
    fd.append("upload", 1);
    fd.append("path",   this.dest);
    fd.append("upload", file);

    xhr.upload.addEventListener("progress", function(evt) { self.onUploadProgress(evt); }, false);
    xhr.addEventListener("load", function(evt) { self.onUploadComplete(evt); }, false);
    xhr.addEventListener("error", function(evt) { self.onUploadFailed(evt); }, false);
    xhr.addEventListener("abort", function(evt) { self.onUploadCanceled(evt); }, false);
    xhr.open("POST", OSjs.API.getFilesystemURL());
    xhr.send(fd);
  };

  FileUploadDialog.prototype.onFileSelected = function(evt, file) {
    console.log("FileUploadDialog::onFileSelected()", evt, file);
    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }

      this.upload(file, fileSize);
    }
  };

  FileUploadDialog.prototype.onUploadProgress = function(evt) {
    if ( evt.lengthComputable ) {
      var p = Math.round(evt.loaded * 100 / evt.total);
      if ( this.dialog ) {
        this.dialog.setProgress(p);
      }
    }
  };

  FileUploadDialog.prototype.onUploadComplete = function(evt) {
    console.log("FileUploadDialog::onUploadComplete()");
    this.onDone.call(this, 'complete', evt);
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }
    this._close();
  };

  FileUploadDialog.prototype.onUploadFailed = function(evt) {
    console.log("FileUploadDialog::onUploadFailed()");
    OSjs.API.error("Upload failed", "The upload has failed", "Reason unknown...");
    this.onDone.call(this, 'fail', evt);
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }
    this._close();
  };

  FileUploadDialog.prototype.onUploadCanceled = function(evt) {
    console.log("FileUploadDialog::onUploadCanceled()");
    OSjs.API.error("Upload failed", "The upload has failed", "Cancelled by user...");
    this.onDone.call(this, 'cancel', evt);
    if ( this.dialog ) {
      this.dialog._close();
      this.dialog = null;
    }
    this._close();
  };

  /**
   * File Dialog Class
   */
  var FileDialog = function(args, onClose, onCancel) {
    args = args || {};
    DialogWindow.apply(this, ['FileDialog', {width:400, height:300}]);

    this.onCancel         = onCancel || function() {};
    this.onOK             = onClose || function() {};
    this.currentPath      = args.path || OSjs.API.getDefaultPath('/');
    this.currentFilename  = args.filename || '';
    this.type             = args.type || 'open';
    this.mime             = args.mime || null;
    this.$input           = null;
    this._title           = this.type == "save" ? "Save" : "Open";

    this.fileList = new OSjs.GUI.FileView();
  };

  FileDialog.prototype = Object.create(DialogWindow.prototype);

  FileDialog.prototype.destroy = function() {
    if ( this.fileList ) {
      this.fileList.destroy();
      this.fileList = null;
    }
    DialogWindow.prototype.destroy.apply(this, arguments);
  };

  FileDialog.prototype.init = function() {
    DialogWindow.prototype.init.apply(this, arguments);

    var self = this;
    var root = this._$root;

    var el = document.createElement('div');
    el.className = 'FileDialog';

    var buttonOK = document.createElement('button');
    buttonOK.className = 'OK';
    buttonOK.innerHTML = 'OK';
    buttonOK.onclick = function() {
      self.dialogOK();
    };

    var buttonCancel = document.createElement('button');
    buttonCancel.className = 'Cancel';
    buttonCancel.innerHTML = 'Cancel';
    buttonCancel.onclick = function() {
      self.onCancel.call(self);
      self._close();
    };

    el.appendChild(this.fileList.getRoot());

    if ( this.type === 'save' ) {
      var input = document.createElement('input');
      var start = true;
      var curval = this.currentFilename ? this.currentFilename : '';

      el.className += ' FileSaveDialog';
      el.value = curval;

      this.fileList.onSelected = function(item) {
        if ( !item || item.type == 'dir' ) {
          input.value = '';
        } else {
          input.value = item.filename;
        }
      };

      this.fileList.onFinished = function() {
        if ( start ) {
          if ( self.currentFilename ) {
            self.fileList.setSelected(self.currentFilename, 'filename');
          }
        }
        start = false;
      };

      this.fileList.onRefresh = function() {
        if ( start ) {
          input.value = curval;
        } else {
          input.value = '';
        }
      };

      el.appendChild(input);
      this.$input = input;
    } else {
      el.className += ' FileOpenDialog';
    }

    el.appendChild(buttonOK);
    el.appendChild(buttonCancel);
    root.appendChild(el);

    this.fileList.chdir(this.currentPath);

    this.fileList.onActivated = function(path, type, mime) {
      if ( type === 'file' ) {
        if ( self.type === 'save' ) {
          if ( confirm("Are you sure you want to overwrite the file '" + OSjs.Utils.filename(path) + "'?") ) {
            self.dialogOK(path, mime);
          }
        } else {
          self.dialogOK(path, mime);
        }
      }
    };
  };

  FileDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.onCancel.call(this);
      this._close();
    }
  };

  FileDialog.prototype.dialogOK = function(forcepath, forcemime) {
    var curr;
    var mime = null;
    var item;

    if ( forcepath ) {
      curr = forcepath;
      mime = forcemime;
    } else {
      if ( this.type == 'save' ) {
        var check = this.$input ? check = this.$input.value : '';
        if ( check ) {
          item = this.fileList.getItemByKey('filename', check);
          if ( item !== null ) {
            if ( confirm("The file '" + check + "' already exists. Overwrite?") ) {
              mime = item.getAttribute('data-mime');
              curr = item.getAttribute('data-path');
            } else {
              return;
            }
          }
        }

        if ( !mime && check ) mime = this.mime;
        if ( !curr && check ) curr = this.fileList.getPath() + '/' + check
      } else {
        item = this.fileList.getSelected();
        if ( item !== null ) {
          mime = item.mime;
          curr = item.path;
        }
      }
    }

    if ( curr ) {
      this.onOK.call(this, curr, mime);

      this._close();
    } else {
      if ( this.type === 'save' ) {
        alert('You need to select a file or enter new filename!'); // FIXME
      } else {
        alert('You need to select a file!'); // FIXME
      }
    }
  };

  /**
   * Alert/Message Dialog
   */
  var AlertDialog = function(msg, onClose) {
    DialogWindow.apply(this, ['AlertDialog', {width:250, height:100}]);
    this.onClose = onClose || function() {};
    this.message = msg || 'undefined';
    this._title = "Alert Dialog";
  };
  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var el = document.createElement('div');
    el.className = 'AlertDialog';

    var messaged = document.createElement('div');
    messaged.innerHTML = this.message;

    var ok = document.createElement('button');
    ok.innerHTML = 'Close';
    ok.className = 'OK';

    var self = this;
    ok.onclick = function() {
      self.onClose.call(self, 'close');
      self._close();
    };

    el.appendChild(messaged);
    el.appendChild(ok);
    root.appendChild(el);
  };

  AlertDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.onClose.call(this, 'escape');
      this._close();
    }
  };

  /**
   * Confirmation Dialog
   */
  var ConfirmDialog = function(msg, onClose) {
    DialogWindow.apply(this, ['ConfirmDialog', {width:250, height:120}]);
    this.onClose = onClose || function() {};
    this.message = msg || 'undefined';
    this._title = "Confirm Dialog";
  };
  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var el = document.createElement('div');
    el.className = 'ConfirmDialog';

    var messaged = document.createElement('div');
    messaged.innerHTML = this.message;

    var cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.className = 'Cancel';
    cancel.onclick = function() {
      self.onClose('cancel');
      self._close();
    };

    var ok = document.createElement('button');
    ok.className = 'OK';
    ok.innerHTML = 'OK';
    ok.onclick = function() {
      self.onClose('ok');
      self._close();
    };

    el.appendChild(messaged);
    el.appendChild(cancel);
    el.appendChild(ok);
    root.appendChild(el);
  };

  ConfirmDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.onClose('escape');
      this._close();
    }
  };

  /**
   * Input Dialog
   */
  var InputDialog = function(msg, val, onClose) {
    DialogWindow.apply(this, ['InputDialog', {width:300, height:150}]);
    this.message = msg || 'undefined';
    this.value = val || '';
    this.opened = false;
    this.onClose = onClose || function() {};
    this.$input = null;
    this._title = "Input Dialog";
  };
  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var el = document.createElement('div');
    el.className = 'InputDialog';

    var messaged = document.createElement('div');
    messaged.innerHTML = this.message;

    var cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.className = 'Cancel';
    cancel.onclick = function() {
      self.onClose('cancel', null); //input.value);
      self._close();
    };

    var ok = document.createElement('button');
    ok.className = 'OK';
    ok.innerHTML = 'OK';
    ok.onclick = function() {
      self.onClose('ok', input.value);
      self._close();
    };

    var inputd = document.createElement('div');
    var input = document.createElement('input');

    input.type = "text";
    input.value = this.value;
    input.onkeypress = function(ev) {
      if ( ev.keyCode === 13 ) {
        ok.onclick(ev);
        return;
      }
    };

    inputd.appendChild(input);

    el.appendChild(messaged);
    el.appendChild(inputd);
    el.appendChild(cancel);
    el.appendChild(ok);
    root.appendChild(el);

    this.$input = input;
  };

  InputDialog.prototype._focus = function() {
    DialogWindow.prototype._focus.apply(this, arguments);
    if ( this.$input ) {
      this.$input.focus();
      this.$input.select();
    }
  };

  InputDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.onClose('escape', null);
      this._close();
    }
  };

  /**
   * Color Dialog
   */
  var ColorDialog = function(color, onClose) {
    DialogWindow.apply(this, ['ColorDialog', {width:450, height:270}]);
    this.onClose = onClose || function() {};
    this._title = "Color Dialog";

    if ( typeof color === 'object' ) {
      this.currentRGB = color;
    } else {
      this.currentRGB = OSjs.Utils.hexToRGB(color || '#ffffff');
    }
    this.$color = null;

    var self = this;
    this.swatch = new OSjs.GUI.ColorSwatch(200, 200, function(r, g, b) {
      self.setColor(r, g, b);
    });
  };

  ColorDialog.prototype = Object.create(DialogWindow.prototype);

  ColorDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);

    var el = document.createElement('div');
    el.className = 'ColorDialog';

    var sliders = document.createElement('div');
    sliders.className = 'ColorSliders';
    sliders.innerHTML = 'TODO: Sliders'; // TODO

    var selected = document.createElement('div');
    selected.className = 'ColorSelected';

    var cancel = document.createElement('button');
    cancel.innerHTML = 'Cancel';
    cancel.className = 'Cancel';
    cancel.onclick = function() {
      self.onClose('cancel');
      self._close();
    };

    var ok = document.createElement('button');
    ok.className = 'OK';
    ok.innerHTML = 'OK';
    ok.onclick = function() {
      self.onClose('ok', self.currentRGB, OSjs.Utils.RGBtoHex(self.currentRGB));
      self._close();
    };

    el.appendChild(this.swatch.$element);
    el.appendChild(sliders);
    el.appendChild(selected);
    el.appendChild(cancel);
    el.appendChild(ok);
    root.appendChild(el);

    this.$color = selected;

    var rgb = this.currentRGB;
    this.setColor(rgb.r, rgb.g, rgb.b);
  };

  ColorDialog.prototype.setColor = function(r, g, b) {
    this.currentRGB = {r:r, g:g, b:b};
    this.$color.style.background = 'rgb(' + ([r, g, b]).join(',') + ')';
  };

  ColorDialog.prototype._onKeyEvent = function(ev) {
    DialogWindow.prototype._onKeyEvent(this, arguments);
    if ( ev.keyCode === 27 ) {
      this.onClose('escape', null, null);
      this._close();
    }
  };

  //
  // EXPORTS
  //
  OSjs.Dialogs.File           = FileDialog;
  OSjs.Dialogs.FileProgress   = FileProgressDialog;
  OSjs.Dialogs.FileUpload     = FileUploadDialog;
  OSjs.Dialogs.ErrorMessage   = ErrorMessageBox;
  OSjs.Dialogs.Alert          = AlertDialog;
  OSjs.Dialogs.Confirm        = ConfirmDialog;
  OSjs.Dialogs.Input          = InputDialog;
  OSjs.Dialogs.Color          = ColorDialog;

})(OSjs.Core.DialogWindow, OSjs.GUI);
