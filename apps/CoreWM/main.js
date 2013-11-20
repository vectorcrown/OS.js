(function(WindowManager, GUI) {

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    WindowManager.apply(this, ['CoreWM', this, args, metadata]);

    var root = document.createElement('div');
    root.id = 'WindowList';
    root.oncontextmenu = function(ev) {
      OSjs.GUI.blurMenu();
      return false;
    };

    var el = document.createElement('ul');

    var sel;
    sel = document.createElement('li');
    sel.innerHTML = '<img alt="" src="/themes/default/icons/16x16/categories/applications-other.png" />';
    sel.onclick = function(ev) {
      var p = OSjs.API.getCoreService();
      if ( p ) {
        var apps = p.getApplicationCache();
        var list = [];
        for ( var a in apps ) {
          if ( apps.hasOwnProperty(a) ) {
            //if ( a.match(/^Core/) ) continue;
            list.push({
              title: apps[a].name,
              icon: apps[a].icon,
              onClick: (function(name, iter) {
                return function() {
                  OSjs.API.getCoreInstance().launch(name);
                };
              })(a, apps[a])
            });
          }
        }
        GUI.createMenu(list, {x: ev.clientX, y: ev.clientY});
      }
    };
    el.appendChild(sel);

    sel = document.createElement('li');
    sel.innerHTML = '<img alt="" src="/themes/default/icons/16x16/actions/exit.png" />';
    sel.onclick = function() {
      var t = confirm("Do you want to save current session?");
      OSjs.shutdown(t, false);
    };
    el.appendChild(sel);

    var back = document.createElement('div');
    back.className = 'Background';

    root.appendChild(el);
    root.appendChild(back);

    this._$element = el;
    this._$root = root;

    document.body.appendChild(this._$root);
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.destroy = function(kill) {
    if ( kill && !confirm("Killing this process will stop things from working!") ) {
      return false;
    }

    if ( this._$root && this._$root.parentNode ) {
      this._$root.parentNode.removeChild(this._$root);
    }

    return WindowManager.prototype.destroy.apply(this, []);
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    console.log("OSjs::Applications::CoreWM::eventWindow", ev, win._name);

    var cn;

    var self = this;
    var _change = function(cn, callback) {
      var els = self._$element.getElementsByClassName(cn);
      if ( els.length ) {
        for ( var i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    };

    if ( ev == 'create' ) {
      var el = document.createElement('li');
      el.innerHTML = '<img alt="" src="' + win._icon + '" /><span>' + win._title + '</span>';
      el.className = 'WindowList_Window_' + win._wid;
      el.onclick = function() {
        win._restore();
      };
      this._$element.appendChild(el);
    } else if ( ev == 'close' ) {
      cn = 'WindowList_Window_' + win._wid;
      _change(cn, function(el) {
        el.parentNode.removeChild(el);
      });
    } else if ( ev == 'focus' ) {
      cn = 'WindowList_Window_' + win._wid;
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev == 'blur' ) {
      cn = 'WindowList_Window_' + win._wid;
      _change(cn, function(el) {
        el.className = el.className.replace(' Focused', '');
      });
    }
  };

  CoreWM.prototype.getWindowSpace = function() {
    var s = WindowManager.prototype.getWindowSpace.apply(this, arguments);
    s.left += 10;
    s.top += 50;
    s.width -= 20;
    s.height -= 60;
    return s;
  };

  CoreWM.prototype.getWindowPosition = function() {
    var pos = WindowManager.prototype.getWindowPosition.apply(this, arguments);
    if ( pos.y < 60 ) {
      pos.y += (60 - pos.y);
    }
    return pos;
  };


  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.CoreWM = CoreWM;

})(OSjs.Core.WindowManager, OSjs.GUI);
