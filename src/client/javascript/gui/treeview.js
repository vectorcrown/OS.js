/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
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

  function createEntry(e) {
    var entry = GUI.Helpers.createElement('gui-tree-view-entry', e, ['entries']);
    return entry;
  }

  function handleItemExpand(ev, el, root, expanded) {
    if ( typeof expanded === 'undefined' ) {
      expanded = !Utils.$hasClass(root, 'gui-expanded');
    }

    Utils.$removeClass(root, 'gui-expanded');
    if ( expanded ) {
      Utils.$addClass(root, 'gui-expanded');
    }

    var children = root.children;
    for ( var i = 0; i < children.length; i++ ) {
      if ( children[i].tagName.toLowerCase() === 'gui-tree-view-entry' ) {
        children[i].style.display = expanded ? 'block' : 'none';
      }
    }

    var selected = {
      index: Utils.$index(root),
      data: GUI.Helpers.getViewNodeValue(root)
    };

    root.setAttribute('data-expanded', String(expanded));
    root.setAttribute('aria-expanded', String(expanded));

    el.dispatchEvent(new CustomEvent('_expand', {detail: {entries: [selected], expanded: expanded, element: root}}));
  } // handleItemExpand()

  function initEntry(el, sel) {
    if ( sel._rendered ) {
      return;
    }
    sel._rendered = true;

    var icon = sel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(sel);
    var expanded = el.getAttribute('data-expanded') === 'true';
    var next = sel.querySelector('gui-tree-view-entry');
    var container = document.createElement('div');
    var dspan = document.createElement('span');

    function onDndEnter(ev) {
      ev.stopPropagation();
      Utils.$addClass(sel, 'dnd-over');
    }

    function onDndLeave(ev) {
      Utils.$removeClass(sel, 'dnd-over');
    }

    if ( icon ) {
      dspan.style.backgroundImage = 'url(' + icon + ')';
      Utils.$addClass(dspan, 'gui-has-image');
    }
    dspan.appendChild(document.createTextNode(label));

    container.appendChild(dspan);

    if ( next ) {
      Utils.$addClass(sel, 'gui-expandable');
      var expander = document.createElement('gui-tree-view-expander');
      sel.insertBefore(container, next);
      sel.insertBefore(expander, container);
    } else {
      sel.appendChild(container);
    }

    if ( String(sel.getAttribute('data-draggable')) === 'true' ) {
      GUI.Helpers.createDraggable(container, (function() {
        var data = {};
        try {
          data = JSON.parse(sel.getAttribute('data-value'));
        } catch ( e ) {}

        return {data: data};
      })());
    }

    if ( String(sel.getAttribute('data-droppable')) === 'true' ) {
      var timeout;
      GUI.Helpers.createDroppable(container, {
        onEnter: onDndEnter,
        onOver: onDndEnter,
        onLeave: onDndLeave,
        onDrop: onDndLeave,
        onItemDropped: function(ev, eel, item) {
          ev.stopPropagation();
          ev.preventDefault();

          timeout = clearTimeout(timeout);
          timeout = setTimeout(function() {
            Utils.$removeClass(sel, 'dnd-over');
          }, 10);

          var dval = {};
          try {
            dval = JSON.parse(eel.parentNode.getAttribute('data-value'));
          } catch ( e ) {}

          el.dispatchEvent(new CustomEvent('_drop', {detail: {
            src: item.data,
            dest: dval
          }}));
        }
      });
    }

    handleItemExpand(null, el, sel, expanded);

    GUI.Elements._dataview.bindEntryEvents(el, sel, 'gui-tree-view-entry');
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-tree-view'
   *
   * A tree view for nested content
   *
   * For more properties and events etc, see 'dataview'
   *
   * @example
   *
   *   .add({
   *      label: "Label",
   *      icon: "Optional icon path",
   *      value: "something or JSON or whatever",
   *      entries: [] // Recurse :)
   *   })
   *
   * @constructs OSjs.GUI.DataView
   * @memberof OSjs.GUI.Elements
   * @var gui-tree-view
   */
  GUI.Elements['gui-tree-view'] = {
    bind: GUI.Elements._dataview.bind,

    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-tree-view-entry'));
    },

    build: function(el, applyArgs) {
      var body = el.querySelector('gui-tree-view-body');
      var found = !!body;

      if ( !body ) {
        body = document.createElement('gui-tree-view-body');
        el.appendChild(body);
      }

      body.setAttribute('role', 'group');
      el.setAttribute('role', 'tree');
      el.setAttribute('aria-multiselectable', body.getAttribute('data-multiselect') || 'false');

      el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {
        sel.setAttribute('aria-expanded', 'false');

        if ( !found ) {
          body.appendChild(sel);
        }

        sel.setAttribute('role', 'treeitem');
        initEntry(el, sel);
      });

      GUI.Elements._dataview.build(el, applyArgs);
    },

    get: function(el, param, value, arg) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-tree-view-body');
        return GUI.Elements._dataview.getEntry(el, body.querySelectorAll('gui-tree-view-entry'), value, arg);
      }
      return GUI.Helpers.getProperty(el, param);
    },

    set: function(el, param, value, arg, arg2) {
      var body = el.querySelector('gui-tree-view-body');
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-tree-view-entry'), value, arg, arg2);
        return true;
      }

      return false;
    },

    call: function(el, method, args) {
      var body = el.querySelector('gui-tree-view-body');

      function recurse(a, root, level) {
        GUI.Elements._dataview.add(el, a, function(e) {
          if ( e ) {
            if ( e.parentNode ) {
              delete e.parentNode;
            }

            var entry = createEntry(e);
            root.appendChild(entry);

            if ( e.entries ) {
              recurse([e.entries], entry, level + 1);
            }

            initEntry(el, entry);
          }
        });
      }

      function add() {
        var parentNode = body;
        var entries = args;

        if ( typeof args[0] === 'object' && !(args[0] instanceof Array) && Object.keys(args[0]).length ) {
          entries = [args[0].entries || []];
          parentNode = args[0].parentNode || body;
        }

        recurse(entries, parentNode, 0);
      }

      if ( method === 'add' ) {
        add();
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-tree-view-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, body);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-tree-view-entry', body, createEntry, initEntry);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      } else if ( method === 'expand' ) {
        handleItemExpand(args.ev, el, args.entry);
      }
      return this;
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
