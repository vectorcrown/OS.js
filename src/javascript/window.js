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
(function(Utils, API, Process) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get next z-index for Window
   * @return integer
   */
  var getNextZindex = (function() {
    var _lzindex  = 1;
    var _ltzindex = 100000;

    return function(ontop) {
      if ( typeof ontop !== 'undefined' && ontop === true ) {
        return (_ltzindex+=2);
      }
      return (_lzindex+=2);
    };
  })();

  /**
   * Wrapper for stopPropagation()
   * @return boolean
   */
  function stopPropagation(ev) {
    OSjs.API.blurMenu();
    ev.stopPropagation();
    return false;
  }

  /**
   * Get viewport (Wrapper)
   *
   * @return Object {top, left, width, height}
   * @api OSjs.API.getWindowSpace()
   */
  function getWindowSpace() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      return wm.getWindowSpace();
    }
    return Utils.getRect();
  }

  /**
   * Get CSS animation duration
   */
  function getAnimDuration() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      return wm.getAnimDuration();
    }
    return 301;
  }

  /////////////////////////////////////////////////////////////////////////////
  // WINDOW
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Window Class
   *
   * @param   String                    name      Window name (unique)
   * @param   Object                    opts      List of options
   * @param   OSjs.Core.Application     appRef    Application Reference
   *
   * @option  opts     String          title             Window Title
   * @option  opts     String          icon              Window Icon
   * @option  opts     int             x                 (Optional) X Position
   * @option  opts     int             y                 (Optional) Y Position
   * @option  opts     int             w                 (Optional) Width
   * @option  opts     int             h                 (Optional) Height
   * @option  opts     String          tag               (Optional) Window Tag
   * @option  opts     String          gravity           (Optional) Window Gravity
   * @option  opts     boolean         allow_move        (Optional) Allow movment
   * @option  opts     boolean         allow_resize      (Optional) Allow resize
   * @option  opts     boolean         allow_minimize    (Optional) Allow minimize
   * @option  opts     boolean         allow_maximize    (Optional) Allow maximize
   * @option  opts     boolean         allow_close       (Optional) Allow closing
   * @option  opts     boolean         allow_windowlist  (Optional) Allow appear in WindowList (Panel)
   * @option  opts     boolean         allow_drop        (Optional) Allow DnD
   * @option  opts     boolean         allow_iconmenu    (Optional) Allow Menu when click on Window Icon
   * @option  opts     boolean         allow_ontop       (Optional) Allow ontop
   * @option  opts     boolean         allow_hotkeys     (Optional) Allow usage of hotkeys
   * @option  opts     boolean         allow_session     (Optional) Allow to store for session
   * @option  opts     boolean         key_capture       (Optional) Allow key capture (UNSUSED ?!)
   * @option  opts     boolean         min_width         (Optional) Minimum allowed width
   * @option  opts     boolean         min_height        (Optional) Minimum allowed height
   * @option  opts     boolean         max_width         (Optional) Maximum allowed width
   * @option  opts     boolean         max_height        (Optional) Maximum allowed height
   *
   * @api     OSjs.Core.Window
   * @class
   */
  var Window = (function() {
    var _WID                = 0;
    var _DEFAULT_WIDTH      = 200;
    var _DEFAULT_HEIGHT     = 200;
    var _DEFAULT_MIN_HEIGHT = 100;
    var _DEFAULT_MIN_WIDTH  = 100;
    var _DEFAULT_SND_VOLUME = 1.0;
    var _NAMES              = [];

    return function(name, opts, appRef) {
      var self = this;

      if ( _NAMES.indexOf(name) >= 0 ) {
        throw new Error(API._('ERR_WIN_DUPLICATE_FMT', name));
      }

      var icon      = opts.icon || API.getThemeResource('wm.png', 'wm');
      var position  = {x:(opts.x), y:(opts.y)};
      var dimension = {w:(opts.width || _DEFAULT_WIDTH), h:(opts.height || _DEFAULT_HEIGHT)};

      this._$element      = null;                 // DOMElement: Window Outer container
      this._$root         = null;                 // DOMElement: Window Inner container (for content)
      this._$top          = null;                 // DOMElement: Window Top
      this._$winicon      = null;                 // DOMElement: Window Icon
      this._$loading      = null;                 // DOMElement: Window Loading overlay
      this._$disabled     = null;                 // DOMElement: Window Disabled Overlay
      this._$iframefix    = null;                 // DOMElement: Window IFrame Fix Overlay
      this._$resize       = null;                 // DOMElement: Window Resizer
      this._$warning      = null;                 // DOMElement: Warning message

      this._rendered      = false;                // If Window has been initially rendered
      this._appRef        = appRef || null;       // Reference to Application Window was created from
      this._destroyed     = false;                // If Window has been destroyed
      this._wid           = _WID;                 // Window ID (Internal)
      this._icon          = icon;                 // Window Icon
      this._name          = name;                 // Window Name (Unique identifier)
      this._title         = opts.title || name;   // Window Title
      this._tag           = opts.tag || name;     // Window Tag (ex. Use this when you have a group of windows)
      this._position      = position;             // Window Position
      this._dimension     = dimension;            // Window Dimension
      this._lastDimension = this._dimension;      // Last Window Dimension
      this._lastPosition  = this._position;       // Last Window Position
      this._tmpPosition   = null;
      this._children      = [];                   // Child Windows
      this._parent        = null;                 // Parent Window reference
      this._guiElements   = [];                   // Added GUI Elements
      this._guiElement    = null;                 // Currently selected GUI Element
      this._disabled      = true;                 // If Window is currently disabled
      this._sound         = null;                 // Play this sound when window opens
      this._soundVolume   = _DEFAULT_SND_VOLUME;  // ... using this volume
      this._blinkTimer    = null;
      this._iframeFixEl   = null;

      this._properties    = {                     // Window Properties
        gravity           : null,
        allow_move        : true,
        allow_resize      : true,
        allow_minimize    : true,
        allow_maximize    : true,
        allow_close       : true,
        allow_windowlist  : true,
        allow_drop        : false,
        allow_iconmenu    : true,
        allow_ontop       : true,
        allow_hotkeys     : true,
        allow_session     : true,
        key_capture       : false,
        start_focused     : true,
        min_width         : _DEFAULT_MIN_HEIGHT,
        min_height        : _DEFAULT_MIN_WIDTH,
        max_width         : null,
        max_height        : null
      };

      this._state     = {                         // Window State
        focused   : false,
        modal     : false,
        minimized : false,
        maximized : false,
        ontop     : false,
        onbottom  : false
      };

      this._hooks     = {                         // Window Hooks (Events)
        focus     : [],
        blur      : [],
        destroy   : [],
        maximize  : [],
        minimize  : [],
        restore   : [],
        move      : [], // Called inside the mosuemove event
        moved     : [], // Called inside the mouseup event
        resize    : [], // Called inside the mousemove event
        resized   : []  // Called inside the mouseup event
      };

      Object.keys(opts).forEach(function(k) {
        if ( typeof self._properties[k] !== 'undefined' ) {
          self._properties[k] = opts[k];
        }
        if ( typeof self._state[k] !== 'undefined' ) {
          self._state[k] = opts[k];
        }
      });

      console.info('OSjs::Core::Window::__construct()', this._wid, this._name);

      _WID++;
    };
  })();

  /**
   * Initialize the Window
   *
   * This creates all elements and attaches basic events to them.
   * If you are looking for move/resize events, they are located in
   * the WindowManager.
   *
   * @param   WindowManager   _wm     Window Manager reference
   *
   * @return  DOMElement              The Window DOM element
   *
   * @method  Window::init()
   */
  Window.prototype.init = function(_wm) {
    var self = this;
    var isTouch = OSjs.Compability.touch;
    var wm = OSjs.Core.getWindowManager();

    var main, buttonMaximize, buttonMinimize, buttonClose;

    function _initPosition() {
      if ( !self._properties.gravity ) {
        if ( (typeof self._position.x === 'undefined') || (typeof self._position.y === 'undefined') ) {
          var np = wm ? wm.getWindowPosition() : {x:0, y:0};
          self._position.x = np.x;
          self._position.y = np.y;
        }
      }
    }

    function _initDimension() {
      if ( self._properties.min_height && (self._dimension.h < self._properties.min_height) ) {
        self._dimension.h = self._properties.min_height;
      }
      if ( self._properties.max_width && (self._dimension.w < self._properties.max_width) ) {
        self._dimension.w = self._properties.max_width;
      }
      if ( self._properties.max_height && (self._dimension.h > self._properties.max_height) ) {
        self._dimension.h = self._properties.max_height;
      }
      if ( self._properties.max_width && (self._dimension.w > self._properties.max_width) ) {
        self._dimension.w = self._properties.max_width;
      }
    }

    function _initGravity() {
      var grav = self._properties.gravity;
      if ( grav ) {
        if ( grav === 'center' ) {
          self._position.y = (window.innerHeight / 2) - (self._dimension.h / 2);
          self._position.x = (window.innerWidth / 2) - (self._dimension.w / 2);
        } else {
          var space = getWindowSpace();
          if ( grav.match(/^south/) ) {
            self._position.y = space.height - self._dimension.h;
          } else {
            self._position.y = space.top;
          }
          if ( grav.match(/west$/) ) {
            self._position.x = space.left;
          } else {
            self._position.x = space.width - self._dimension.w;
          }
        }
      }
    }

    function _initMinButton() {
      buttonMinimize            = document.createElement('div');
      buttonMinimize.className  = 'WindowButton WindowButtonMinimize';
      buttonMinimize.innerHTML  = '&nbsp;';
      if ( self._properties.allow_minimize ) {
        self._addEventListener(buttonMinimize, (isTouch ? 'touchend' : 'click'), function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          self._onWindowButtonClick(ev, this, 'minimize');
          return false;
        });
      } else {
        buttonMinimize.style.display = 'none';
      }
    }

    function _initMaxButton() {
      buttonMaximize            = document.createElement('div');
      buttonMaximize.className  = 'WindowButton WindowButtonMaximize';
      buttonMaximize.innerHTML  = '&nbsp;';
      if ( self._properties.allow_maximize ) {
        self._addEventListener(buttonMaximize, (isTouch ? 'touchend' : 'click'), function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          self._onWindowButtonClick(ev, this, 'maximize');
          return false;
        });
      } else {
        buttonMaximize.style.display = 'none';
      }
    }

    function _initCloseButton() {
      buttonClose           = document.createElement('div');
      buttonClose.className = 'WindowButton WindowButtonClose';
      buttonClose.innerHTML = '&nbsp;';
      if ( self._properties.allow_close ) {
        self._addEventListener(buttonClose, (isTouch ? 'touchend' : 'click'), function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          self._onWindowButtonClick(ev, this, 'close');
          return false;
        });
      } else {
        buttonClose.style.display = 'none';
      }
    }

    function _initDnD() {
      if ( self._properties.allow_drop && OSjs.Compability.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';

        OSjs.API.createDroppable(main, {
          onOver: function(ev, el, args) {
            _showBorder();

            /*
            if ( self._$iframefix ) {
              self._$iframefix.style.display = 'none';
            }
            */
          },

          onLeave : function() {
            _hideBorder();

            /*
            if ( !self._state.focused ) {
              if ( self._$iframefix ) {
                self._$iframefix.style.display = 'block';
              }
            }
            */
          },

          onDrop : function() {
            _hideBorder();
          },

          onItemDropped: function(ev, el, item, args) {
            _hideBorder();
            return self._onDndEvent(ev, 'itemDrop', item, args);
          },
          onFilesDropped: function(ev, el, files, args) {
            _hideBorder();
            return self._onDndEvent(ev, 'filesDrop', files, args);
          }
        });
      }
    }

    function _showBorder() {
      Utils.$addClass(main, 'WindowHintDnD');
    }

    function _hideBorder() {
      Utils.$removeClass(main, 'WindowHintDnD');
    }

    console.group('OSjs::Core::Window::init()');

    this._state.focused = false;
    this._icon = API.getIcon(this._icon, null, this._appRef);

    _initPosition();
    _initDimension();
    _initGravity();

    console.log('Properties', this._properties);
    console.log('Position', this._position);
    console.log('Dimension', this._dimension);

    // Main outer container
    main = document.createElement('div');

    this._addEventListener(main, 'contextmenu', function(ev) {
      var r = Utils.$isInput(ev);

      if ( !r ) {
        ev.preventDefault();
      }

      OSjs.API.blurMenu();

      return r;
    });

    _initDnD();


    // Window -> Top
    var windowTop           = document.createElement('div');
    windowTop.className     = 'WindowTop';

    // Window -> Top -> Icon
    var windowIcon          = document.createElement('div');
    windowIcon.className    = 'WindowIcon';

    var windowIconImage         = document.createElement('img');
    windowIconImage.alt         = this._title;
    windowIconImage.src         = this._icon;
    windowIconImage.width       = 16;
    windowIconImage.height      = 16;
    this._addEventListener(windowIcon, 'dblclick', Utils._preventDefault);
    this._addEventListener(windowIcon, (isTouch ? 'touchend' : 'click'), function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      self._onWindowIconClick(ev, this);
    });

    // Window -> Top -> Title
    var windowTitle       = document.createElement('div');
    windowTitle.className = 'WindowTitle';
    windowTitle.appendChild(document.createTextNode(this._title));

    // Window -> Top -> Buttons
    var windowButtons       = document.createElement('div');
    windowButtons.className = 'WindowButtons';
    if ( !isTouch ) {
      this._addEventListener(windowButtons, 'mousedown', function(ev) {
        ev.preventDefault();
        return stopPropagation(ev);
      });
    }

    _initMinButton();
    _initMaxButton();
    _initCloseButton();


    // Window -> Top -> Content Container (Wrapper)
    var windowWrapper       = document.createElement('div');
    windowWrapper.className = 'WindowWrapper';

    // Window -> Resize handle
    var windowResize        = document.createElement('div');
    windowResize.className  = 'WindowResize';
    if ( !this._properties.allow_resize ) {
      windowResize.style.display = 'none';
    }

    // Window -> Loading Indication
    var windowLoading       = document.createElement('div');
    windowLoading.className = 'WindowLoading';
    this._addEventListener(windowLoading, 'click', Utils._preventDefault);

    var windowLoadingImage        = document.createElement('div');
    windowLoadingImage.className  = 'WindowLoadingIndicator';

    // Window -> Disabled Overlay
    var windowDisabled            = document.createElement('div');
    windowDisabled.className      = 'WindowDisabledOverlay';
    //windowDisabled.style.display  = 'none';
    this._addEventListener(windowDisabled, (isTouch ? 'touchstart' : 'mousedown'), function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    });

    // Append stuff
    var classNames = ['Window'];
    classNames.push('Window_' + Utils.$safeName(this._name));
    if ( this._tag && (this._name !== this._tag) ) {
      classNames.push(Utils.$safeName(this._tag));
    }

    main.className    = classNames.join(' ');
    main.style.width  = this._dimension.w + 'px';
    main.style.height = this._dimension.h + 'px';
    main.style.top    = this._position.y + 'px';
    main.style.left   = this._position.x + 'px';
    main.style.zIndex = getNextZindex(this._state.ontop);

    windowIcon.appendChild(windowIconImage);

    windowButtons.appendChild(buttonMinimize);
    windowButtons.appendChild(buttonMaximize);
    windowButtons.appendChild(buttonClose);

    windowTop.appendChild(windowIcon);
    windowTop.appendChild(windowTitle);
    windowTop.appendChild(windowButtons);

    windowLoading.appendChild(windowLoadingImage);

    main.appendChild(windowTop);
    main.appendChild(windowWrapper);
    main.appendChild(windowResize);
    main.appendChild(windowLoading);
    main.appendChild(windowDisabled);

    this._addEventListener(main, (isTouch ? 'touchstart' : 'mousedown'), function(ev) {
      self._focus();
      return stopPropagation(ev);
    });

    this._$element  = main;
    this._$root     = windowWrapper;
    this._$top      = windowTop;
    this._$loading  = windowLoading;
    this._$winicon  = windowIconImage;
    this._$disabled = windowDisabled;
    this._$resize   = windowResize;

    document.body.appendChild(this._$element);

    windowTitle.style.right = windowButtons.offsetWidth + 'px';

    this._onChange('create');
    this._toggleLoading(false);
    this._toggleDisabled(false);

    if ( this._sound ) {
      API.playSound(this._sound, this._soundVolume);
    }

    console.groupEnd();

    return this._$root;
  };

  Window.prototype._inited = function() {
    console.info('OSjs::Core::Window::_inited()', this._name);
    if ( !this._rendered ) {
      this._updateGUIElements();
    }
    this._rendered = true;

    this._updateIframeFix();
  };

  /**
   * Destroy the Window
   *
   * @return  void
   *
   * @method  Window::destroy()
   */
  Window.prototype.destroy = function() {
    var self = this;

    if ( this._destroyed ) { return; }
    this._destroyed = true;

    var wm = OSjs.Core.getWindowManager();

    console.group('OSjs::Core::Window::destroy()');

    // Nulls out stuff
    function _removeDOM() {
      self._setWarning(null);

      if ( self._$element.parentNode ) {
        self._$element.parentNode.removeChild(self._$element);
      }
      self._$element    = null;
      self._$root       = null;
      self._$top        = null;
      self._$winicon    = null;
      self._$loading    = null;
      self._$disabled   = null;
      self._$iframefix  = null;
      self._iframeFixEl = null;
      self._$resize     = null;
    }

    // Removed DOM elements and their referring objects (GUI Elements etc)
    function _destroyDOM() {
      if ( self._parent ) {
        self._parent._removeChild(self);
      }
      self._parent = null;

      if ( self._guiElements && self._guiElements.length ) {
        self._guiElements.forEach(function(el, i) {
          if ( el ) {
            el.destroy();
          }
          self._guiElements[i] = null;
        });
      }
      self._guiElements = [];

      self._removeChildren();
    }

    // Destroys the window
    function _destroyWin() {
      if ( wm ) {
        wm.removeWindow(self);
      }

      var curWin = wm ? wm.getCurrentWindow() : null;
      if ( curWin && curWin._wid === self._wid ) {
        wm.setCurrentWindow(null);
      }

      var lastWin = wm ? wm.getLastWindow() : null;
      if ( lastWin && lastWin._wid === self._wid ) {
        wm.setLastWindow(null);
      }
    }

    this._onChange('close');
    this._fireHook('destroy');

    _destroyDOM();
    _destroyWin();

    if ( this._$element ) {
      var anim = wm ? wm.getSetting('animations') : false;
      if ( anim ) {
        Utils.$addClass(this._$element, 'WindowHintClosing');
        setTimeout(function() {
          _removeDOM();
        }, getAnimDuration());
      } else {
        this._$element.style.display = 'none';
        _removeDOM();
      }
    }

    // App messages
    if ( this._appRef ) {
      this._appRef._onMessage(this, 'destroyWindow', {});
    }

    this._appRef = null;
    this._hooks = {};

    console.groupEnd();
  };

  //
  // GUI And Event Hooks
  //


  /**
   * Adds a listener for an event
   *
   * @param   DOMElement    el          DOM Element to attach event to
   * @param   String        ev          DOM Event Name
   * @param   Function      callback    Callback on event
   *
   * @return  void
   *
   * @method  Window::_addEventListener()
   */
  Window.prototype._addEventListener = function(el, ev, callback) {
    el.addEventListener(ev, callback, false);

    this._addHook('destroy', function() {
      el.removeEventListener(ev, callback, false);
    });
  };


  /**
   * Adds a hook (internal events)
   *
   * @param   String    k       Hook name: focus, blur, destroy
   * @param   Function  func    Callback function
   *
   * @return  void
   *
   * @method  Window::_addHook()
   */
  Window.prototype._addHook = function(k, func) {
    if ( typeof func === 'function' && this._hooks[k] ) {
      this._hooks[k].push(func);
    }
  };

  /**
   * Fire a hook (internal event)
   *
   * @param   String    k       Hook name: focus, blur, destroy, maximize, minimize, restore, resize, resized
   *
   * @return  void
   *
   * @method  Window::_fireHook()
   */
  Window.prototype._fireHook = function(k, args) {
    args = args || {};
    var self = this;
    if ( this._hooks[k] ) {
      this._hooks[k].forEach(function(hook, i) {
        if ( hook ) {
          try {
            hook.apply(self, args);
          } catch ( e ) {
            console.warn('Window::_fireHook() failed to run hook', k, i, e);
            console.warn(e.stack);
            //console.log(e, e.prototype);
            //throw e;
          }
        }
      });
    }
  };

  /**
   * Remove a GUIElement
   *
   * @param   OSjs.Core.GUIElement     gel       GUI Element reference
   *
   * @return  boolean                           On success
   *
   * @method  Window::_removeGUIElement()
   */
  Window.prototype._removeGUIElement = function(gel) {
    var self = this;
    this._guiElements.forEach(function(iter, i) {
      var destroy = false;

      if ( iter ) {
        if ( gel instanceof OSjs.Core.GUIElement ) {
          if ( iter.id === gel.id ) {
            destroy = i;
          }
        } else {
          if ( iter.id === gel || iter.name === gel ) {
            destroy = i;
          }
        }
      }

      if ( destroy !== false ) {
        if ( self._guiElements[destroy] ) {
          self._guiElements[destroy].destroy();
          self._guiElements[destroy] = null;
        }
        return false;
      }

      return true;
    });
  };

  /**
   * Sends an update command to all GUI Elements
   *
   * @return  void
   *
   * @method  Window::_updateGUIElements()
   */
  Window.prototype._updateGUIElements = function(force) {
    force = (force === true);
    this._guiElements.forEach(function(el, i) {
      if ( el ) {
        el.update(force);
      }
    });
  };

  /**
   * Update IFrame GUIElement "fix"
   *
   * @return  void
   *
   * @method  Window::_updateIframeFix()
   */
  Window.prototype._updateIframeFix = function() {
    if ( this._$iframefix && this._iframeFixEl ) {
      var fel = this._iframeFixEl.$element;
      if ( fel ) {
        this._$iframefix.style.left   = fel.offsetLeft.toString()   + 'px';
        this._$iframefix.style.top    = fel.offsetTop.toString()    + 'px';
        this._$iframefix.style.width  = fel.offsetWidth.toString()  + 'px';
        this._$iframefix.style.height = fel.offsetHeight.toString() + 'px';
      }
    }
  };

  /**
   * Adds a GUIElement
   *
   * @param   GUIElement      gel           GUIElement reference
   * @param   DOMElement      parentNode    DOM Node to add to
   * @param   GUIElement      parentGel     (Optional) The parent GUIElement
   *
   * @return  GUIElement                    On success or 'false'
   *
   * @method  Window::_addGUIElement()
   */
  Window.prototype._addGUIElement = function(gel, parentNode, parentGel) {
    var self = this;

    // Fixes problems with iframes blocking certain events
    function _fixIframe() {
      self._$iframefix = document.createElement('div');
      self._$iframefix.className = 'WindowIframeFix';
      self._$iframefix.onmousemove = Utils._preventDefault;
      self._$iframefix.onclick = function() {
        self._focus();
      };
      self._$element.appendChild(self._$iframefix);
      self._iframeFixEl = gel;

      self._addHook('move', function() {
        if ( self._$iframefix && self._state.focused ) {
          self._$iframefix.style.display = 'block';
        }
      });
      self._addHook('moved', function() {
        if ( self._$iframefix && self._state.focused ) {
          self._$iframefix.style.display = 'none';
        }
      });

      self._addHook('resized', function() {
        self._updateIframeFix();
      });
      self._addHook('blur', function() {
        self._updateIframeFix();
      });
      self._updateIframeFix();
    }

    // Make sure all events are properly set up for various GUI elements
    function _addHooks() {
      if ( gel.opts ) {
        if ( gel.opts.focusable ) {
          gel._addHook('focus', function() {
            self._guiElement = this;
          });
          self._addHook('blur', function() {
            gel.blur();
          });
        }

        // NOTE: self is a fix for iframes blocking mousemove events (ex. moving windows)
        //if ( gel.opts.isIframe ) {
        if ( (gel instanceof OSjs.GUI.RichText) || gel.opts.isIframe ) {
          _fixIframe();
        }

        // NOTE: Fixes for Iframe "bugs"
        gel._addHook('focus', function() {
          OSjs.API.blurMenu();
          self._focus();
        });

        var overlay = null, elpos;
        self._addHook('resize', function() {
          if ( !overlay ) {
            elpos = Utils.$position(gel.$element);

            overlay                   = document.createElement('div');
            overlay.className         = 'IFrameResizeFixer';
            overlay.style.position    = 'absolute';
            overlay.style.zIndex      = 9999999999;
            document.body.appendChild(overlay);
          }
          overlay.style.top      = elpos.top + 'px';
          overlay.style.left     = elpos.left + 'px';
          overlay.style.width    = (gel.$element.offsetWidth||0) + 'px';
          overlay.style.height   = (gel.$element.offsetHeight||0) + 'px';
        });

        self._addHook('resized', function() {
          if ( overlay && overlay.parentNode ) {
            overlay.parentNode.removeChild(overlay);
            overlay = null;
          }
        });
      }

      // NOTE: Fixes problems with GUIElements values not setting properly
      if ( (gel instanceof OSjs.GUI.Tabs) ) {
        gel._addHook('select', function() {
          self._updateGUIElements(true);
        });
      }
    }

    if ( !parentNode && (parentNode instanceof OSjs.Core.GUIElement) ) {
      parentNode = parentGel.$element;
    }

    if ( !parentNode ) {
      throw new Error('Adding a GUI Element requires a parentNode');
    }

    if ( gel instanceof OSjs.Core.GUIElement ) {
      if ( parentGel ) {
        parentGel._addChild(gel.name);
        gel._setParent(parentGel.name);
      }
      gel._setWindow(this);
      gel._setTabIndex(this._guiElements.length + 1);

      _addHooks();

      this._guiElements.push(gel);
      parentNode.appendChild(gel.getRoot());

      if ( this._rendered ) {
        gel.update();
      }

      return gel;
    }

    return false;
  };

  //
  // Children (Windows)
  //

  Window.prototype._addChild = function(w, wmAdd) {
    console.info('OSjs::Core::Window::_addChild()');
    w._parent = this;

    var wm = OSjs.Core.getWindowManager();
    if ( wmAdd && wm ) {
      wm.addWindow(w);
    }
    this._children.push(w);
  };

  /**
   * Removes a child Window
   *
   * @param   Window    w     Widow reference
   *
   * @return  boolean         On success
   *
   * @method  Window::_removeChild()
   */
  Window.prototype._removeChild = function(w) {
    var self = this;
    this._children.forEach(function(child, i) {
      if ( child && child._wid === w._wid ) {
        console.info('OSjs::Core::Window::_removeChild()');

        child.destroy();
        self._children[i] = null;
        return false;
      }
      return true;
    });
  };

  /**
   * Get a Window child by X
   *
   * @param   String      id      Value to look for
   * @param   String      key     Key to look for
   *
   * @return  Window              Resulted Window or 'null'
   *
   * @method  Window::_getChild()
   */
  Window.prototype._getChild = function(id, key) {
    key = key || 'wid';

    var result = key === 'tag' ? [] : null;
    this._children.forEach(function(child, i) {
      if ( child ) {
        if ( key === 'tag' ) {
          result.push(child);
        } else {
          if ( child['_' + key] === id ) {
            result = child;
            return false;
          }
        }
      }
      return true;
    });
    return result;
  };

  /**
   * Get a Window child by ID
   *
   * @see Window::_getChild()
   * @method Window::_getChildById()
   */
  Window.prototype._getChildById = function(id) {
    return this._getChild(id, 'wid');
  };

  /**
   * Get a Window child by Name
   *
   * @see Window::_getChild()
   * @method Window::_getChildByName()
   */
  Window.prototype._getChildByName = function(name) {
    return this._getChild(name, 'name');
  };

  /**
   * Get Window(s) child by Tag
   *
   * @return  Array
   *
   * @see Window::_getChild()
   * @method Window::_getChildrenByTag()
   */
  Window.prototype._getChildrenByTag = function(tag) {
    return this._getChild(tag, 'tag');
  };

  /**
   * Gets all children Windows
   *
   * @return  Array
   *
   * @method  Window::_getChildren()
   */
  Window.prototype._getChildren = function() {
    return this._children;
  };

  /**
   * Removes all children Windows
   *
   * @return  void
   *
   * @method  Window::_removeChildren()
   */
  Window.prototype._removeChildren = function() {
    if ( this._children && this._children.length ) {
      this._children.forEach(function(child, i) {
        if ( child ) {
          child.destroy();
        }
      });
    }
    this._children = [];
  };

  //
  // Actions
  //

  /**
   * Close the Window
   *
   * @return  boolean     On succes
   *
   * @method  Window::_close()
   */
  Window.prototype._close = function() {
    console.info('OSjs::Core::Window::_close()');
    if ( this._disabled ) { return false; }

    Utils.$addClass(this._$element, 'WindowHintClosing');

    this._blur();
    this.destroy();

    return true;
  };

  /**
   * Minimize the Window
   *
   * @return    boolean     On success
   *
   * @method    Window::_minimize()
   */
  Window.prototype._minimize = function() {
    var self = this;
    console.debug(this._name, '>' , 'OSjs::Core::Window::_minimize()');
    if ( !this._properties.allow_minimize ) { return false; }
    //if ( this._disabled ) return false;
    if ( this._state.minimized ) {
      this._restore(false, true);
      return true;
    }

    this._blur();

    this._state.minimized = true;
    Utils.$addClass(this._$element, 'WindowHintMinimized');

    function _hideDOM() {
      self._$element.style.display = 'none';
    }

    var wm = OSjs.Core.getWindowManager();
    var anim = wm ? wm.getSetting('animations') : false;
    if ( anim ) {
      setTimeout(function() {
        _hideDOM();
      }, getAnimDuration());
    } else {
      _hideDOM();
    }

    this._onChange('minimize');
    this._fireHook('minimize');

    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }

    return true;
  };

  /**
   * Maximize the Window
   *
   * @return    boolean     On success
   *
   * @method    Window::_maximize()
   */
  Window.prototype._maximize = function() {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_maximize()');
    if ( !this._properties.allow_maximize ) { return false; }
    if ( !this._$element ) { return false; }
    //if ( this._disabled ) return false;
    if ( this._state.maximized ) {
      this._restore(true, false);
      return true;
    }
    this._lastPosition    = {x: this._position.x,  y: this._position.y};
    this._lastDimension   = {w: this._dimension.w, h: this._dimension.h};
    this._state.maximized = true;

    var s = this._getMaximizedSize();
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top    = (s.top) + 'px';
    this._$element.style.left   = (s.left) + 'px';
    this._$element.style.width  = (s.width) + 'px';
    this._$element.style.height = (s.height) + 'px';
    Utils.$addClass(this._$element, 'WindowHintMaximized');

    //this._resize();
    this._dimension.w = s.width;
    this._dimension.h = s.height;
    this._position.x  = s.left;
    this._position.y  = s.top;

    this._onChange('maximize');
    this._focus();

    var wm = OSjs.Core.getWindowManager();
    var anim = wm ? wm.getSetting('animations') : false;
    if ( anim ) {
      var self = this;
      setTimeout(function() {
        self._fireHook('maximize');
      }, getAnimDuration());
    } else {
      this._fireHook('maximize');
    }

    return true;
  };

  /**
   * Restore the Window
   *
   * @param     boolean     max     Revert maximize state
   * @param     boolean     min     Revert minimize state
   *
   * @return    void
   *
   * @method    Window::_restore()
   */
  Window.prototype._restore = function(max, min) {
    if ( !this._$element ) { return; }

    console.debug(this._name, '>' , 'OSjs::Core::Window::_restore()');
    //if ( this._disabled ) return ;
    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);

    if ( max && this._state.maximized ) {
      this._move(this._lastPosition.x, this._lastPosition.y);
      this._resize(this._lastDimension.w, this._lastDimension.h);
      this._state.maximized = false;
      Utils.$removeClass(this._$element, 'WindowHintMaximized');
    }

    if ( min && this._state.minimized ) {
      this._$element.style.display = 'block';
      this._state.minimized = false;
      Utils.$removeClass(this._$element, 'WindowHintMinimized');
    }

    this._onChange('restore');

    var wm = OSjs.Core.getWindowManager();
    var anim = wm ? wm.getSetting('animations') : false;
    if ( anim ) {
      var self = this;
      setTimeout(function() {
        self._fireHook('restore');
      }, getAnimDuration());
    } else {
      this._fireHook('restore');
    }

    this._focus();

  };

  /**
   * Focus the window
   *
   * @param   boolean     force     Forces focus
   *
   * @return  boolean               On success
   *
   * @method  Window::_focus()
   */
  Window.prototype._focus = function(force) {
    if ( !this._$element ) { return false; }

    //if ( !force && this._state.focused ) { return false; }
    //console.debug(this._name, '>' , 'OSjs::Core::Window::_focus()');
    this._toggleAttentionBlink(false);

    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    Utils.$addClass(this._$element, 'WindowHintFocused');

    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid !== this._wid ) {
      win._blur();
    }

    if ( wm ) {
      wm.setCurrentWindow(this);
      wm.setLastWindow(this);
    }

    if ( !this._state.focused || force) {
      this._onChange('focus');
      this._fireHook('focus');
    }

    this._state.focused = true;

    if ( this._$iframefix ) {
      this._$iframefix.style.display = 'none';
    }

    return true;
  };

  /**
   * Blur the window
   *
   * @param   boolean     force     Forces blur
   *
   * @return  boolean               On success
   *
   * @method  Window::_blur()
   */
  Window.prototype._blur = function(force) {
    if ( !this._$element ) { return false; }
    if ( !force && !this._state.focused ) { return false; }
    //console.debug(this._name, '>' , 'OSjs::Core::Window::_blur()');
    Utils.$removeClass(this._$element, 'WindowHintFocused');
    this._state.focused = false;

    this._onChange('blur');
    this._fireHook('blur');

    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }

    if ( this._$iframefix ) {
      this._$iframefix.style.display = 'block';
    }

    return true;
  };

  /**
   * Resize Window to given size
   *
   * Use this method if you want the window to fit into the viewport and not
   * just set a specific size
   *
   * @param   int           dw            Width
   * @param   int           dh            Height
   * @param   boolean       limit         Limit to this size (default=true)
   * @param   boolean       move          Move window if too big (default=false)
   * @param   DOMElement    container     Relative to this container (default=null)
   * @param   boolean       force         Force movment (default=false)
   *
   * @return  void
   *
   * @method  Window::_resizeTo()
   */
  Window.prototype._resizeTo = function(dw, dh, limit, move, container, force) {
    var self = this;
    if ( !this._$element ) { return; }
    if ( dw <= 0 || dh <= 0 ) { return; }

    limit = (typeof limit === 'undefined' || limit === true);

    var dx = 0;
    var dy = 0;

    if ( container ) {
      var cpos  = Utils.$position(container, this._$root);
      dx = parseInt(cpos.left, 10);
      dy = parseInt(cpos.top, 10);
    }

    var space = this._getMaximizedSize();
    var cx    = this._position.x + dx;
    var cy    = this._position.y + dy;
    var newW  = dw;
    var newH  = dh;
    var newX  = null;
    var newY  = null;

    function _limitTo() {
      if ( (cx + newW) > space.width ) {
        if ( move ) {
          newW = space.width;
          newX = space.left;
        } else {
          newW = (space.width - cx) + dx;
        }
      } else {
        newW += dx;
      }

      if ( (cy + newH) > space.height ) {
        if ( move ) {
          newH = space.height;
          newY = space.top;
        } else {
          newH = (space.height - cy + self._$top.offsetHeight) + dy;
        }
      } else {
        newH += dy;
      }
    }

    function _moveTo() {
      if ( newX !== null ) {
        self._move(newX, self._position.y);
      }
      if ( newY !== null ) {
        self._move(self._position.x, newY);
      }
    }

    function _resizeFinished() {
      var wm = OSjs.Core.getWindowManager();
      var anim = wm ? wm.getSetting('animations') : false;
      if ( anim ) {
        setTimeout(function() {
          self._fireHook('resized');
        }, getAnimDuration());
      } else {
        self._fireHook('resized');
      }
    }

    if ( limit ) {
      _limitTo();
    }

    this._resize(newW, newH, force);

    _moveTo();
    _resizeFinished();
  };

  Window.prototype._resize = function(w, h, force) {
    if ( !this._$element ) { return false; }
    var p = this._properties;

    function _resize() {
      if ( w < p.min_width ) { w = p.min_width; }
      if ( p.max_width !== null ) {
        if ( w > p.max_width ) { w = p.max_width; }
      }

      if ( h < p.min_height ) { h = p.min_height; }
      if ( p.max_height !== null ) {
        if ( h > p.max_height ) { h = p.max_height; }
      }
    }

    if ( !force ) {
      if ( !p.allow_resize ) { return false; }
      _resize();
    }

    if ( w ) {
      this._$element.style.width = w + 'px';
      this._dimension.w = w;
    }

    if ( h ) {
      this._$element.style.height = h + 'px';
      this._dimension.h = h;
    }

    this._onResize();

    return true;
  };

  /**
   * Move window to position
   *
   * @param   Object      pos       Object with {x:, y:}
   *
   * @return  void
   *
   * @method  Window::_moveTo()
   */
  Window.prototype._moveTo = function(pos) {
    var wm = OSjs.Core.getWindowManager();
    if ( !wm ) { return; }

    var s = wm.getWindowSpace();
    var cx = this._position.x;
    var cy = this._position.y;

    if ( pos === 'left' ) {
      this._move(s.left, cy);
    } else if ( pos === 'right' ) {
      this._move((s.width - this._dimension.w), cy);
    } else if ( pos === 'top' ) {
      this._move(cx, s.top);
    } else if ( pos === 'bottom' ) {
      this._move(cx, (s.height - this._dimension.h));
    }
  };

  /**
   * Move window to position
   *
   * @param   int       x     X Position
   * @param   int       y     Y Position
   *
   * @return  boolean         On success
   *
   * @method  Window::_move()
   */
  Window.prototype._move = function(x, y) {
    if ( !this._$element ) { return false; }
    if ( !this._properties.allow_move ) { return false; }
    if ( typeof x === 'undefined' || typeof y === 'undefined') { return false; }

    this._$element.style.top  = y + 'px';
    this._$element.style.left = x + 'px';
    this._position.x          = x;
    this._position.y          = y;

    return true;
  };

  /**
   * Creates an error dialog
   *
   * @param   String      title             Dialog title
   * @param   String      description       Error description
   * @param   String      message           Error message
   * @param   Error       exception         (Optional) Exception
   * @param   boolean     bugreport         Set if this bug can be reported
   *
   * @return  void
   *
   * @method  Window::_error()
   */
  Window.prototype._error = function(title, description, message, exception, bugreport) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_error()');
    var w = API.error(title, description, message, exception, bugreport);
    this._addChild(w);
  };

  /**
   * Toggle disabled overlay
   *
   * @param     boolean     t       Toggle
   *
   * @return    void
   *
   * @method    Window::_toggleDisabled()
   */
  Window.prototype._toggleDisabled = function(t) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleDisabled()', t);
    this._$disabled.style.display = t ? 'block' : 'none';
    this._disabled = t ? true : false;
  };

  /**
   * Toggle loading overlay
   *
   * @param     boolean     t       Toggle
   *
   * @return    void
   *
   * @method    Window::_toggleLoading()
   */
  Window.prototype._toggleLoading = function(t) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleLoading()', t);
    this._$loading.style.display = t ? 'block' : 'none';
  };

  /**
   * Toggle attention
   *
   * @param     boolean     t       Toggle
   *
   * @return    void
   *
   * @method    Window::_toggleAttentionBlink()
   */
  Window.prototype._toggleAttentionBlink = function(t) {
    if ( !this._$element ) { return false; }
    if ( this._state.focused ) { return false; }

    var el     = this._$element;
    var self   = this;

    function _blink(stat) {
      if ( el ) {
        if ( stat ) {
          Utils.$addClass(el, 'WindowAttentionBlink');
        } else {
          Utils.$removeClass(el, 'WindowAttentionBlink');
        }
      }
      self._onChange(stat ? 'attention_on' : 'attention_off');
    }

    /*
    if ( t ) {
      if ( !this._blinkTimer ) {
        console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleAttentionBlink()', t);
        this._blinkTimer = setInterval(function() {
          s = !s;

          _blink(s);
        }, 1000);
        _blink(true);
      }
    } else {
      if ( this._blinkTimer ) {
        console.debug(this._name, '>' , 'OSjs::Core::Window::_toggleAttentionBlink()', t);
        clearInterval(this._blinkTimer);
        this._blinkTimer = null;
      }
      _blink(false);
    }
    */

    _blink(t);

    return true;
  };

  /**
   * Check next Tab (cycle GUIElement)
   *
   * @return  void
   *
   * @method  Window::_nextTabIndex()
   */
  Window.prototype._nextTabIndex = function() {
    if ( this._guiElement ) {
      if ( this._guiElement.tagName === 'textarea' ) {
        return;
      }
    }

    var found = null;
    var next  = (this._guiElement ? (this._guiElement.tabIndex || -1) : -1) + 1;

    console.debug('Window::_nextTabIndex()', next);
    if ( next <= 0 ) { return; }
    if ( next > this._guiElements.length ) { next = 1; }

    this._guiElements.forEach(function(iter) {
      if ( iter && iter.opts.focusable && iter.tabIndex === next ) {
        found = iter;
        return false;
      }
    });
    console.debug('Window::_nextTabIndex()', found);
    if ( found ) {
      found.focus();
    }
  };

  //
  // Events
  //

  /**
   * On Drag-and-drop event
   *
   * @param   DOMEevent     ev        DOM Event
   * @param   String        type      DnD type
   *
   * @return  boolean                 On success
   *
   * @method  Window::_onDndEvent()
   */
  Window.prototype._onDndEvent = function(ev, type) {
    console.info('OSjs::Core::Window::_onDndEvent()', type);
    if ( this._disabled ) { return false; }
    return true;
  };

  /**
   * On Key event
   *
   * @param   DOMEvent      ev        DOM Event
   * @param   String        type      Key type
   *
   * @return  void
   *
   * @method  Window::_onKeyEvent()
   */
  Window.prototype._onKeyEvent = function(ev, type) {
    if ( ev.keyCode === Utils.Keys.TAB ) {
      this._nextTabIndex();
    }

    if ( type === 'keydown' ) {
      if ( this._guiElement ) {
        this._guiElement.onGlobalKeyPress(ev);
      }
    }
  };

  /**
   * On Window resized
   *
   * @return  void
   * @method  Window::_onResize()
   */
  Window.prototype._onResize = function() {
  };

  /**
   * On Window Icon Click
   *
   * @param   DOMEvent      ev        DOM Event
   * @param   DOMElement    el        DOM Element
   *
   * @return  void
   *
   * @method  Window::_onWindowIconClick()
   */
  Window.prototype._onWindowIconClick = function(ev, el) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_onWindowIconClick()');
    if ( !this._properties.allow_iconmenu ) { return; }

    var self = this;
    var list = [];

    if ( this._properties.allow_minimize ) {
      list.push({
        title:    API._('WINDOW_MINIMIZE'),
        icon:     'actions/stock_up.png',
        onClick:  function(name, iter) {
          self._minimize();
        }
      });
    }
    if ( this._properties.allow_maximize ) {
      list.push({
        title:    API._('WINDOW_MAXIMIZE'),
        icon:     'actions/window_fullscreen.png',
        onClick:  function(name, iter) {
          self._maximize();
          self._focus();
        }
      });
    }
    if ( this._state.maximized ) {
      list.push({
        title:    API._('WINDOW_RESTORE'),
        icon:     'actions/view-restore.png',
        onClick:  function(name, iter) {
          self._restore();
          self._focus();
        }
      });
    }
    if ( this._properties.allow_ontop ) {
      if ( this._state.ontop ) {
        list.push({
          title:    API._('WINDOW_ONTOP_OFF'),
          icon:     'actions/window-new.png',
          onClick:  function(name, iter) {
            self._state.ontop = false;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(false);
            }
            self._focus();
          }
        });
      } else {
        list.push({
          title:    API._('WINDOW_ONTOP_ON'),
          icon:     'actions/window-new.png',
          onClick:  function(name, iter) {
            self._state.ontop = true;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(true);
            }
            self._focus();
          }
        });
      }
    }
    if ( this._properties.allow_close ) {
      list.push({
        title:    API._('WINDOW_CLOSE'),
        icon:     'actions/window-close.png',
        onClick:  function(name, iter) {
          self._close();
        }
      });
    }

    OSjs.API.createMenu(list, {x: ev.clientX, y: ev.clientY});
  };

  /**
   * On Window Button Click
   *
   * @param   DOMEvent      ev        DOM Event
   * @param   DOMElement    el        DOM Element
   * @param   String        btn       Button name
   *
   * @return  void
   *
   * @method  Window::_onWindowButtonClick()
   */
  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    console.debug(this._name, '>' , 'OSjs::Core::Window::_onWindowButtonClick()', btn);

    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };

  /**
   * On Window has changed
   *
   * @param   DOMEvent      ev        DOM Event
   * @param   boolean       byUser    Performed by user?
   *
   * @return  void
   *
   * @method  Window::_onChange()
   */
  Window.prototype._onChange = function(ev, byUser) {
    ev = ev || '';
    if ( ev ) {
      console.debug(this._name, '>' , 'OSjs::Core::Window::_onChange()', ev);
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.eventWindow(ev, this);
      }
    }
  };

  //
  // Getters
  //

  /**
   * Get Window maximized size
   *
   * @return    Object      Size of {left:, top:, right:, bottom: }
   *
   * @method    Window::_getMaximizedSize()
   */
  Window.prototype._getMaximizedSize = function() {
    var s = getWindowSpace();
    if ( !this._$element ) { return s; }
    var topMargin = 23;
    var borderSize = 0;

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var theme = wm.getStyleTheme(true);
      if ( theme && theme.style && theme.style.window ) {
        topMargin = theme.style.window.margin;
        borderSize = theme.style.window.border;
      }
    }

    s.left += borderSize;
    s.top += borderSize;
    s.width -= (borderSize*2);
    s.height -= topMargin + (borderSize*2);

    return s;
  };

  /**
   * Get Window position in DOM
   *
   * @see OSjs.Utils.$position()
   *
   * @method  Window::_getViewRect()
   */
  Window.prototype._getViewRect = function() {
    return this._$element ? Utils.$position(this._$element) : null;
  };

  /**
   * Get Window main DOM element
   *
   * @return  DOMElement
   *
   * @method  Window::_getRoot()
   */
  Window.prototype._getRoot = function() {
    return this._$root;
  };

  /**
   * Get a GUIElement by name
   *
   * @param   String      n     GUIElement name
   *
   * @return  GUIElement        Element if found or 'null'
   */
  Window.prototype._getGUIElement = function(n) {
    var result = null;
    this._guiElements.forEach(function(iter, i) {
      if (iter && (iter.id === n || iter.name === n) ) {
        result = iter;
        return false;
      }
      return true;
    });
    return result;
  };

  /**
   * Get Window z-index
   *
   * @return    int
   *
   * @method    Window::_getZindex()
   */
  Window.prototype._getZindex = function() {
    if ( this._$element ) {
      return parseInt(this._$element.style.zIndex, 10);
    }
    return -1;
  };

  /**
   * Set Window title
   *
   * @param   String      t     Title
   *
   * @return  void
   *
   * @method  Window::_setTitle()
   */
  Window.prototype._setTitle = function(t) {
    if ( !this._$element ) { return; }
    var tel = this._$element.getElementsByClassName('WindowTitle')[0];
    if ( tel ) {
      tel.innerHTML = '';
      tel.appendChild(document.createTextNode(t));
    }
    this._title = t;
    this._onChange('title');
  };

  /**
   * Set Windoc icon
   *
   * @param   String      i     Icon path
   *
   * @return  void
   *
   * @method  Window::_setIcon()
   */
  Window.prototype._setIcon = function(i) {
    if ( this._$winicon ) {
      this._$winicon.src = i;
    }
    this._icon = i;
    this._onChange('icon');
  };

  /**
   * Set Window warning message (Displays as a popup inside window)
   *
   * @param   String      message       Warning message
   */
  Window.prototype._setWarning = function(message) {
    var self = this;
    if ( this._$warning ) {
      if ( this._$warning.parentNode ) {
        this._$warning.parentNode.removeChild(this._$warning);
      }
      this._$warning = null;
    }

    if ( message === null ) { return; }
    message = message || '';

    var container = document.createElement('div');
    container.className = 'WindowWarning';

    var close = document.createElement('div');
    close.className = 'Close';
    close.innerHTML = 'X';
    close.addEventListener('click', function() {
      self._setWarning(null);
    });

    var msg = document.createElement('div');
    msg.className = 'Message';
    msg.appendChild(document.createTextNode(message));

    container.appendChild(close);
    container.appendChild(msg);
    this._$warning = container;
    this._$root.appendChild(this._$warning);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Window = Window;

})(OSjs.Utils, OSjs.API, OSjs.Core.Process);
