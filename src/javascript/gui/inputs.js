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
(function(API, Utils, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createInputOfType(el, type) {
    var group = el.getAttribute('data-group');
    var placeholder = el.getAttribute('data-placeholder');
    var disabled = el.getAttribute('data-disabled') !== null;
    var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
    Utils.$empty(el);

    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    var attribs = {
      value: null,
      type: type,
      tabindex: -1, // TODO
      placeholder: placeholder,
      disabled: disabled ? 'disabled' : null,
      name: group ? group + '[]' : null
    };

    if ( type === 'range' || type === 'slider' ) {
      attribs.min = el.getAttribute('data-min');
      attribs.max = el.getAttribute('data-max');
      attribs.step = el.getAttribute('data-step');
    } else if ( type === 'text' || type === 'password' || type === 'textarea' ) {
      attribs.value = value || '';

      Utils.$bind(input, 'keydown', function(ev) {
        if ( ev.keyCode === Utils.Keys.ENTER ) {
          input.dispatchEvent(new CustomEvent('_enter', {detail: this.value}));
        }
      }, false);
    }

    Object.keys(attribs).forEach(function(a) {
      if ( attribs[a] !== null ) {
        input.setAttribute(a, attribs[a]);
      }
    });

    GUI.Helpers.createInputLabel(el, type, input);

    Utils.$bind(input, 'change', function(ev) {
      var value = input.value;
      if ( type === 'radio' || type === 'checkbox' ) {
        //value = input.getAttribute('checked') === 'checked';
        value = input.value === 'on';
      }
      input.dispatchEvent(new CustomEvent('_change', {detail: value}));
    }, false);
  }

  function addToSelectBox(el, entries) {
    var target = el.querySelector('select');
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }

    entries.forEach(function(e) {
      var opt = document.createElement('option');
      opt.setAttribute('value', e.value);
      opt.appendChild(document.createTextNode(e.label));

      target.appendChild(opt);
    });
  }

  function removeFromSelectBox(el, what) {
    var target = el.querySelector('select');
    target.querySelectorAll('option').forEach(function(opt) {
      if ( opt == what ) {
        Utils.$remove(opt);
        return false;
      }
      return true;
    });
  }

  function clearSelectBox(el) {
    var target = el.querySelector('select');
    Utils.$empty(target);
  }

  function createSelectInput(el, multiple) {
    var disabled = el.getAttribute('data-disabled') !== null;
    var selected = el.getAttribute('data-selected');

    var select = document.createElement('select');
    if ( multiple ) {
      select.setAttribute('size', el.getAttribute('data-size') || 2);
      multiple = el.getAttribute('data-multiple') === 'true';
    }

    if ( multiple ) {
      select.setAttribute('multiple', 'multiple');
    }
    if ( disabled ) {
      select.setAttribute('disabled', 'disabled');
    }
    if ( selected !== null ) {
      select.selectedIndex = selected;
    }

    el.querySelectorAll('gui-select-option').forEach(function(sel) {
      var value = sel.getAttribute('data-value') || '';
      var label = sel.childNodes.length ? sel.childNodes[0].nodeValue : '';

      var option = document.createElement('option');
      option.setAttribute('value', value);
      option.appendChild(document.createTextNode(label));
      if ( sel.getAttribute('selected') ) {
        option.setAttribute('selected', 'selected');
      }
      select.appendChild(option);
      sel.parentNode.removeChild(sel);
    });

    Utils.$bind(select, 'change', function(ev) {
      select.dispatchEvent(new CustomEvent('_change', {detail: select.value}));
    }, false);

    el.appendChild(select);
  }

  function bindInputEvents(el, evName, callback, params) {
    if ( evName === 'change' ) { evName = '_change'; }

    var target = el.querySelector('textarea, input, select');
    Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
  }

  function bindTextInputEvents(el, evName, callback, params) {
    if ( evName === 'enter' ) { evName = '_enter'; }
    else if ( evName === 'change' ) { evName = '_change'; }

    var target = el.querySelector('input');
    Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
  }

  function setSwitchValue(val, input, button) {
    if ( val !== true ) {
      input.removeAttribute('checked', 'checked');
      Utils.$removeClass(button, 'gui-active');
      button.innerHTML = '0';
    } else {
      input.setAttribute('checked', 'checked');
      Utils.$addClass(button, 'gui-active');
      button.innerHTML = '1';
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  GUI.Elements['gui-label'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' ) {
        var lbl = el.querySelector('label');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var label = GUI.Helpers.getValueLabel(el, true);
      var lbl = document.createElement('label');
      lbl.appendChild(document.createTextNode(label));
      el.appendChild(lbl);
    }
  };

  GUI.Elements['gui-textarea'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'textarea');
    }
  };

  GUI.Elements['gui-text'] = {
    bind: bindTextInputEvents,
    build: function(el) {
      createInputOfType(el, 'text');
    }
  };

  GUI.Elements['gui-password'] = {
    bind: bindTextInputEvents,
    build: function(el) {
      createInputOfType(el, 'password');
    }
  };

  GUI.Elements['gui-file-upload'] = {
    bind: bindInputEvents,
    build: function(el) {
      var input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.onchange = function(ev) {
        input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
      };
      el.appendChild(input);
    }
  },

  GUI.Elements['gui-radio'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'radio');
    }
  };

  GUI.Elements['gui-checkbox'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'checkbox');
    }
  };

  GUI.Elements['gui-switch'] = {
    bind: bindInputEvents,
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        var button = el.querySelector('button');

        setSwitchValue(value, input, button);
        return true;
      }
      return false;
    },

    build: function(el) {
      var input = document.createElement('input');
      input.type = 'checkbox';
      el.appendChild(input);

      var inner = document.createElement('div');

      var button = document.createElement('button');
      inner.appendChild(button);
      GUI.Helpers.createInputLabel(el, 'switch', inner);

      var val = false;
      function toggleValue(v) {
        if ( typeof v === 'undefined' ) {
          val = !val;
        } else {
          val = v;
        }

        setSwitchValue(val, input, button);
      }

      Utils.$bind(el, 'click', function() {
        var disabled = el.getAttribute('data-disabled') !== null;
        if ( !disabled ) {
          toggleValue();
        }
      }, false);

      toggleValue(false);
    }
  };

  GUI.Elements['gui-button'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' ) {
        var lbl = el.querySelector('button');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        return true;
      }
      return false;
    },
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('button');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var icon = el.getAttribute('data-icon');
      var disabled = el.getAttribute('data-disabled') !== null;
      var label = GUI.Helpers.getValueLabel(el);

      var input = document.createElement('button');
      if ( label ) {
        Utils.$addClass(el, 'gui-has-label');
      }

      input.appendChild(document.createTextNode(label));
      if ( disabled ) {
        input.setAttribute('disabled', 'disabled');
      }

      if ( icon ) {
        var img = document.createElement('img');
        img.src = icon;
        if ( input.firstChild ) {
          input.insertBefore(img, input.firstChild);
        } else {
          input.appendChild(img);
        }
        Utils.$addClass(el, 'gui-has-image');
      }

      el.appendChild(input);
    }
  };

  GUI.Elements['gui-select'] = {
    bind: bindInputEvents,
    build: function(el) {
      createSelectInput(el);
    },
    call: function(el, method, args) {
      if ( method === 'add' ) {
        addToSelectBox(el, args[0]);
      } else if ( method === 'remove' ) {
        removeFromSelectBox(el, args[0]);
      } else if ( method === 'clear' ) {
        clearSelectBox(el);
      }
    }
  };

  GUI.Elements['gui-select-list'] = {
    bind: bindInputEvents,
    build: function(el) {
      createSelectInput(el, true);
    },
    call: function(el, method, args) {
      if ( method === 'add' ) {
        addToSelectBox(el, args[0]);
      } else if ( method === 'remove' ) {
        removeFromSelectBox(el, args[0]);
      } else if ( method === 'clear' ) {
        clearSelectBox(el);
      }
    }
  };

  GUI.Elements['gui-slider'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'range');
    }
  };

  GUI.Elements['gui-input-modal'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'open' ) { evName = '_open'; }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    get: function(el, param) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        return input.value;
      }
      return false;
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        input.value = value;
        return true;
      }
      return false;
    },
    build: function(el) {
      var container = document.createElement('div');

      var input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('disabled', 'disabled');

      var button = document.createElement('button');
      button.innerHTML = '...';

      Utils.$bind(button, 'click', function(ev) {
        el.dispatchEvent(new CustomEvent('_open', {detail: select.value}));
      }, false);

      container.appendChild(input);
      container.appendChild(button);
      el.appendChild(container);
    }
  };


})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
