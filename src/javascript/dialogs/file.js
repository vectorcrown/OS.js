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
(function(_StandardDialog, Utils, API, VFS) {
  'use strict';

  /**
   * File Chooser Dialog
   *
   *
   * @param   Object          args    Options
   * @param   Function        onClose Callback on close => fn(button, file)
   *
   * @option args String  type                  Dialog type: "open" or "save"
   * @option args String  select                Selection type: "file" or "dir"
   * @option args String  path                  Current path
   * @option args String  filename              Current filename
   * @option args String  mime                  Current file MIME
   * @option args String  mimes                 Browse filetype filter (defaults to [none] all files)
   * @option args String  filetypes             Save filetypes dict (ext => mime)
   * @option args String  defaultFilename       Default filename
   * @option args String  defaultFilemime       Default filemime (defaults to given MIME)
   *
   * @api OSjs.Dialogs.File
   * @see OSjs.Dialogs._StandardDialog
   *
   * @extends _StandardDialog
   * @class
   */
  var FileDialog = function(args, onClose) {
    args = args || {};

    // Arguments
    this.type             = args.type             || 'open';
    this.path             = args.path;
    this.select           = args.select           || 'file';
    this.filename         = args.filename         || '';
    this.filemime         = args.mime             || '';
    this.filter           = args.mimes            || [];
    this.filetypes        = args.filetypes        || null;
    this.showMkdir        = args.mkdir            || false;
    this.defaultFilename  = args.defaultFilename  || 'New File';
    this.defaultFilemime  = args.defaultFilemime  || this.filemime || '';

    if ( !this.path && this.filename ) {
      if ( this.filename.match(/\//) ) {
        this.path     = Utils.dirname(this.filename);
        this.filename = Utils.filename(this.filename);
      }
    }

    if ( !this.path ) {
      this.path = API.getDefaultPath('/');
    }

    // Stored elements etc.
    this.errors       = 0;
    this.selectedFile = null;
    this.$input       = null;
    this.$fileView    = null;
    this.$statusBar   = null;
    this.$select      = null;
    this.$selectRoot  = null;

    // Window
    var title     = API._(this.type === 'save' ? 'DIALOG_FILE_SAVE' : 'DIALOG_FILE_OPEN');
    var className = this.type === 'save' ? 'FileSaveDialog' : 'FileOpenDialog';

    _StandardDialog.apply(this, [className, {
      title: title,
      icon: (this.type === 'open' ? 'actions/gtk-open.png' : 'actions/gtk-save-as.png'),
      buttons: ['cancel', 'ok']
    }, {width:600, height:380}, onClose]);
  };

  FileDialog.prototype = Object.create(_StandardDialog.prototype);

  /**
   * Destroy
   */
  FileDialog.prototype.destroy = function() {
    this.$input       = null;
    this.$fileView    = null;
    this.$statusBar   = null;
    this.$select      = null;
    this.$selectRoot  = null;

    _StandardDialog.prototype.destroy.apply(this, arguments);
  };

  /**
   * Create
   */
  FileDialog.prototype.init = function() {
    var self = this;
    var root = _StandardDialog.prototype.init.apply(this, arguments);

    this.$fileView = this._addGUIElement(new OSjs.GUI.FileView('FileDialogFileView', {
      mimeFilter: this.filter,
      typeFilter: (this.select === 'path' ? 'dir' : null)
    }), this.$element);
    this.$fileView.onError = function() {
      self.onError.apply(self, arguments);
    };
    this.$fileView.onContextMenu = function(ev) {
      self.createContextMenu(ev);
    };
    this.$fileView.onViewContextMenu = function(ev) {
      self.createContextMenu(ev);
    };
    this.$fileView.onSelected = function(item) {
      self.onFileSelected(item);
    };
    this.$fileView.onFinished = function() {
      self.onFileFinished();
    };
    this.$fileView.onRefresh = function() {
      self.onFileRefresh();
    };
    this.$fileView.onActivated = function(item) {
      self.onFileActivated(item);
    };

    this.$statusBar = this._addGUIElement(new OSjs.GUI.StatusBar('FileDialogStatusBar'), this.$element);
    this.$statusBar.setText('');

    function setSelectedType(val) {
      if ( val && self.$select ) {
        var spl = val.split('.');
        if ( spl.length ) {
          self.$select.setValue(spl.pop());
        }
      }
    }

    if ( this.type === 'save' ) {
      var curval = Utils.escapeFilename(this.filename ? this.filename : this.defaultFilename);

      if ( this.filetypes ) {
        var firstExt = '';
        var types = {};
        var MIMEDescriptions = API.getDefaultSettings().MIME || {};

        Object.keys(this.filetypes).forEach(function(i) {
          var val = self.filetypes[i];
          if ( !firstExt ) {
            firstExt = i;
          }

          types[i] = '';
          if ( MIMEDescriptions[val] ) {
            types[i] += MIMEDescriptions[val] + ' ';
          }
          types[i] += val + ' (.' + i + ')';
        });

        var ext = (curval.split('.')).pop();
        if ( ext && !this.filetypes[ext] && firstExt ) {
          curval = Utils.replaceFileExtension(curval, firstExt);
        }

        this.$select = this._addGUIElement(new OSjs.GUI.Select('FileDialogFiletypeSelect', {onChange: function(sobj, sdom, val) {
          self.onSelectChange(val);
        }}), this.$element);
        this.$select.addItems(types);

        setSelectedType(curval);
        Utils.$addClass(root.firstChild, 'HasFileTypes');
      }

      this.$input = this._addGUIElement(new OSjs.GUI.Text('FileName', {value: curval, onKeyPress: function(ev) {
        self.onInputKey(ev);
        if ( ev.keyCode === Utils.Keys.ENTER ) {
          self.onInputEnter(ev);
          return;
        }
      }, onChange: function(ev) {
        if ( self.$input ) {
          setSelectedType(self.$input.getValue());
        }
        self.onInputKey(ev);
      }, onKeyUp: function(ev) {
        if ( self.$input ) {
          setSelectedType(self.$input.getValue());
        }
        self.onInputKey(ev);
      }}), this.$element);
    }

    var roots = VFS.getModules(); // FIXME Does not work if Internal is disabled for some reason
    if ( roots.length > 1 ) {
      Utils.$addClass(this.$element, 'HasRootSelection');
      this.$selectRoot = this._addGUIElement(new OSjs.GUI.Select('SelectRoot', {onChange: function(el, ev, value) {
        if ( self.$fileView ) {
          var root = VFS.Modules[value].root;
          self.$fileView.chdir(root);
        }
      }}), this.$element);

      roots.forEach(function(m, i) {
        var icon = API.getIcon(m.module.icon);
        var desc = m.module.description + (m.module.readOnly ? Utils.format(' ({0})', API._('LBL_READONLY')) : '');
        self.$selectRoot.addItem(m.name, desc, icon);
      });

      var cur = VFS.getModuleFromPath(this.path);
      this.$selectRoot.setSelected(cur);
    }

    if ( this.showMkdir && this.$buttons ) {
      this._addGUIElement(new OSjs.GUI.Button('ButtonMkdir', {label: 'New Folder', onClick: function() {

        var dir = self.$fileView.getPath();
        var msg = API._('DIALOG_FILE_MKDIR_MSG', dir);
        var diag = new OSjs.Dialogs.Input(msg, API._('DIALOG_FILE_MKDIR'), function(btn, val) {
          if ( btn === 'ok' && val ) {
            var newdir = new VFS.File(dir + '/' + val);
            VFS.mkdir(newdir, function(error) {
              if ( !error && self.$fileView ) {
                self.$fileView.refresh();
              }
            });
          }
        });

        self._addChild(diag, true);
      }}), this.$buttons);
    }

    return root;
  };

  /**
   * Window has been displayed
   */
  FileDialog.prototype._inited = function() {
    _StandardDialog.prototype._inited.apply(this, arguments);

    // Force override of default MIME if we have a selector
    if ( this.filetypes && this.$select ) {
      var self = this;
      Object.keys(this.filetypes).forEach(function(i) {
        self.filemime = i;
        self.defaultFilemime = i;
        return false;
      });
    }

    if ( this.$fileView ) {
      this.$fileView.chdir(this.path);
    }

    if ( this.buttons['ok'] ) {
      if ( this.type === 'save' && this.$input && this.$input.getValue() ) {
        this.buttons['ok'].setDisabled(false);
      }
    }

    this.highlightFilename();
  };

  /**
   * Window has been focused
   */
  FileDialog.prototype._focus = function() {
    _StandardDialog.prototype._focus.apply(this, arguments);

    this.highlightFilename();
  };

  /**
   * File has been chosen
   */
  FileDialog.prototype.finishDialog = function(file) {
    var self = this;

    file = file || new VFS.File(_getSelected());
    file.mime = file.mime || this.defaultMime;

    function _getSelected() {
      var result = '';

      if ( self.select === 'path' ) {
        result = self.selectedFile;
      } else {
        if ( self.$fileView ) {
          var root = self.$fileView.getPath();
          if ( self.$input ) {
            result = root + (root.match(/\/$/) ? '' : '/') + self.$input.getValue();
          } else {
            result = self.selectedFile;
          }
        }
      }

      return result;
    }

    function _confirm() {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        self._toggleDisabled(true);
        var conf = new OSjs.Dialogs.Confirm(API._('DIALOG_FILE_OVERWRITE', Utils.filename(file.path)), function(btn) {
          self._toggleDisabled(false);
          if ( btn === 'ok' ) {
            self.end('ok', file);
          }
        });
        wm.addWindow(conf);
        self._addChild(conf);
      }
    }

    if ( this.type === 'open' ) {
      this.end('ok', file);
    } else {
      VFS.exists(file, function(error, result) {
        if ( error ) {
          self.onError((error || 'Failed to stat file'), file.path, false, true);
          return;
        }
        if ( result ) {
          _confirm();
          return;
        }

        self.end('ok', file);
      });
    }
  };

  /**
   * Highlights the filename in input
   */
  FileDialog.prototype.highlightFilename = function() {
    if ( this.$input ) {
      this.$input.focus();
      var range = Utils.getFilenameRange(this.$input.getValue());
      this.$input.select(range);
    }
  };

  FileDialog.prototype.checkInput = function() {
    if ( this.type !== 'save' ) { return; }
    if ( !this.buttons['ok'] ) { return; }

    if ( this.$input.getValue().length ) {
      this.buttons['ok'].setDisabled(false);
    } else {
      this.buttons['ok'].setDisabled(true);
    }
  };

  /**
   * Create Context Menu
   */
  FileDialog.prototype.createContextMenu = function(ev) {
    var self = this;
    var fileList = this.$fileView;
    if ( !fileList ) { return; }
    var viewType = fileList.viewType || '';

    OSjs.API.createMenu([
      {name: 'ListView', title: API._('DIALOG_FILE_MNU_VIEWTYPE'), menu: [
        {name: 'ListView', title: API._('DIALOG_FILE_MNU_LISTVIEW'), disabled: (viewType.toLowerCase() === 'listview'), onClick: function() {
          self.onMenuSelect('ListView');
        }},
        {name: 'IconView', title: API._('DIALOG_FILE_MNU_ICONVIEW'), disabled: (viewType.toLowerCase() === 'iconview'), onClick: function() {
          self.onMenuSelect('IconView');
        }},
        {name: 'TreeView', title: API._('DIALOG_FILE_MNU_TREEVIEW'), disabled: (viewType.toLowerCase() === 'treeview'), onClick: function() {
          self.onMenuSelect('TreeView');
        }}
      ]}
    ], {x: ev.clientX, y: ev.clientY});
  };

  /**
   * Error wrapper
   */
  FileDialog.prototype.onError = function(err, dirname, fatal, nochdir) {
    this._toggleLoading(false);

    if ( err ) {
      if ( !fatal ) {
        if ( this.errors < 2 ) {
          if ( this.$fileView ) {
            if ( !nochdir ) { // NOTE ISSUE #44
              this.$fileView.chdir(API.getDefaultPath('/'));
            }
          }
        } else {
          this.errors = 0;
        }
        this.errors++;
      }

      this._error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_ERROR_SCANDIR', dirname), err);
    }
  };

  /**
   * Menu: Item selected
   */
  FileDialog.prototype.onMenuSelect = function(type) {
    if ( this.$fileView ) {
      this.$fileView.setViewType(type);
    }
    this._focus();
  };

  /**
   * FileView: Selection
   */
  FileDialog.prototype.onFileSelected = function(item) {
    var selected = null;
    var seltype  = item ? item.type : null;

    if ( this.select === 'path' ) {
      if ( item && item.type === 'dir' ) {
        selected = item.path;
      }
    } else {
      if ( item && item.type === 'file' ) {
        selected = item.path;
      }
    }

    if ( this.buttons['ok'] ) {
      this.buttons['ok'].setDisabled(selected === null);
    }

    if ( this.$input ) {
      var fname;
      if ( this.select === 'dir' ) {
        if ( selected ) {
          fname = selected;
        }
      } else {
        if ( seltype === 'file' ) {
          fname = selected;
        }
      }

      if ( fname ) {
        this.$input.setValue(Utils.escapeFilename(fname));
      }
    }

    this.selectedFile = selected;
  };

  /**
   * FileView: Refresh Finished
   */
  FileDialog.prototype.onFileFinished = function() {
    if ( this.$statusBar && this.$fileView ) {
      this.path = this.$fileView.getPath();
      this.$statusBar.setText(this.path);
    }
    this._toggleLoading(false);

    if ( this.select === 'path' ) {
      this.selectedFile = this.path; // Dir selection dialog needs to start on default
      this.buttons['ok'].setDisabled(false);
    }

    this.checkInput();
  };

  /**
   * FileView: Refresh
   */
  FileDialog.prototype.onFileRefresh = function() {
    this.selectedFile = null;

    if ( this.$statusBar && this.$fileView ) {
      this.$statusBar.setText(this.$fileView.getPath());
    }
    this._toggleLoading(true);

    if ( this.buttons['ok'] ) {
      this.buttons['ok'].setDisabled(true);
    }
  };

  /**
   * FileView: Activated
   */
  FileDialog.prototype.onFileActivated = function(item) {
    var self = this;
    this.selectedFile = null;

    function _activated() {
      self.buttons['ok'].setDisabled(false);
      self.finishDialog.call(self, item);
    }

    if ( this.select === 'file' && item.type === 'file' ) {
      _activated();
    } else if ( this.select === 'path' && item.type === 'dir' && Utils.filename(item.path) !== '..' ) {
      _activated();
    }
  };

  /**
   * Select: Item changed
   */
  FileDialog.prototype.onSelectChange = function(type) {
    this.filemime = this.filetypes[type];

    if ( this.$input ) {
      var newval = Utils.replaceFileExtension(this.$input.getValue(), type);
      this.$input.setValue(newval);
    }

    this.highlightFilename();
  };

  /**
   * Input: key pressed
   */
  FileDialog.prototype.onInputKey = function() {
    this.checkInput();
  };

  /**
   * Input: enter pressed
   */
  FileDialog.prototype.onInputEnter = function(ev) {
    if ( this.buttons['ok'] && this.buttons['ok'].getDisabled() ) {
      return;
    }

    this.onButtonClick('ok', ev);
  };

  /**
   * Button: pressed
   */
  FileDialog.prototype.onButtonClick = function(btn, ev) {
    if ( btn === 'ok' ) {
      if ( this.buttons[btn] ) {
        var sel = this.$input ? this.$input.getValue() : this.selectedFile;
        if ( !sel ) {
          var wm = OSjs.Core.getWindowManager();
          if ( wm ) {
            var dwin;
            if ( this.type === 'save' ) {
              dwin = new OSjs.Dialogs.Alert(API._('DIALOG_FILE_MISSING_FILENAME'));
            } else {
              dwin = new OSjs.Dialogs.Alert(API._('DIALOG_FILE_MISSING_SELECTION'));
            }
            wm.addWindow(dwin);
            this._addChild(dwin);
          }
          return;
        }

        this.finishDialog();
      }
      return;
    }

    _StandardDialog.prototype.onButtonClick.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Dialogs.File               = FileDialog;

})(OSjs.Dialogs._StandardDialog, OSjs.Utils, OSjs.API, OSjs.VFS);
