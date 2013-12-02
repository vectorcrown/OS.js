(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationTextpadWindow = function(app, opts) {
    Window.apply(this, ['ApplicationTextpadWindow', opts, app]);

    this.title  = "Textpad";
    this._icon  = "apps/accessories-text-editor.png";
    this._title = this.title;
    this._properties.allow_drop = true;
  };

  ApplicationTextpadWindow.prototype = Object.create(Window.prototype);

  ApplicationTextpadWindow.prototype.init = function(wmref, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    var menuBar = this._addGUIElement(new OSjs.GUI.MenuBar('ApplicationTextpadMenuBar'), root);
    menuBar.addItem("File", [
      {title: 'New', name: 'New', onClick: function() {
        app.defaultAction('new');
      }},
      {title: 'Open', name: 'Open', onClick: function() {
        app.defaultAction('open');
      }},
      {title: 'Save', name: 'Save', onClick: function() {
        app.defaultAction('save');
      }},
      {title: 'Save As...', name: 'SaveAs', onClick: function() {
        app.action('saveas');
      }},
      {title: 'Close', name: 'Close', onClick: function() {
        self._close();
      }}
    ]);

    menuBar.onMenuOpen = function(menu) {
      var el = menu.getRoot().getElementsByClassName("MenuItem_Save")[0];
      if ( el ) {
        if ( app.currentFile ) {
          el.className = el.className.replace(/\s?Disabled/, '');
        } else {
          el.className += ' Disabled';
        }
      }
    };

    this._addGUIElement(new OSjs.GUI.Textarea('TextpadTextarea'), root);

    this.setText(null);
  };

  ApplicationTextpadWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationTextpadWindow.prototype._onDndEvent = function(ev, type, item, args) {
    Window.prototype._onDndEvent.apply(this, arguments);
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._appRef.defaultAction('open', data.path, data.mime);
      }
    }
  };

  ApplicationTextpadWindow.prototype.setText = function(t, name) {
    var txt = this._getGUIElement('TextpadTextarea');
    if ( !txt ) return;
    txt.setText(t);
    this.setTitle(name);
  };

  ApplicationTextpadWindow.prototype.getText = function() {
    var txt = this._getGUIElement('TextpadTextarea');
    return txt ? txt.getText() : '';
  };

  ApplicationTextpadWindow.prototype.setTitle = function(name) {
    name = name || "New file";
    this._setTitle(this.title + " - " + OSjs.Utils.filename(name));
  };

  ApplicationTextpadWindow.prototype._focus = function() {
    Window.prototype._focus.apply(this, arguments);
    var txt = this._getGUIElement('TextpadTextarea');
    if ( txt ) {
      txt.focus();
    }
  };

  ApplicationTextpadWindow.prototype._close = function() {
    var gel = this._getGUIElement('TextpadTextarea');
    if ( gel && gel.hasChanged ) {
      var self = this;
      this._toggleDisabled(true);
      this._appRef._createDialog('Confirm', ['Quit without saving?', function(btn) {
        self._toggleDisabled(false);
        if ( btn == "ok" ) {
          gel.hasChanged = false;
          self._close();
        }
      }]);
      return false;
    }

    return Window.prototype._close.apply(this, arguments);
  };


  /**
   * Application
   */
  var ApplicationTextpad = function(args, metadata) {
    var self = this;
    Application.apply(this, ['ApplicationTextpad', args, metadata]);

    this.defaultActionWindow  = 'ApplicationTextpadWindow';
    this.defaultFilename      = "New text file.txt";
    this.defaultMime          = 'text/plain';
    this.acceptMime           = ['^text'];

    this.defaultActionError = function(action, error) {
      var w = self._getWindow('ApplicationTextpadWindow');
      var msg = "An error occured in action: " + action;
      if ( w ) {
        w._error("Textpad error", msg, error);
      } else {
        OSjs.API.error("Textpad error", msg, error);
      }
    };

    this.defaultActionSuccess = function(action, arg1, arg2) {
      var w = self._getWindow('ApplicationTextpadWindow');
      if ( w ) {
        if ( action === 'open' ) {
          w.setText(arg1, arg2.path);
        } else {
          w.setTitle(arg1 ? arg1.path : null);
        }
        w._focus();
      }
    };
  };

  ApplicationTextpad.prototype = Object.create(Application.prototype);

  ApplicationTextpad.prototype.init = function(core, session) {
    this._addWindow(new ApplicationTextpadWindow(this, {width: 450, height: 300}));
    Application.prototype.init.apply(this, arguments);
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationTextpad = ApplicationTextpad;

})(OSjs.Core.DefaultApplication, OSjs.Core.Window);
