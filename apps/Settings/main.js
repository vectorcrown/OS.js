(function(Application, Window) {

  /**
   * Main Window
   */
  var ApplicationSettingsWindow = function(app) {
    Window.apply(this, ['ApplicationSettingsWindow', {width: 500, height: 390}, app]);

    this._title                   = "Settings";
    this._icon                    = "categories/applications-system.png";
    this._properties.allow_resize   = false;
    this._properties.allow_maximize = false;
  };

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);

  ApplicationSettingsWindow.prototype.init = function(wm) {
    var self      = this;
    var root      = Window.prototype.init.apply(this, arguments);
    var app       = this._appRef;

    var settings      = wm.getSettings();
    var themes        = wm.getThemes();
    var theme         = wm.getSetting('theme');
    var desktopMargin = settings.desktop.margin;

    var container = document.createElement('div');
    var outer, label, input, button, tmp;
    var i, l;

    // Theme
    outer = document.createElement('div');
    outer.className = "Setting SettingsNoButton Setting_Theme";

    label = document.createElement('label');
    label.innerHTML = "Theme";

    input = document.createElement('select');
    input.name = "theme";


    l = 0;
    for ( i in themes ) {
      if ( themes.hasOwnProperty(i) ) {
        tmp = document.createElement('option');
        tmp.value = i;
        tmp.innerHTML = themes[i].title;
        if ( theme == i ) {
          input.selectedIndex = l;
        }
        input.appendChild(tmp);
        l++;
      }
    }

    outer.appendChild(label);
    outer.appendChild(input);
    container.appendChild(outer);

    //
    // Background Type
    //
    outer = document.createElement('div');
    outer.className = "Setting SettingsNoButton Setting_BackgroundType";

    label = document.createElement('label');
    label.innerHTML = "Background Type";

    input = document.createElement('select');
    input.name = "backgroundType";

    tmp = document.createElement('option');
    tmp.value = 'image';
    tmp.innerHTML = 'Image';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'image-repeat';
    tmp.innerHTML = 'Image (Repeat)';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'image-center';
    tmp.innerHTML = 'Image (Center)';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'image-fill';
    tmp.innerHTML = 'Image (Fill)';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'image-strech';
    tmp.innerHTML = 'Image (Strech)';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'color';
    tmp.innerHTML = 'Color';
    input.appendChild(tmp);

    for ( i = 0; i < input.childNodes.length; i++ ) {
      if ( input.childNodes[i].value == settings.background ) {
        //input.childNodes[i].selected = "selected";
        input.selectedIndex = i;
        break;
      }
    }

    outer.appendChild(label);
    outer.appendChild(input);
    container.appendChild(outer);

    //
    // Background Image
    //
    outer = document.createElement('div');
    outer.className = "Setting Setting_BackgroundImage";

    label = document.createElement('label');
    label.innerHTML = "Background Image";

    input = document.createElement('input');
    input.type = "text";
    input.disabled = "disabled";
    input.name = "backgroundImage";
    input.value = settings.wallpaper;

    button = document.createElement('button');
    button.innerHTML = "...";

    button = document.createElement('button');
    button.innerHTML = "...";
    button.onclick = (function(inp) {
      return function(ev) {
        self.openBackgroundSelect(ev, inp);
      };
    })(input);

    outer.appendChild(label);
    outer.appendChild(input);
    outer.appendChild(button);
    container.appendChild(outer);

    //
    // Background Color
    //
    outer = document.createElement('div');
    outer.className = "Setting Setting_BackgroundColor";

    label = document.createElement('label');
    label.innerHTML = "Background Color";

    input = document.createElement('input');
    input.type = "text";
    input.disabled = "disabled";
    input.name = "backgroundColor";
    input.style.backgroundColor = settings.style.backgroundColor;
    input.style.color = "#fff";
    input.value = settings.style.backgroundColor;

    button = document.createElement('button');
    button.innerHTML = "...";
    button.onclick = (function(inp) {
      return function(ev) {
        self.openBackgroundColorSelect(ev, inp);
      };
    })(input);

    outer.appendChild(label);
    outer.appendChild(input);
    outer.appendChild(button);
    container.appendChild(outer);

    //
    // Font
    //
    outer = document.createElement('div');
    outer.className = "Setting Setting_Font";

    label = document.createElement('label');
    label.innerHTML = "Font";

    input = document.createElement('input');
    input.type = "text";
    input.disabled = "disabled";
    input.name = "font";
    input.value = settings.style.fontFamily;
    input.style.fontFamily = settings.style.fontFamily;

    button = document.createElement('button');
    button.innerHTML = "...";
    button.onclick = (function(inp) {
      return function(ev) {
        self.openFontSelect(ev, inp);
      };
    })(input);

    outer.appendChild(label);
    outer.appendChild(input);
    outer.appendChild(button);
    container.appendChild(outer);

    //
    // Taskbar Position
    //
    outer = document.createElement('div');
    outer.className = "Setting SettingsNoButton Setting_TaskbarPosition";

    label = document.createElement('label');
    label.innerHTML = "Taskbar Position";

    input = document.createElement('select');
    input.name = "taskbarPosition";

    tmp = document.createElement('option');
    tmp.value = 'top';
    tmp.innerHTML = 'Top';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'bottom';
    tmp.innerHTML = 'Bottom';
    input.appendChild(tmp);

    for ( i = 0; i < input.childNodes.length; i++ ) {
      if ( input.childNodes[i].value == settings.taskbar.position ) {
        //input.childNodes[i].selected = "selected";
        input.selectedIndex = i;
        break;
      }
    }

    outer.appendChild(label);
    outer.appendChild(input);
    container.appendChild(outer);

    //
    // Taskbar Ontop
    //
    outer = document.createElement('div');
    outer.className = "Setting SettingsNoButton Setting_TaskBarOntop";

    label = document.createElement('label');
    label.innerHTML = "Taskbar ontop ?";

    input = document.createElement('select');
    input.name = "taskbarOntop";

    tmp = document.createElement('option');
    tmp.value = 'yes';
    tmp.innerHTML = 'Yes';
    input.appendChild(tmp);

    tmp = document.createElement('option');
    tmp.value = 'no';
    tmp.innerHTML = 'No';
    input.appendChild(tmp);

    input.selectedIndex = settings.taskbar.ontop ? 0 : 1;

    outer.appendChild(label);
    outer.appendChild(input);
    container.appendChild(outer);

    //
    // Desktop Margin
    //
    outer = document.createElement('div');
    outer.className = "Setting Setting_DesktopMargin";

    label = document.createElement('label');
    label.innerHTML = "Desktop Margin (" + desktopMargin + "px)";

    outer.appendChild(label);
    var slider = this._addGUIElement(new OSjs.GUI.Slider('SliderMargin', {min: 0, max: 50, val: desktopMargin}, function(value, percentage) {
      desktopMargin = value;
      label.innerHTML = "Desktop Margin (" + desktopMargin + "px)";
    }), outer);
    container.appendChild(outer);
    slider.setValue(desktopMargin);

    //
    // Buttons
    //
    button = document.createElement('button');
    button.className = "Save";
    button.innerHTML = "Apply";
    button.onclick = function(ev) {
      app.save(ev, self, {
        taskbarOntop:     document.getElementsByName('taskbarOntop')[0].value == 'yes',
        taskbarPosition:  document.getElementsByName('taskbarPosition')[0].value,
        desktopMargin:    desktopMargin,
        desktopFont:      document.getElementsByName('font')[0].value,
        theme:            document.getElementsByName('theme')[0].value,
        backgroundType:   document.getElementsByName('backgroundType')[0].value,
        backgroundImage:  document.getElementsByName('backgroundImage')[0].value,
        backgroundColor:  document.getElementsByName('backgroundColor')[0].value
      });
    };

    root.appendChild(container);
    root.appendChild(button);
  };

  ApplicationSettingsWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
  };

  ApplicationSettingsWindow.prototype.openBackgroundSelect = function(ev, input) {
    var curf = input.value ? OSjs.Utils.dirname(input.value) : OSjs.API.getDefaultPath('/');
    var curn = input.value ? OSjs.Utils.filename(input.value) : '';

    var self = this;
    this._appRef._createDialog('File', [{type: 'open', path: curf, filename: curn, mimes: ['^image']}, function(btn, fname, rmime) {
      self._focus();
      if ( btn !== 'ok' ) return;
      input.value = fname;
    }], this);
  };

  ApplicationSettingsWindow.prototype.openBackgroundColorSelect = function(ev, input) {
    var cur = input.value;
    var self = this;
    this._appRef._createDialog('Color', [{color: cur}, function(btn, rgb, hex) {
      self._focus();
      if ( btn != 'ok' ) return;
      input.value = hex;
      input.style.backgroundColor = hex;
    }], this);
  };

  ApplicationSettingsWindow.prototype.openFontSelect = function(ev, input) {
    var cur = input.value;
    var self = this;
    this._appRef._createDialog('Font', [{name: cur, minSize: 0, maxSize: 0}, function(btn, fontName, fontSize) {
      self._focus();
      if ( btn != 'ok' ) return;
      input.value = fontName;
      input.style.fontFamily = fontName;
    }], this);
  };

  /**
   * Application
   */
  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);

  ApplicationSettings.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, []);
  };

  ApplicationSettings.prototype.init = function(core, settings) {
    Application.prototype.init.apply(this, arguments);

    this._addWindow(new ApplicationSettingsWindow(this));
  };

  ApplicationSettings.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( msg == 'destroyWindow' && obj._name === 'ApplicationSettingsWindow' ) {
      this.destroy();
    }

  };

  ApplicationSettings.prototype.save = function(ev, win, settings) {
    var wm = OSjs.API.getWMInstance();
    console.warn("ApplicationSettings::save()", settings);
    if ( wm ) {
      var res = wm.applySettings({
        taskbar    : {ontop: settings.taskbarOntop, position: settings.taskbarPosition},
        desktop    : {margin: settings.desktopMargin},
        theme      : settings.theme,
        wallpaper  : settings.backgroundImage,
        background : settings.backgroundType,
        style      : {
          fontFamily       : settings.desktopFont,
          backgroundColor  : settings.backgroundColor
        }
      }, false, true);
    }
  };

  //
  // EXPORTS
  //
  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = ApplicationSettings;

})(OSjs.Core.Application, OSjs.Core.Window);
