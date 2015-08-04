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
(function(API, Utils, VFS) {
  'use strict';

  window.OSjs = window.OSjs || {};
  OSjs.API = OSjs.API || {};

  OSjs.GUI = OSjs.GUI || {};
  OSjs.GUI.Elements = OSjs.GUI.Elements || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Gets window id from upper parent element
   *
   * @param   DOMElement      el      Child element (can be anything)
   *
   * @return  int
   *
   * @api OSjs.GUI.Helpers.getWindowId()
   */
  function getWindowId(el) {
    while ( el.parentNode ) {
      var attr = el.getAttribute('data-window-id');
      if ( attr !== null ) {
        return parseInt(attr, 10);
      }
      el = el.parentNode;
    }
    return null;
  }

  /**
   * Gets "label" from a node
   *
   * @param   DOMElement      el      The element
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getLabel()
   */
  function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  }

  /**
   * Gets "label" from a node (Where it can be innerHTML and parameter)
   *
   * @param   DOMElement      el      The element
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getValueLabel()
   */
  function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;

    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }

    return label || '';
  }

  /**
   * Gets "value" from a node
   *
   * @param   DOMElement      el       The element
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getViewNodeValue()
   */
  function getViewNodeValue(el) {
    var value = el.getAttribute('data-value');
    try {
      value = JSON.parse(value);
    } catch ( e ) {
      value = null;
    }
    return value;
  }

  /**
   * Internal for getting
   *
   * @param   DOMElement          el      Element
   * @param   OSjs.Core.Window    win     (optional) Window Reference
   *
   * @return  String
   *
   * @api OSjs.GUI.Helpers.getIcon()
   */
  function getIcon(el, win) {
    var image = el.getAttribute('data-icon');

    if ( image ) {
      if ( image.match(/^stock:\/\//) ) {
        image = image.replace('stock://', '');

        var size  = '16x16';
        try {
          var spl = image.split('/');
          var tmp = spl.shift();
          var siz = tmp.match(/^\d+x\d+/);
          if ( siz ) {
            size = siz[0];
            image = spl.join('/');
          }

          image = API.getIcon(image, size);
        } catch ( e ) {}
      } else if ( image.match(/^app:\/\//) ) {
        image = API.getApplicationResource(win._app, image.replace('app://', ''));
      }
    }

    return image;
  }

  /**
   * Internal for parsing GUI elements
   */
  function parseDynamic(scheme, node, win) {
    // TODO: Support application locales! :)
    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = API._(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });

    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });

    node.querySelectorAll('*[data-icon]').forEach(function(el) {
      var image = getIcon(el, win);
      el.setAttribute('data-icon', image);
    });
  }

  /**
   * Wrapper for getting custom dom element property value
   *
   * @param   DOMElement      el      Element
   * @param   String          param   Parameter name
   * @param   String          tagName (Optional) What tagname is in use? Automatic
   *
   * @api OSjs.GUI.Helpers.getProperty()
   *
   * @return  Mixed
   */
  function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    var isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);

    if ( param === 'value' && !isDataView) {
      if ( (['gui-text', 'gui-password', 'gui-textarea']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input, textarea').value;
      }
      if ( (['gui-checkbox', 'gui-radio']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input').value === 'on';
      }
      return null;
    }

    if ( (param === 'value' || param === 'selected') && isDataView ) {
      return OSjs.GUI.Elements[tagName].values(el);
    }

    return el.getAttribute('data-' + param);
  }

  /**
   * Wrapper for setting custom dom element property value
   *
   * @param   DOMElement      el      Element
   * @param   String          param   Parameter name
   * @param   Mixed           value   Parameter value
   * @param   String          tagName (Optional) What tagname is in use? Automatic
   *
   * @api OSjs.GUI.Helpers.setProperty()
   *
   * @return  void
   */
  function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();

    function _setInputProperty() {
      var firstChild = el.querySelector('textarea, input, select, button');

      if ( param === 'value' ) {
        if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
          if ( value ) {
            firstChild.setAttribute('checked', 'checked');
          } else {
            firstChild.removeAttribute('checked');
          }
        }

        firstChild.value = value;
        return;
      } else if ( param === 'disabled' ) {
        if ( value ) {
          firstChild.setAttribute('disabled', 'disabled');
        } else {
          firstChild.removeAttribute('disabled');
        }
        return;
      }

      firstChild.setAttribute(param, value || '');
    }

    function _setElementProperty() {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + param, value);
    }

    function _createInputLabel() {
      if ( param === 'label' ) {
        var firstChild = el.querySelector('textarea, input, select');
        el.appendChild(firstChild);
        Utils.$remove(el.querySelector('label'));
        createInputLabel(el, tagName.replace(/^gui\-/, ''), firstChild, value);
      }
    }

    // Generics for input elements
    var firstChild = el.children[0];
    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    if ( accept.indexOf(tagName) >= 0 ) {
      _setInputProperty();
      _createInputLabel();
    }

    // Other types of elements
    accept = ['gui-image', 'gui-audio', 'gui-video'];
    if ( (['src', 'controls', 'autoplay', 'alt']).indexOf(param) >= 0 && accept.indexOf(tagName) >= 0 ) {
      firstChild[param] = value;
    }

    // Normal DOM attributes
    if ( (['_id', '_class', '_style']).indexOf(param) >= 0 ) {
      firstChild.setAttribute(param.replace(/^_/, ''), value);
      return;
    }

    // Set the actual root element property value
    if ( param !== 'value' ) {
      _setElementProperty();
    }
  }

  /**
   * Creates a label for given input element
   *
   * @param   DOMEelement     el        Element root
   * @param   String          type      Input element type
   * @param   DOMElement      input     The input element
   * @param   String          label     (Optional) Used when updating
   *
   * @return  void
   *
   * @api OSjs.GUI.Helpers.createInputLabel()
   */
  function createInputLabel(el, type, input, label) {
    label = label || getLabel(el);

    if ( label ) {
      var lbl = document.createElement('label');
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));

      if ( type === 'checkbox' || type === 'radio' ) {
        lbl.appendChild(input);
        lbl.appendChild(span);
      } else {
        lbl.appendChild(span);
        lbl.appendChild(input);
      }
      el.appendChild(lbl);
    } else {
      el.appendChild(input);
    }
  }

  /**
   * Create a new custom DOM element
   *
   * @param   String      tagName     Tag Name
   * @param   Object      params      Dict with data-* properties
   *
   * @return  DOMElement
   */
  function createElement(tagName, params) {
    var el = document.createElement(tagName);

    var classMap = {
      textalign: function(v) {
        Utils.$addClass(el, 'gui-align-' + v);
      }
    };

    if ( typeof params === 'object' ) {
      Object.keys(params).forEach(function(k) {
        var value = params[k];
        if ( classMap[k] ) {
          classMap[k](value);
          return;
        }

        if ( typeof value === 'boolean' ) {
          value = value ? 'true' : 'false';
        } else if ( typeof value === 'object' ) {
          try {
            value = JSON.stringify(value);
          } catch ( e ) {}
        }
        el.setAttribute('data-' + k, value);
      });
    }

    return el;
  }

  /**
   * Sets the flexbox CSS style properties for given container
   *
   * @param   DOMElement      el              The container
   * @param   int             grow            Grow factor
   * @param   int             shrink          Shrink factor
   * @param   String          basis           (Optional: basis, default=auto)
   * @param   DOMElement      checkel         (Optional: take defaults from this node)
   *
   * @api OSjs.GUI.Helpers.setFlexbox()
   */
  function setFlexbox(el, grow, shrink, basis, checkel) {
    checkel = checkel || el;
    if ( typeof basis === 'undefined' || basis === null ) {
      basis = checkel.getAttribute('data-basis') || 'auto';
    }
    if ( typeof grow === 'undefined' || grow === null ) {
      grow = checkel.getAttribute('data-grow') || 0;
    }
    if ( typeof shrink === 'undefined' || shrink === null ) {
      shrink = checkel.getAttribute('data-shrink') || 0;
    }

    var flex = [grow, shrink];
    if ( basis.length ) {
      flex.push(basis);
    }

    var style = flex.join(' ');
    el.style['webkitFlex'] = style;
    el.style['mozFflex'] = style;
    el.style['msFflex'] = style;
    el.style['oFlex'] = style;
    el.style['flex'] = style;

    var align = el.getAttribute('data-align');
    if ( align ) {
      el.style.alignSelf = align.match(/start|end/) ? 'flex-' + align : align;
    }
  }

  /**
   * Wrapper for creating a draggable container
   *
   * @param   DOMElement        el          The container
   * @param   Function          onDown      On down action callback
   * @param   Function          onMove      On move action callback
   * @param   Function          onUp        On up action callback
   *
   * @api OSjs.GUI.Helpers.createDrag()
   */
  function createDrag(el, onDown, onMove, onUp) {
    onDown = onDown || function() {};
    onMove = onMove || function() {};
    onUp = onUp || function() {};

    var startX, startY;
    var dragging = false;

    function _onMouseDown(ev) {
      ev.preventDefault();

      startX = ev.clientX;
      startY = ev.clientY;

      onDown(ev);
      dragging = true;

      Utils.$bind(window, 'mouseup', _onMouseUp, false);
      Utils.$bind(window, 'mousemove', _onMouseMove, false);
    }

    function _onMouseMove(ev) {
      ev.preventDefault();

      if ( dragging ) {
        var diffX = ev.clientX - startX;
        var diffY = ev.clientY - startY;
        onMove(ev, diffX, diffX);
      }
    }

    function _onMouseUp(ev) {
      onUp(ev);
      dragging = false;

      Utils.$unbind(window, 'mouseup', _onMouseUp, false);
      Utils.$unbind(window, 'mousemove', _onMouseMove, false);
    }

    Utils.$bind(el, 'mousedown', _onMouseDown, false);
  }

  function addChildren(frag, root) {
    if ( frag ) {
      var children = frag.children;
      var i = 0;
      while ( children.length && i < 10000 ) {
        root.appendChild(children[0]);
        i++;
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // UIELEMENT CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Base UIElement Class
   *
   * @api OSjs.GUI.UIElement()
   * @class
   */
  function UIElement(el, q) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
    this.oldDisplay = null;

    if ( !el ) {
      console.error('UIElement() was constructed without a DOM element', q);
    }
  }

  UIElement.prototype.blur = function() {
    // TODO: For more elements
    if ( this.$element ) {
      var firstChild = this.$element.querySelector('input');
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  };

  UIElement.prototype.focus = function() {
    // TODO: For more elements
    if ( this.$element ) {
      var firstChild = this.$element.firstChild || this.$element; //this.$element.querySelector('input');
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  };

  UIElement.prototype.show = function() {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].show ) {
      OSjs.GUI.Elements[this.tagName].show.apply(this, arguments);
    } else {
      if ( this.$element ) {
        this.$element.style.display = this.oldDisplay || '';
      }
    }
    return this;
  };

  UIElement.prototype.hide = function() {
    if ( this.$element ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  };

  UIElement.prototype.on = function(evName, callback, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].bind ) {
      OSjs.GUI.Elements[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };

  UIElement.prototype.set = function(param, value, arg) {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].set ) {
        if ( OSjs.GUI.Elements[this.tagName].set(this.$element, param, value, arg) === true ) {
          return this;
        }
      }

      setProperty(this.$element, param, value, arg);
    }
    return this;
  };

  UIElement.prototype.get = function(param) {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].get ) {
        return OSjs.GUI.Elements[this.tagName].get(this.$element, param);
      } else {
        return getProperty(this.$element, param);
      }
    }
    return null;
  };

  UIElement.prototype.append = function(el) {
    if ( el instanceof UIElement ) {
      el = el.$element;
    }
    this.$element.appendChild(el);
  };

  /**
   * Extended UIElement for ListView, TreeView, IconView, Select, SelectList
   * @extends UIElement
   * @api OSjs.GUI.UIElementDataView()
   * @class
   */
  function UIElementDataView() {
    UIElement.apply(this, arguments);
  }

  UIElementDataView.prototype = Object.create(UIElement.prototype);
  UIElementDataView.constructor = UIElement;

  UIElementDataView.prototype._call = function(method, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].call ) {
      var cargs = ([this.$element, method, args]);//.concat(args);
      OSjs.GUI.Elements[this.tagName].call.apply(this, cargs);
    }
    return this;
  };

  UIElementDataView.prototype.clear = function() {
    return this._call('clear', []);
  };

  UIElementDataView.prototype.add = function(props) {
    return this._call('add', [props]);
  };

  UIElementDataView.prototype.patch = function(props) {
    return this._call('patch', [props]);
  };

  UIElementDataView.prototype.remove = function(id, key) {
    return this._call('remove', [id, key]);
  };

  /////////////////////////////////////////////////////////////////////////////
  // UISCHEME CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * The class for loading and parsing UI Schemes
   *
   * @api   OSjs.GUI.UIScheme
   *
   * @class
   */
  function UIScheme(url) {
    this.url = url;
    this.scheme = null;
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(html) {
        var doc = document.createDocumentFragment();
        var wrapper = document.createElement('div');
        wrapper.innerHTML = Utils.cleanHTML(html);
        doc.appendChild(wrapper);
        self.scheme = doc;

        cb(false, doc);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.getFragment = function(id, type) {
    var content = null;
    if ( id ) {
      if ( type ) {
        content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
      } else {
        content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                  this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
      }
    }
    return content;
  };

  UIScheme.prototype.parse = function(id, type, win, onparse) {
    var self = this;
    var content = this.getFragment(id, type);

    type = type || content.tagName.toLowerCase();
    onparse = onparse || function() {};

    if ( content ) {
      var node = content.cloneNode(true);

      // Apply a default className to non-containers
      node.querySelectorAll('*').forEach(function(el) {
        var lcase = el.tagName.toLowerCase();
        if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|toolbar|button\-bar)$/) ) {
          Utils.$addClass(el, 'gui-element');
        }
      });

      // Resolve fragment includes before dynamic rendering
      var resolving = true;
      var nodes;
      while ( resolving ) {
        nodes = node.querySelectorAll('gui-fragment');
        if ( nodes.length ) {
          nodes.forEach(function(el) {
            var id = el.getAttribute('data-fragment-id');
            var frag = self.getFragment(id, 'application-fragment');
            addChildren(frag, el.parentNode);
            Utils.$remove(el);
          });
        } else {
          resolving = false;
        }
      }

      // Go ahead and parse dynamic elements (like labels)
      parseDynamic(this, node, win);

      onparse(node);

      // Lastly render elements
      Object.keys(OSjs.GUI.Elements).forEach(function(key) {
        node.querySelectorAll(key).forEach(function(pel) {
          try {
            OSjs.GUI.Elements[key].build(pel);
          } catch ( e ) {
            console.warn('UIScheme::parse()', id, type, win, 'exception');
            console.warn(e, e.stack);
          }
        });
      });

      return node;
    }

    return null;
  };

  UIScheme.prototype.render = function(win, id, root, type, onparse) {
    root = root || win._getRoot();
    if ( root instanceof UIElement ) {
      root = root.$element;
    }

    var content = this.parse(id, type, win, onparse);
    addChildren(content, root);
  };

  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win.getRoot();

    var el = createElement(tagName, params);
    parentNode.appendChild(el);
    OSjs.GUI.Elements[tagName].build(el, applyArgs, win);

    return new UIElement(el);
  };

  UIScheme.prototype.find = function(win, id, root) {
    root = root || win._getRoot();
    var q = '[data-id="' + id + '"]';
    return this.get(root.querySelector(q), q);
  };

  UIScheme.prototype.get = function(el, q) {
    if ( el ) {
      var tagName = el.tagName.toLowerCase();
      if ( tagName.match(/^gui\-(list|tree|icon|file)\-view$/) || tagName.match(/^gui\-select/) ) {
        return new UIElementDataView(el, q);
      }
    }
    return new UIElement(el, q);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Element = UIElement;
  OSjs.GUI.ElementDataView = UIElementDataView;
  OSjs.GUI.Scheme = UIScheme;
  OSjs.GUI.Helpers = {
    getValueLabel: getValueLabel,
    getViewNodeValue: getViewNodeValue,
    getLabel: getLabel,
    getIcon: getIcon,
    getWindowId: getWindowId,
    createInputLabel: createInputLabel,
    createElement: createElement,
    createDrag: createDrag,
    setProperty: setProperty,
    setFlexbox: setFlexbox
  };

  /**
   * Shortcut for creating a new UIScheme class
   *
   * @param String    url     URL to scheme file
   * @return UIScheme
   * @api OSjs.GUI.createScheme()
   */
  OSjs.GUI.createScheme = function(url) {
    return new UIScheme(url);
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
