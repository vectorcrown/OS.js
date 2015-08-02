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

  //////////////////////////////////////////////////////////////////////
  //                                                                  //
  //                         !!! WARNING !!!                          //
  //                                                                  //
  // THIS IS HIGHLY EXPERIMENTAL, BUT WILL BECOME THE NEXT GENERATION //
  // GUI SYSTEM: https://github.com/andersevenrud/OS.js-v2/issues/136 //
  //                                                                  //
  //////////////////////////////////////////////////////////////////////

  window.OSjs = window.OSjs || {};
  OSjs.API = OSjs.API || {};

  OSjs.GUI = OSjs.GUI || {};
  OSjs.GUI.Elements = OSjs.GUI.Elements || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

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

  function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  }

  function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;

    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }

    return label || '';
  }

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

  function parseDynamic(node, win) {
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

  function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    var isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);

    if ( param === 'value' || (isDataView && param === 'selected') ) {
      var firstChild;
      if ( tagName.match(/^gui\-(text|password|textarea)$/) ) {
        firstChild = el.querySelector('input');
        if ( tagName === 'gui-textarea' ) {
          firstChild = el.querySelector('textarea');
        }
        if ( firstChild ) {
          return firstChild[param];
        }
      } else if ( tagName.match(/^gui\-(checkbox|radio)$/) ) {
        firstChild = el.querySelector('input');
        if ( firstChild ) {
          return firstChild.value === 'on';
          //return firstChild.getAttribute('checked') === 'checked';
        }
      } else if ( isDataView ) {
        return OSjs.GUI.Elements[tagName].values(el);
      }

      return null;
    }
    return el.getAttribute('data-' + param);
  }

  function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();

    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    var firstChild = el.children[0];
    if ( accept.indexOf(tagName) >= 0 ) {
      if ( param === 'value' ) {
        if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
          if ( value ) {
            firstChild.setAttribute('checked', 'checked');
          } else {
            firstChild.removeAttribute('checked');
          }
        } else {
          firstChild[param] = value;
        }
      } else if ( param === 'placeholder' ) {
        firstChild.setAttribute('placeholder', value || '');
      } else if ( param === 'disabled' ) {
        if ( value ) {
          firstChild.setAttribute('disabled', 'disabled');
        } else {
          firstChild.removeAttribute('disabled');
        }
      }
    }

    if ( param !== 'value' ) {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + param, value);
    }

    if ( param === 'src' && tagName === 'gui-image' ) {
      firstChild.setAttribute('src', value);
    }
  }

  function createElement(tagName, params) {
    var el = document.createElement(tagName);
    Object.keys(params).forEach(function(k) {
      var value = params[k];
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + k, value);
    });
    return el;
  }

  function scrollIntoView(el, element) {
    var pos = Utils.$position(element, el);
    if ( pos !== null && 
         (pos.top > (el.scrollTop + el.offsetHeight) || 
         (pos.top < el.scrollTop)) ) {
      el.scrollTop = pos.top;
    }
  }

  function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
    root = root || item.parentNode;

    if ( !multipleSelect || !ev.shiftKey ) {
      root.querySelectorAll(className).forEach(function(i) {
        Utils.$removeClass(i, 'gui-active');
      });
      selected = [];
    }

    var findex = selected.indexOf(idx);
    if ( findex >= 0 ) {
      selected.splice(findex, 1);
      Utils.$removeClass(item, 'gui-active');
    } else {
      selected.push(idx);
      Utils.$addClass(item, 'gui-active');
    }

    return selected;
  }

  function setFlexbox(el, grow, shrink, defaultGrow, defaultShrink, checkEl) {
    var basis = (checkEl || el).getAttribute('data-basis') || 'auto';
    var align = el.getAttribute('data-align');

    var tmp;
    if ( typeof grow === 'undefined' || grow === null ) {
      tmp = (checkEl || el).getAttribute('data-grow');
      if ( tmp === null ) {
        grow = typeof defaultGrow === 'undefined' ? 0 : defaultGrow;
      } else {
        grow = parseInt(tmp, 10) || 0;
      }
    } else {
      grow = basis === 'auto' ? 1 : grow;
    }

    if ( typeof shrink === 'undefined' || shrink === null ) {
      tmp = (checkEl || el).getAttribute('data-shrink');
      if ( tmp === null ) {
        shrink = typeof defaultShrink === 'undefined' ? 0 : defaultShrink;
      } else {
        shrink = parseInt(tmp, 10) || 0;
      }
    } else {
      shrink = basis === 'auto' ? 1 : shrink;
    }

    var flex = Utils.format('{0} {1} {2}', grow.toString(), shrink.toString(), basis);
    el.style['webkitFlex'] = flex;
    el.style['mozFflex'] = flex;
    el.style['msFflex'] = flex;
    el.style['oFlex'] = flex;
    el.style['flex'] = flex;

    if ( align ) {
      el.style.alignSelf = align.match(/start|end/) ? 'flex-' + align : align;
    }
  }

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

  function getViewNodeValue(found) {
    var value = found.getAttribute('data-value');
    try {
      value = JSON.parse(value);
    } catch ( e ) {
      value = null;
    }
    return value;
  }

  /////////////////////////////////////////////////////////////////////////////
  // ELEMENTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.Elements = (function() {

    return {
      //
      // VIEWS
      //

      'gui-icon-view': (function() {
        function handleItemClick(ev, item, idx, selected) {
        }

        function initEntry(el, cel) {
          function getSelected() {
            return OSjs.GUI.Elements['gui-icon-view'].values(el);
          }

          var icon = cel.getAttribute('data-icon');
          var label = getLabel(cel);

          var dicon = document.createElement('div');
          var dimg = document.createElement('img');
          dimg.src = icon;
          dicon.appendChild(dimg);

          var dlabel = document.createElement('div');
          var dspan = document.createElement('span');
          dspan.appendChild(document.createTextNode(label));
          dlabel.appendChild(dspan);

          Utils.$bind(cel, 'click', function(ev) {
            var idx = Utils.$index(cel);
            var multipleSelect = el.getAttribute('data-multiple');
            multipleSelect = multipleSelect === null || multipleSelect === 'true';
            el._selected = handleItemSelection(ev, cel, idx, 'gui-icon-view-entry', el._selected, null, multipleSelect);
            el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
          }, false);
          Utils.$bind(cel, 'dblclick', function(ev) {
            var idx = Utils.$index(cel);
            el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
          }, false);

          cel.appendChild(dicon);
          cel.appendChild(dlabel);
        }

        function addToView(el, args) {
          var entries = args[0];
          if ( !(entries instanceof Array) ) {
            entries = [entries];
          }

          entries.forEach(function(e) {
            var entry = createElement('gui-icon-view-entry', e);
            el.appendChild(entry);
            initEntry(el, entry);
          });
        }

        function updateActiveSelection(el) {
          var active = [];
          el.querySelectorAll('gui-icon-view-entry.gui-active').forEach(function(cel) {
            active.push(Utils.$index(cel));
          });
          el._active = active;
        }

        function removeFromView(el, args, target) {
          function remove(cel) {
            Utils.$remove(cel);
          }

          if ( target ) {
            remove(target);
            return;
          }

          var findId = args[0];
          var findKey = args[1] || 'id';
          var q = 'data-' + findKey + '="' + findId + '"';
          el.querySelectorAll('gui-icon-view-entry[' + q + ']').forEach(remove);
          updateActiveSelection(el);
        }

        function patchIntoView(el, args) {
          // TODO
        }

        function clearView(el) {
          Utils.$empty(el);
          el.scrollTop = 0;
          el._selected = [];
        }
        return {
          bind: function(el, evName, callback, params) {
            if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
              evName = '_' + evName;
            }
            Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
          },
          values: function(el) {
            var selected = [];
            var active = (el._selected || []);

            active.forEach(function(iter) {
              var found = el.querySelectorAll('gui-icon-view-entry')[iter];
              if ( found ) {
                selected.push({
                  index: iter,
                  data: getViewNodeValue(found)
                });
              }
            });

            return selected;
          },
          build: function(el) {
            // TODO: Custom Icon Size
            // TODO: Set value (selected items)

            function getSelected() {
              return OSjs.GUI.Elements['gui-icon-view'].values(el);
            }

            el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
              initEntry(el, cel);
            });
          },

          call: function(el, method, args) {
            if ( method === 'add' ) {
              addToView(el, args);
            } else if ( method === 'remove' ) {
              removeFromView(el, args);
            } else if ( method === 'clear' ) {
              clearView(el);
            } else if ( method === 'patch' ) {
              patchIntoView(el, args);
            }
          },

          values: function(el) {
            var selected = [];
            var active = (el._selected || []);
            active.forEach(function(iter) {
              var found = el.querySelectorAll('gui-icon-view-entry')[iter];
              if ( found ) {
                selected.push({index: iter, data: getViewNodeValue(found)});
              }
            });
            return selected;
          },
        };
      })(),

      'gui-tree-view': {
        bind: function(el, evName, callback, params) {
          if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
            evName = '_' + evName;
          }
          Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
        },
        values: function(el) {
          var selected = [];
          var active = (el._selected || []);

          active.forEach(function(iter) {
            var found = el.querySelectorAll('gui-tree-view-entry')[iter];
            if ( found ) {
              selected.push({
                index: iter,
                data: getViewNodeValue(found)
              });
            }
          });
          return selected;
        },
        build: function(el) {
          // TODO: Custom Icon Size
          // TODO: Set value (selected items)

          function getSelected() {
            return OSjs.GUI.Elements['gui-tree-view'].values(el);
          }

          function handleItemClick(ev, item, idx, selected) {
            var multipleSelect = el.getAttribute('data-multiple');
            multipleSelect = multipleSelect === null || multipleSelect === 'true';

            return handleItemSelection(ev, item, idx, 'gui-tree-view-entry', selected, el, multipleSelect);
          }

          function handleItemExpand(ev, root, expanded) {
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
          }

          el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {

            var icon = sel.getAttribute('data-icon');
            var label = getLabel(sel);
            var expanded = sel.getAttribute('data-expanded') === 'true';
            var next = sel.querySelector('gui-tree-view-entry');

            var container = document.createElement('div');
            var dspan = document.createElement('span');
            if ( icon ) {
              dspan.style.backgroundImage = 'url(' + icon + ')';
              Utils.$addClass(dspan, 'gui-has-image');
            }
            dspan.appendChild(document.createTextNode(label));

            container.appendChild(dspan);

            if ( next ) {
              Utils.$addClass(sel, 'gui-expandable');
              var expander = document.createElement('gui-tree-view-expander');
              Utils.$bind(expander, 'click', function(ev) {
                handleItemExpand(ev, sel);
              });

              sel.insertBefore(container, next);
              sel.insertBefore(expander, container);
            } else {
              sel.appendChild(container);
            }

            handleItemExpand(null, sel, expanded);

            Utils.$bind(container, 'click', function(ev) {
              el._selected = handleItemClick(ev, sel, idx, el._selected);
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
            }, false);
            Utils.$bind(container, 'dblclick', function(ev) {
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
            }, false);

          });
        }
      },

      'gui-list-view': (function() {

        function resize(rel, w) {
          var flex = w.toString() + 'px';
          rel.style['webkitFlexBasis'] = flex;
          rel.style['mozFflexBasis'] = flex;
          rel.style['msFflexBasis'] = flex;
          rel.style['oFlexBasis'] = flex;
          rel.style['flexBasis'] = flex;
        }

        function createEntry(v) {
          var label = v.label || '';
          if ( v.label ) {
            delete v.label;
          }

          var nel = createElement('gui-list-view-column', v);
          nel.appendChild(document.createTextNode(label));
          setFlexbox(nel, null, null, 1, 0);
          return nel;
        }

        function createResizers(el) {
          var head = el.querySelector('gui-list-view-columns');
          var body = el.querySelector('gui-list-view-rows');
          var cols = head.querySelectorAll('gui-list-view-column');

          head.querySelectorAll('gui-list-view-column-resizer').forEach(function(rel) {
            Utils.$remove(rel);
          });

          cols.forEach(function(col, idx) {
            var attr = col.getAttribute('data-resizable');
            if ( attr === 'true' ) {
              var resizer = document.createElement('gui-list-view-column-resizer');
              col.appendChild(resizer);

              var startWidth = 0;
              var maxWidth   = 0;

              createDrag(resizer, function(ev) {
                startWidth = col.offsetWidth;
                maxWidth = el.offsetWidth / 2; // FIXME
              }, function(ev, dx, dy) {
                var newWidth = startWidth + dx;
                if ( !isNaN(newWidth) ) { //&& newWidth > 0 && newWidth < maxWidth ) {
                  resize(col, newWidth);

                  // FIXME: Super slow!
                  body.querySelectorAll('gui-list-view-row').forEach(function(row) {
                    resize(row.children[idx], newWidth);
                  });
                }
              });
            }
          });
        }

        function initRow(el, row) {
          var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
          var headContainer = el.querySelector('gui-list-view-head');
          var singleClick = el.getAttribute('data-single-click') === 'true';

          function getSelected() {
            return OSjs.GUI.Elements['gui-list-view'].values(el);
          }

          row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
            var cl = cols.length;
            var x = cl ? idx % cl : idx;
            var grow = cl ? 1 : 0;
            var shrink = cl ? 1 : 0;
            var headerEl = headContainer ? headContainer.querySelectorAll('gui-list-view-column')[x] : null;

            setFlexbox(cel, null, null, grow, shrink, headerEl);

            var icon = cel.getAttribute('data-icon');
            if ( icon ) {
              Utils.$addClass(cel, 'gui-has-image');
              cel.style.backgroundImage = 'url(' + icon + ')';
            }

            var text = cel.firstChild;
            if ( text && text.nodeType === 3 ) {
              var span = document.createElement('span');
              span.appendChild(document.createTextNode(text.nodeValue));
              cel.insertBefore(span, text);
              cel.removeChild(text);
            }

            if ( el._columns[idx] && !el._columns[idx].visible ) {
              cel.style.display = 'none';
            }
          });

          if ( singleClick ) {
            Utils.$bind(row, 'click', function(ev) {
              var multipleSelect = el.getAttribute('data-multiple');
              multipleSelect = multipleSelect === null || multipleSelect === 'true';
              var idx = Utils.$index(row);
              el._selected = handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);

              var selected = getSelected();
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: selected}}));
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: selected}}));
            });
          } else {
            Utils.$bind(row, 'click', function(ev) {
              var multipleSelect = el.getAttribute('data-multiple');
              multipleSelect = multipleSelect === null || multipleSelect === 'true';

              var idx = Utils.$index(row);
              el._selected = handleItemSelection(ev, row, idx, 'gui-list-view-row', el._selected, null, multipleSelect);
              el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected()}}));
            }, false);

            Utils.$bind(row, 'dblclick', function(ev) {
              el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected()}}));
            }, false);
          }

          if ( el.getAttribute('data-draggable') === 'true' ) {
            var value = row.getAttribute('data-value');
            if ( value !== null ) {
              try {
                value = JSON.parse(value);
              } catch ( e ) {}
            }

            var source = row.getAttribute('data-draggable-source');
            if ( source === null ) {
              source = getWindowId(el);
              if ( source !== null ) {
                source = {wid: source};
              }
            }

            API.createDraggable(row, {
              type   : el.getAttribute('data-draggable-type') || row.getAttribute('data-draggable-type'),
              source : source,
              data   : value
            });
          }
        }

        function createRow(e) {
          var row = document.createElement('gui-list-view-row');
          if ( e && e.columns ) {
            e.columns.forEach(function(se) {
              row.appendChild(createEntry(se));
            });

            var value = null;
            try {
              value = JSON.stringify(e.value);
            } catch ( e ) {}
            row.setAttribute('data-value', value);
            if ( typeof e.id !== 'undefined' && e.id !== null ) {
              row.setAttribute('data-id', e.id);
            }

            return row;
          }

          return null;
        }

        function addToView(el, args) {
          var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
          var body = el.querySelector('gui-list-view-rows');
          var entries = args[0];
          if ( !(entries instanceof Array) ) {
            entries = [entries];
          }

          entries.forEach(function(e) {
            var row = createRow(e);
            if ( row ) {
              body.appendChild(row);
              initRow(el, row);
            }
          });
        }

        function updateActiveSelection(el) {
          var active = [];
          el.querySelectorAll('gui-list-view-row.gui-active').forEach(function(cel) {
            active.push(Utils.$index(cel));
          });
          el._active = active;
        }

        function removeFromView(el, args, target) {
          function remove(cel) {
            Utils.$remove(cel);
          }

          if ( target ) {
            remove(target);
            return;
          }

          var findId = args[0];
          var findKey = args[1] || 'id';
          var q = 'data-' + findKey + '="' + findId + '"';
          el.querySelectorAll('gui-list-view-rows > gui-list-view-row[' + q + ']').forEach(remove);
          updateActiveSelection(el);
        }

        function patchIntoView(el, args) {
          var entries = args[0];
          var single = false;
          var body = el.querySelector('gui-list-view-rows');

          if ( !(entries instanceof Array) ) {
            entries = [entries];
            single = true;
          }

          var inView = {};
          el.querySelectorAll('gui-list-view-rows > gui-list-view-row').forEach(function(row) {
            var id = row.getAttribute('data-id');
            if ( id !== null ) {
              inView[id] = row;
            }
          });

          entries.forEach(function(entry) {
            var insertBefore;
            if ( typeof entry.id !== 'undefined' && entry.id !== null ) {
              if ( inView[entry.id] ) {
                insertBefore = inView[entry.id];
                delete inView[entry.id];
              }

              var row = createRow(entry);
              if ( row ) {
                if ( insertBefore ) {
                  if ( Utils.$hasClass(insertBefore, 'gui-active') ) {
                    Utils.$addClass(row, 'gui-active');
                  }

                  body.insertBefore(row, insertBefore);
                  removeFromView(el, null, insertBefore);
                } else {
                  body.appendChild(row);
                }
                initRow(el, row);
              }
            }
          });

          if ( !single ) {
            Object.keys(inView).forEach(function(k) {
              removeFromView(el, null, inView[k]);
            });
          }

          inView = {};
          updateActiveSelection(el);
        }

        function clearView(el) {
          Utils.$empty(el.querySelector('gui-list-view-rows'));
          el.scrollTop = 0;
          el._selected = [];
        }

        return {
          bind: function(el, evName, callback, params) {
            if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
              evName = '_' + evName;
            }
            Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
          },
          values: function(el) {
            var selected = [];
            var body = el.querySelector('gui-list-view-rows');
            var active = (el._selected || []);

            active.forEach(function(iter) {
              var found = body.querySelectorAll('gui-list-view-row')[iter];
              if ( found ) {
                selected.push({index: iter, data: getViewNodeValue(found)});
              }
            });
            return selected;
          },

          set: function(el, param, value, arg) {
            if ( param === 'columns' ) {
              var head = el.querySelector('gui-list-view-columns');
              var row = head.querySelector('gui-list-view-row');
              if ( row ) {
                Utils.$empty(row);
              } else {
                row = document.createElement('gui-list-view-row');
              }

              el._columns = [];
              value.forEach(function(v) {
                var iter = {
                  visible: (typeof v.visible === 'undefined') || v.visible === true
                };
                el._columns.push(iter);
                var nel = createEntry(v);
                if ( !iter.visible ) {
                  nel.style.display = 'none';
                }
                row.appendChild(nel);
              });

              head.appendChild(row);

              createResizers(el);
              return;
            } else if ( param === 'selected' ) {
              var body = el.querySelector('gui-list-view-rows');
              var select = [];

              body.querySelectorAll('gui-list-view-row').forEach(function(r, idx) {
                Utils.$removeClass(r, 'gui-active');

                try {
                  var json = JSON.parse(r.getAttribute('data-value'));
                  if ( json[arg] == value ) {
                    select.push(idx);
                    Utils.$addClass(r, 'gui-active');
                    scrollIntoView(el, r);
                  }
                } catch ( e ) {}
              });

              el._selected = select;

              return;
            }

            setProperty(el, param, value);
          },
          call: function(el, method, args) {
            if ( method === 'add' ) {
              addToView(el, args);
            } else if ( method === 'remove' ) {
              removeFromView(el, args);
            } else if ( method === 'clear' ) {
              clearView(el);
            } else if ( method === 'patch' ) {
              patchIntoView(el, args);
            }
          },
          build: function(el, applyArgs) {
            var headContainer, bodyContainer;
            var head = el.querySelector('gui-list-view-columns');

            if ( !head ) {
              head = document.createElement('gui-list-view-columns');
              if ( el.children.length )  {
                el.insertBefore(head, el.firstChild);
              } else {
                el.appendChild(head);
              }
            }
            var body = el.querySelector('gui-list-view-rows');
            if ( !body ) {
              body = document.createElement('gui-list-view-rows');
              el.appendChild(body);
            }

            el._selected = [];
            el._columns = [];

            if ( head ) {
              headContainer = document.createElement('gui-list-view-head');
              headContainer.appendChild(head);
              if ( body ) {
                el.insertBefore(headContainer, body);
              } else {
                el.appendChild(headContainer);
              }
              createResizers(el);
            }

            if ( body ) {
              bodyContainer = document.createElement('gui-list-view-body');
              bodyContainer.appendChild(body);
              el.appendChild(bodyContainer);
            }

            if ( headContainer ) {
              Utils.$bind(el, 'scroll', function() {
                headContainer.style.top = el.scrollTop + 'px';
              }, false);

              el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
                setFlexbox(cel, null, null, 1, 0);

                var vis = cel.getAttribute('data-visible');
                var iter = {
                  visible: vis === null || vis === 'true'
                };

                el._columns.push(iter);

                if ( !iter.visible ) {
                  cel.style.display = 'none';
                }
              });
            }

            el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
              initRow(el, row);
            });
          }
        };
      })(),

      'gui-file-view': (function() {
        function getChildView(el) {
          return el.children[0];
        }

        function buildChildView(el) {
          var type = el.getAttribute('data-type') || 'list-view';
          if ( !type.match(/^gui\-/) ) {
            type = 'gui-' + type;
          }

          var nel = new UIElementDataView(createElement(type, {'draggable': true, 'draggable-type': 'file'}));
          OSjs.GUI.Elements[type].build(nel.$element);

          nel.on('select', function(ev) {
            el.dispatchEvent(new CustomEvent('_select', {detail: ev.detail}));
          });
          nel.on('activate', function(ev) {
            el.dispatchEvent(new CustomEvent('_activate', {detail: ev.detail}));
          });

          if ( type === 'gui-list-view' ) {
            nel.set('columns', [
              {label: 'Filename', resizable: true, basis: '100px'},
              {label: 'MIME', resizable: true},
              {label: 'Size', basis: '50px'}
            ]);
          }

          el.appendChild(nel.$element);
        }

        function scandir(tagName, dir, opts, cb, oncreate) {
          var file = new VFS.File(dir);
          file.type  = 'dir';

          var scanopts = {
            showDotFiles: opts.dotfiles === true,
            mimeFilter:   opts.filter || [],
            typeFilter:   opts.filetype || null
          };

          VFS.scandir(file, function(error, result) {
            if ( error ) { cb(error); return; }

            var list = [];
            var summary = {size: 0, directories: 0, files: 0, hidden: 0};
            (result || []).forEach(function(iter) {
              list.push(oncreate(iter));

              summary.size += iter.size || 0;
              summary.directories += iter.type === 'dir' ? 1 : 0;
              summary.files += iter.type !== 'dir' ? 1 : 0;
              summary.hidden += iter.filename.substr(0) === '.' ? 1 : 0;
            });

            cb(false, list, summary);
          }, scanopts);
        }

        return {
          bind: function(el, evName, callback, params) {
            if ( (['activate', 'select']).indexOf(evName) !== -1 ) {
              evName = '_' + evName;
            }
            Utils.$bind(el, evName, callback.bind(new UIElement(el)), params);
          },
          set: function(el, param, value, arg) {
            if ( param === 'type' ) {
              Utils.$empty(el);
              el.setAttribute('data-type', value);
              buildChildView(el);

              OSjs.GUI.Elements['gui-file-view'].call(el, 'chdir', {
                path: el.getAttribute('data-path')
              });
              return;
            } else if ( (['filter', 'dotfiles', 'filetype']).indexOf(param) >= 0 ) {
              setProperty(el, param, value);
              return;
            }

            var target = getChildView(el);
            if ( target ) {
              var tagName = target.tagName.toLowerCase();
              OSjs.GUI.Elements[tagName].set(target, param, value, arg);
            }

          },
          build: function(el) {
            buildChildView(el);
          },
          values: function(el) {
            var target = getChildView(el);
            if ( target ) {
              var tagName = target.tagName.toLowerCase();
              return OSjs.GUI.Elements[tagName].values(target);
            }
            return null;
          },
          call: function(el, method, args) {
            args = args || {};
            args.done = args.done || function() {};

            var target = getChildView(el);
            if ( target ) {
              var tagName = target.tagName.toLowerCase();

              if ( method === 'chdir' ) {
                var t = new UIElementDataView(target);
                var dir = args.path || OSjs.API.getDefaultPath('/');
                el.setAttribute('data-path', dir);

                var opts = {
                  filter: null,
                  dotfiles: el.getAttribute('data-dotfiles') === 'true',
                  filetype: el.getAttribute('data-filetype')
                };

                try {
                  opts.filter = JSON.parse(el.getAttribute('data-filter'));
                } catch ( e ) {
                }

                scandir(tagName, dir, opts, function(error, result, summary) {
                  if ( !error ) {
                    t.clear();
                    t.add(result);
                  }

                  args.done(error, summary);
                }, function(iter) {
                  function _getIcon(iter) {
                    var icon = 'status/gtk-dialog-question.png';
                    return API.getFileIcon(iter, null, icon);
                  }

                  if ( tagName === 'gui-icon-view' || tagName === 'gui-tree-view' ) {
                    return {
                      value: iter,
                      id: iter.id || iter.filename,
                      label: iter.filename,
                      icon: _getIcon(iter)
                    };
                  }

                  return {
                    value: iter,
                    id: iter.id || iter.filename,
                    columns: [
                      {label: iter.filename, icon: _getIcon(iter)},
                      {label: iter.mime},
                      {label: iter.size}
                    ]
                  };
                });

                return;
              }

              OSjs.GUI.Elements[tagName].call(target, method, args);
            }
          }
        };
      })()

    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // UIELEMENT CLASS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Base UIElement Class
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
    if ( this.$element ) {
      this.$element.style.display = this.oldDisplay || '';
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
        OSjs.GUI.Elements[this.tagName].set(this.$element, param, value, arg);
      } else {
        setProperty(this.$element, param, value, arg);
      }
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

  function UIScheme(url) {
    this.url = url;
    this.scheme = null;
  }

  UIScheme.prototype.load = function(cb) {
    var self = this;
    Utils.ajax({
      url: this.url,
      onsuccess: function(html) {
        // Fixes weird whitespaces with inline-block elements
        html = html.replace(/\n/g, '')
                   .replace(/[\t ]+</g, '<')
                   .replace(/\>[\t ]+</g, '><')
                   .replace(/\>[\t ]+$/g, '>');

        var doc = document.createDocumentFragment();
        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        doc.appendChild(wrapper);
        self.scheme = doc;

        cb(false, doc);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };

  UIScheme.prototype.parse = function(id, type, win, onparse) {
    onparse = onparse || function() {};

    var content;
    if ( type ) {
      content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
    } else {
      content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
    }

    type = type || content.tagName.toLowerCase();
    if ( content ) {
      var node = content.cloneNode(true);

      node.querySelectorAll('*').forEach(function(el) {
        var lcase = el.tagName.toLowerCase();
        if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|toolbar|button\-bar)$/) ) {
          Utils.$addClass(el, 'gui-element');
        }
      });

      parseDynamic(node, win);

      onparse(node);

      Object.keys(OSjs.GUI.Elements).forEach(function(key) {
        node.querySelectorAll(key).forEach(function(pel) {
          OSjs.GUI.Elements[key].build(pel);
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
    if ( content ) {
      var children = content.children;
      /*
      for ( var i = 0; i < children.length; i++ ) {
        root.appendChild(children[i].cloneNode(true));
      }
      */

      // Appending nodes from somewere moves it!
      var i = 0;
      while ( children.length && i < 10000 ) {
        root.appendChild(children[0]);
        i++;
      }
    }
  };

  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win.getRoot();

    var el = document.createElement(tagName);
    Object.keys(params).forEach(function(k) {
      var val = params[k];
      if ( typeof val === 'boolean' ) {
        val = val ? 'true' : 'false';
      } else {
        val = val.toString();
      }

      el.setAttribute('data-' + k, val);
    });

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
    getLabel: getLabel,
    getIcon: getIcon,
    createElement: createElement,
    createDrag: createDrag,
    setProperty: setProperty,
    setFlexbox: setFlexbox
  };

  OSjs.API.createScheme = function(url) {
    return new UIScheme(url);
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS);
