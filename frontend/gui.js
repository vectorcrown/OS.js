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
(function() {
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function createDroppable(el, args) {
    args = args || {};

    args.accept = args.accept || null;
    args.effect = args.effect || 'move';
    args.mime   = args.mime   || 'application/json';
    args.files  = args.files  || true;

    args.onFilesDropped = args.onFilesDropped || function() { return true; };
    args.onItemDropped  = args.onItemDropped  || function() { return true; };
    args.onEnter        = args.onEnter        || function() { return true; };
    args.onOver         = args.onOver         || function() { return true; };
    args.onLeave        = args.onLeave        || function() { return true; };
    args.onDrop         = args.onDrop         || function() { return true; };

    var _onDrop = function(ev, el) {
      ev.stopPropagation();
      ev.preventDefault();

      args.onDrop.call(this, ev, el);
      if ( !ev.dataTransfer ) return true;

      if ( args.files ) {
        var files = ev.dataTransfer.files;
        if ( files && files.length ) {
          return args.onFilesDropped.call(this, ev, el, files, args);
        }
      }

      var data;
      var self = this;
      try {
        data = ev.dataTransfer.getData(args.mime);
      } catch ( e ) {
        console.warn('Failed to drop: ' + e);
      }
      if ( data ) {
        var item = JSON.parse(data);
        if ( args.accept === null || args.accept == item.type ) {
          return args.onItemDropped.call(self, ev, el, item, args);
        }
      }

      return false;
    };

    el.addEventListener('drop', function(ev) {
      return _onDrop(ev, this);
    }, false);

    el.addEventListener('dragenter', function(ev) {
      return args.onEnter.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragover', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = args.effect;
      return args.onOver.call(this, ev, this, args);
    }, false);

    el.addEventListener('dragleave', function(ev) {
      return args.onLeave.call(this, ev, this, args);
    }, false);
  }

  function createDraggable(el, args) {
    args        = args        || {};
    args.type   = args.type   || null;
    args.effect = args.effect || 'move';
    args.data   = args.data   || null;
    args.mime   = args.mime   || 'application/json';

    args.onStart  = args.onStart  || function() { return true; };
    args.onEnd    = args.onEnd    || function() { return true; };

    var _toString = function(mime) {
      return JSON.stringify({
        type:   args.type,
        effect: args.effect,
        data:   args.data,
        mime:   args.mime
      });
    };

    el.setAttribute("draggable", "true");
    el.addEventListener('dragstart', function(ev) {
      this.style.opacity = '0.4';
      if ( ev.dataTransfer ) {
        try {
          ev.dataTransfer.effectAllowed = args.effect;
          ev.dataTransfer.setData(args.mime, _toString(args.mime));
        } catch ( e ) {
          console.warn("Failed to dragstart: " + e);
        }
      }

      return args.onStart(ev, this, args);
    }, false);

    el.addEventListener('dragend', function(ev) {
      this.style.opacity = '1.0';

      return args.onEnd(ev, this, args);
    }, false);
  }

  /**
   * GUI Element
   */
  var _GUIElementCount = 0;
  var GUIElement = function(name, opts) {
    this.name       = name;
    this.opts       = opts || {};
    this.id         = _GUIElementCount;
    this.destroyed  = false;
    this._hooks     = {
      focus : [],
      blur : [],
      destroy : []
    };

    if ( typeof this.opts.dnd === 'undefined' ) {
      this.opts.dnd     = false;
    }
    if ( typeof this.opts.dndDrop === 'undefined' ) {
      this.opts.dndDrop = this.opts.dnd;
    }
    if ( typeof this.opts.dndDrag === 'undefined' ) {
      this.opts.dndDrag = this.opts.dnd;
    }
    if ( typeof this.opts.dndOpts === 'undefined' ) {
      this.opts.dndOpts = {};
    }
    if ( typeof this.opts.focusable === 'undefined' ) {
      this.opts.focusable = true;
    }

    this.onItemDropped  = function() {};
    this.onFilesDropped = function() {};

    this.$element = null;
    this.init();
    _GUIElementCount++;
  };

  GUIElement.prototype.init = function(className) {
    this.$element = document.createElement('div');
    this.$element.className = 'GUIElement ' + this.name + ' GUIElement_' + this.id;
    if ( className ) {
      this.$element.className += ' ' + className;
    }

    var cpb = OSjs.Utils.getCompability();
    if ( this.opts.dnd && this.opts.dndDrop && cpb.dnd ) {
      var opts = this.opts.dndOpts;
      var self = this;
      opts.onItemDropped = function(ev, el, item) {
        return self.onItemDropped.call(self, ev, el, item);
      };
      opts.onFilesDropped = function(ev, el, files) {
        return self.onFilesDropped.call(self, ev, el, files);
      };

      createDroppable(this.$element, opts);
    }

    if ( this.opts.focusable ) {
      var self = this;
      this.$element.addEventListener('mousedown', function(ev) {
        self.focus();
      }, false);
      this._addHook('destroy', function() {
        this.$element.removeEventListener('mousedown', function(ev) {
          self.focus();
        }, false);
      });
    }

    return this.$element;
  };

  GUIElement.prototype.destroy = function() {
    if ( this.destroyed ) return;

    this.destroyed = true;
    this._fireHook('destroy');
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this._hooks = {};
  };

  GUIElement.prototype._addHook = function(k, func) {
    if ( typeof func === 'function' && this._hooks[k] ) {
      this._hooks[k].push(func);
    }
  };

  GUIElement.prototype._fireHook = function(k, args) {
    args = args || {};
    if ( this._hooks[k] ) {
      for ( var i = 0, l = this._hooks[k].length; i < l; i++ ) {
        if ( !this._hooks[k][i] ) continue;
        try {
          this._hooks[k][i].apply(this, args);
        } catch ( e ) {
          console.warn("GUIElement::_fireHook() failed to run hook", k, i, e);
        }
      }
    }
  };

  GUIElement.prototype.getRoot = function() {
    return this.$element;
  };

  GUIElement.prototype.onDndDrop = function(ev) {
    return true;
  };

  GUIElement.prototype.onKeyPress = function(ev) {
    if ( !this.focused ) return false;
    return true;
  };

  GUIElement.prototype.focus = function() {
    if ( this.focused ) return false;
    console.log("GUIElement::focus()", this.id);
    this.focused = true;
    return true;
  };

  GUIElement.prototype.blur = function() {
    if ( !this.focused ) return;
    this.focused = false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // CLASSES
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Menu class
   */
  var Menu = function(list) {
    var el = document.createElement('div');
    el.className = 'Menu';

    var ul = document.createElement('ul');

    var _onclick = function(ev, func) {
      func();
      OSjs.GUI.blurMenu();
    };

    if ( list ) {
      var m;
      var img;
      var span;
      for ( var i = 0, l = list.length; i < l; i++ ) {
        img = null;
        m = document.createElement('li');
        if ( list[i].icon ) {
          img = document.createElement('img');
          img.alt = '';
          img.src = OSjs.API.getThemeResource(list[i].icon, 'icon');
          m.appendChild(img);
        }

        if ( list[i].name ) {
          m.className = 'MenuItem_' + list[i].name;
        }

        span = document.createElement('span');
        span.innerHTML = list[i].title;
        m.appendChild(span);

        m.onclick = (function(ref) {
          return function(ev) {
            if ( this.getAttribute("disabled") == "disabled" ) return;
            _onclick(ev, ref.onClick);
          };
        })(list[i]);
        ul.appendChild(m);
      }
    }

    el.appendChild(ul);

    this.$element = el;
  };

  Menu.prototype.destroy = function() {
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this.$element = null;
  };

  Menu.prototype.show = function(pos) {
    this.$element.style.top = -10000 + 'px';
    this.$element.style.left = -10000 + 'px';
    document.body.appendChild(this.$element);

    var tw = pos.x + this.$element.offsetWidth;
    var th = pos.y + this.$element.offsetHeight;
    var px = pos.x;
    var py = pos.y;
    if ( tw > window.innerWidth ) {
      px = window.innerWidth - this.$element.offsetWidth;
    }
    if ( th > window.innerHeight ) {
      py = window.innerHeight - this.$element.offsetHeight;
    }

    this.$element.style.top = py + 'px';
    this.$element.style.left = px + 'px';
  };

  Menu.prototype.getRoot = function() {
    return this.$element;
  };

  /**
   * MenuBar Class
   */
  var MenuBar = function(name, opts) {
    this.$ul = null;
    this.onMenuOpen = function() {};
    GUIElement.apply(this, [name, opts]);
  };
  MenuBar.prototype = Object.create(GUIElement.prototype);

  MenuBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIMenuBar']);
    this.$ul = document.createElement('ul');
    el.appendChild(this.$ul);
    el.oncontextmenu = function(ev) {
      return false;
    };
    return el;
  };

  MenuBar.prototype.addItem = function(title, menu, pos) {
    if ( !this.$ul ) return;
    var self = this;
    var el = document.createElement('li');
    el.innerHTML = title;
    el.onclick = function(ev) {
      var pos = {x: ev.clientX, y: ev.clientY};
      var tpos = OSjs.Utils.$position(this);
      if ( tpos ) {
        pos.x = tpos.left;
        pos.y = tpos.top;
      }
      var elm = OSjs.GUI.createMenu(menu, pos);
      self.onMenuOpen.call(this, elm, pos);
    };

    this.$ul.appendChild(el);
  };

  /**
   * List View Class
   */
  var ListView = function(name, opts) {
    opts = opts || {};
    this.singleClick = typeof opts.singleClick === 'undefined' ? false : (opts.singleClick === true);
    this.rows = [];
    this.columns = [];
    this.$head = null;
    this.$headTop = null;
    this.$body = null;
    this.$table = null;
    this.$tableTop = null;
    this.$scroll = null;
    this.selected = null;
    this.selectedDOMItem = null;

    this.onCreateRow = function() {};
    this.onSelect = function() {};
    this.onActivate = function() {};

    GUIElement.apply(this, arguments);
  };

  ListView.prototype = Object.create(GUIElement.prototype);

  ListView.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIListView']);

    var table = document.createElement('table');
    table.className = 'Body';

    var head = document.createElement('thead');
    var body = document.createElement('tbody');

    var self = this;
    var activate = function(ev, type) {
      var t = ev.target;
      if ( t && t.tagName != 'TR' ) {
        if ( t.parentNode.tagName == 'TR' ) {
          t = t.parentNode;
        } else if ( t.parentNode.parentNode.tagName == 'TR' ) {
          t = t.parentNode.parentNode;
        }
      }

      if ( t && t.tagName == 'TR' ) {
        if ( type == 'activate' ) {
          self._onActivate(ev, t);
        } else if ( type == 'select' ) {
          self._onSelect(ev, t);
        }
      }
    };

    var onDblClick = function(ev) {
      activate(ev, 'activate');
    };

    var onClick = function(ev) {
      activate(ev, 'select');
    };

    table.addEventListener('click', onClick, false);
    table.addEventListener(this.singleClick ? 'click' : 'dblclick', onDblClick, false);
    this._addHook('destroy', function() {
      table.removeEventListener('click', onClick, false);
      table.removeEventListener(this.singleClick ? 'click' : 'dblclick', onDblClick, false);
    });

    table.appendChild(head);
    table.appendChild(body);

    var tableTop = document.createElement('table');
    var headTop = document.createElement('thead');
    tableTop.className = 'Header';
    tableTop.appendChild(headTop);
    el.appendChild(tableTop);

    this.$scroll = document.createElement('div');
    this.$scroll.className = 'Scroll';
    this.$scroll.appendChild(table);
    el.appendChild(this.$scroll);

    this.$head = head;
    this.$headTop = headTop;
    this.$body = body;
    this.$table = table;
    this.$tableTop = tableTop;
    this.callback = function() {};
  };

  ListView.prototype.render = function() {
    this.selected = null;
    this.selectedDOMItem = null;

    OSjs.Utils.$empty(this.$head);
    OSjs.Utils.$empty(this.$body);
    OSjs.Utils.$empty(this.$headTop);

    var self = this;
    var i, l, ii, ll, row, col, colref, iter, val, type, tmp, d, span;

    row = document.createElement('tr');
    for ( i = 0, l = this.columns.length; i < l; i++ ) {
      colref = this.columns[i];
      if ( typeof colref.visible !== 'undefined' && colref.visible === false ) continue;

      col = document.createElement('td');
      col.className = 'Column_' + colref.key;
      col.innerHTML = colref.title;

      if ( colref.domProperties ) {
        for ( d in colref.domProperties ) {
          if ( colref.domProperties.hasOwnProperty(d) ) {
            col.setAttribute(d, colref.domProperties[d]);
          }
        }
      }

      row.appendChild(col);
    }
    this.$head.appendChild(row);
    this.$headTop.appendChild(row);

    for ( i = 0, l = this.rows.length; i < l; i++ ) {
      row = document.createElement('tr');
      iter = this.rows[i];

      for ( ii = 0, ll = this.columns.length; ii < ll; ii++ ) {
        span = null;

        colref = this.columns[ii];
        row.setAttribute('data-' + colref.key, iter[colref.key]);

        if ( (typeof colref.visible !== 'undefined' && colref.visible === false) ) continue;
        type = (typeof colref.type === 'undefined') ? 'text' : colref.type;
        col = document.createElement('td');
        col.className = 'Column_' + colref.key;

        if ( colref.callback ) {
          val = colref.callback(iter);
        } else {
          val = iter[colref.key];
        }

        if ( colref.domProperties ) {
          for ( d in colref.domProperties ) {
            if ( colref.domProperties.hasOwnProperty(d) ) {
              col.setAttribute(d, colref.domProperties[d]);
            }
          }
        }

        if ( type === 'image' ) {
          tmp = document.createElement('img');
          //tmp.ondragstart = function() { return false; };
          tmp.alt = '';
          tmp.src = val;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else if ( type === 'button' ) {
          tmp = document.createElement('button');
          tmp.innerHTML = val;
          tmp.onclick = iter.customEvent;
          col.appendChild(tmp);
          row.removeAttribute('data-' + colref.key);
        } else {
          span = document.createElement('span');
          span.innerHTML = val || '';
          col.appendChild(span);
        }

        row.onclick = function(ev) {
          self._onRowClick.call(self, ev, this);
        };
        row.appendChild(col);
      }
      this.$body.appendChild(row);

      this.onCreateRow(row, iter, colref);
    }

    this.$scroll.scrollTop = 0;
  };

  ListView.prototype.onKeyPress = function(ev) {
    if ( this.destroyed ) return false;
    if ( !GUIElement.prototype.onKeyPress.apply(this, arguments) ) return;

    ev.preventDefault();
    if ( this.selected ) {

      var idx = OSjs.Utils.$index(this.selectedDOMItem, this.$body);
      var tidx = idx;
      if ( idx >= 0 && idx < this.$body.childNodes.length ) {
        if ( ev.keyCode === 38 ) {
          idx--;
        } else if ( ev.keyCode === 40 ) {
          idx++;
        } else if ( ev.keyCode === 13 ) {
          this._onActivate(ev, this.selectedDOMItem);
          return true;
        }

        if ( idx != tidx ) {
          this.setSelectedIndex(idx);
        }
      }
    }
    return true;
  };

  ListView.prototype._onSelect = function(ev, el) {
    this.selectedDOMItem = null;
    this.selected = null;

    var iter = false;
    if ( el ) {
      var iter = this._getRowData(el);
      this.selectedDOMItem = el;
      this.selected = iter;
      this.onSelect.call(this, ev, el, iter);
    }
    return iter;
  };

  ListView.prototype._onActivate = function(ev, el) {
    var iter = this._getRowData(el);
    this.selectedDOMItem = el;
    this.selected = iter;
    this.onActivate.call(this, ev, el, iter);
    return iter;
  };

  ListView.prototype._onRowClick = (function() {
    var last;

    return function(ev, el) {
      this.selectedDOMItem = el;

      if ( last ) {
        last.className = '';
      }
      el.className = 'active';
      last = el;

      if ( !ev ) {
        var viewHeight = this.$scroll.offsetHeight - (this.$head.style.visible === 'none' ? 0 : this.$head.offsetHeight);
        var viewBottom = this.$scroll.scrollTop;
        if ( el.offsetTop > (viewHeight + this.$scroll.scrollTop) ) {
          this.$scroll.scrollTop = el.offsetTop;
        } else if ( el.offsetTop < viewBottom ) {
          this.$scroll.scrollTop = el.offsetTop;
        }
      }
    };
  })();

  ListView.prototype.addColumn = function(c) {
    this.columns.push(c);
  };

  ListView.prototype.addRow = function(r) {
    this.rows.push(r);
  };

  ListView.prototype.setColumns = function(cols) {
    this.columns = cols || [];
  };

  ListView.prototype.setRows = function(rows) {
    this.rows = rows || [];
  };

  ListView.prototype._getRowData = function(row) {
    var iter = {};
    var cols = this.columns;
    for ( var i = 0; i < cols.length; i++ ) {
      iter[cols[i].key] = row.getAttribute('data-' + cols[i].key);
    }
    return iter;
  };

  ListView.prototype.getItemByKey = function(key, val) {
    var rows = this.$table.tBodies[0].rows;
    var tmp, row;
    for ( var i = 0, l = rows.length; i < l; i++ ) {
      row = rows[i];
      tmp = row.getAttribute('data-' + key);
      if ( tmp == val ) {
        return row;
      }
    }
    return null;
  };

  ListView.prototype.setSelectedIndex = function(idx) {
    if ( this.destroyed ) return;
    var row = this.$table.tBodies[0].rows[idx];
    if ( row ) {
      this._onRowClick(null, row);
    }
  };

  ListView.prototype.setSelected = function(val, key) {
    if ( this.destroyed ) return;
    var row = this.getItemByKey(key, val);
    if ( row ) {
      this._onRowClick(null, row);
    }
  };

  ListView.prototype.getSelected = function() {
    return this.selected;
  };

  /**
   * FileView
   * FIXME: Fix exessive calls to chdir/refresh
   */
  var FileView = function(name, path, opts) {
    opts = opts || {};
    var mimeFilter = [];
    if ( opts.mimeFilter ) {
      mimeFilter = opts.mimeFilter || null;
      if ( !mimeFilter || Object.prototype.toString.call(mimeFilter) !== '[object Array]' ) {
        mimeFilter = [];
      }
    }

    ListView.apply(this, [name, opts]);
    this.opts.dnd = true;

    var self = this;
    this.path = path || '/';
    this.lastPath = this.path;
    this.mimeFilter = mimeFilter;
    this.summary = opts.summary || false;
    this.onActivated = function(path, type, mime) {};
    this.onError = function(error) {};
    this.onFinished = function() {};
    this.onSelected = function(item, el) {};
    this.onRefresh = function() {};
    this.onDropped = function() { console.warn("Not implemented yet!"); };
  };

  FileView.prototype = Object.create(ListView.prototype);

  FileView.prototype.init = function() {
    ListView.prototype.init.apply(this, arguments);

    var cpb = OSjs.Utils.getCompability();
    if ( this.opts.dnd && this.opts.dndDrag && cpb.dnd ) {
      this.onCreateRow = function(el, item, column) {
        var self = this;
        createDraggable(el, {
          type: 'file',
          data: item
        });

        createDroppable(el, {
          onItemDropped: function(ev, el, item, args) {
            return self.onItemDropped.call(self, ev, el, item, args);
          },
          onFilesDropped: function(ev, el, files, args) {
            return self.onFilesDropped.call(self, ev, el, item, args);
          }
        });

      };
    }
  };

  FileView.prototype.render = function(list, dir) {
    if ( this.destroyed ) return;

    var _callback = function(iter) {
      var icon = 'status/gtk-dialog-question.png';

      if ( iter.type == 'dir' ) {
        icon = 'places/folder.png';
      } else if ( iter.type == 'file' ) {
        if ( iter.mime ) {
          if ( iter.mime.match(/^text\//) ) {
            icon = 'mimetypes/txt.png';
          } else if ( iter.mime.match(/^audio\//) ) {
            icon = 'mimetypes/sound.png';
          } else if ( iter.mime.match(/^video\//) ) {
            icon = 'mimetypes/video.png';
          } else if ( iter.mime.match(/^image\//) ) {
            icon = 'mimetypes/image.png';
          } else if ( iter.mime.match(/^application\//) ) {
            icon = 'mimetypes/binary.png';
          }
        }
      }

      return OSjs.API.getThemeResource(icon, 'icon');
    };

    this.setColumns([
      {key: 'image', title: '', type: 'image', callback: _callback, domProperties: {width: "16"}},
      {key: 'filename', title: 'Filename'},
      {key: 'mime', title: 'Mime', domProperties: {width: "150"}},
      {key: 'size', title: 'Size', visible: false},
      {key: 'hrsize', title: 'Size', domProperties: {width: "80"}},
      {key: 'path', title: 'Path', visible: false},
      {key: 'type', title: 'Type', visible: false}
     ]);

    this.setRows(list);

    ListView.prototype.render.apply(this, []);
  };

  FileView.prototype.refresh = function(onRefreshed) {
    if ( this.destroyed ) return;
    return this.chdir(this.path, onRefreshed);
  };

  FileView.prototype.chdir = function(dir, onRefreshed, onError) {
    if ( this.destroyed ) return;
    onRefreshed = onRefreshed || function() {};
    onError = onError || function() {};

    var self = this;
    this.onRefresh.call(this);

    OSjs.API.call('fs', {method: 'scandir', 'arguments' : [dir, {mimeFilter: this.mimeFilter}]}, function(res) {
      if ( self.destroyed ) return;

      var error = null;
      var rendered = false;
      var num = 0;
      var size = 0;

      if ( res ) {
        if ( res.error ) {
          self.onError.call(self, res.error, dir);
        } else {
          self.lastPath = self.path;
          self.path = dir;
          if ( res.result /* && res.result.length*/ ) {
            if ( self.summary && res.result.length ) {
              for ( var i = 0, l = res.result.length; i < l; i++ ) {
                if ( res.result[i].filename !== ".." ) {
                  if ( res.result[i].size ) {
                    size += (res.result[i].size << 0);
                  }
                  num++;
                }
              }
            }

            self.render(res.result, dir);
            rendered = true;
          }
        }

        if ( !rendered ) {
          self.render([], dir);
        }

        self.onFinished(dir, num, size);

        onRefreshed.call(this);
      }
    }, function(error) {
      self.onError.call(self, error, dir);
      onError.call(self, error, dir);
    });
  };

  FileView.prototype._onActivate = function(ev, el) {
    var item = ListView.prototype._onActivate.apply(this, arguments);
    if ( item && item.path ) {
      if ( item.type === 'file' ) {
        this.onActivated(item.path, item.type, item.mime);
      } else {
        this.chdir(item.path);
      }
    }
  };

  FileView.prototype._onSelect = function(ev, el) {
    var item = ListView.prototype._onSelect.apply(this, arguments);
    if ( item && item.path ) {
      this.onSelected(item, el);
    }
  };

  FileView.prototype._onRowClick = function(ev, el) {
    if ( this.destroyed ) return;
    ListView.prototype._onRowClick.apply(this, arguments);
    this._onSelect(ev, el);
  };

  FileView.prototype.getPath = function() {
    return this.path;
  };

  /**
   * Textarea
   */
  var Textarea = function(name, opts) {
    this.$area = null;
    GUIElement.apply(this, arguments);
  };

  Textarea.prototype = Object.create(GUIElement.prototype);

  Textarea.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUITextarea']);
    this.$area = document.createElement('textarea');
    el.appendChild(this.$area);
    return el;
  };

  Textarea.prototype.setText = function(t) {
    if ( this.$area ) {
      this.$area.value = (t || '');
      return true;
    }
    return false;
  };

  Textarea.prototype.getText = function() {
    return this.$area ? this.$area.value : '';
  };

  Textarea.prototype.focus = function() {
    if ( !GUIElement.prototype.focus.apply(this, arguments) ) return false;
    if ( this.$area ) this.$area.focus();
    return true;
  };

  /**
   * Color Swatch
   * FIXME: Refactor - GUIElement
   */
  var ColorSwatch = function(w, h, onSelect) {
    this.$element = null;
    this.$canvas  = null;
    this.width    = w || 100;
    this.height   = h || 100;
    this.onSelect = onSelect || function(r, g, b) {};

    if ( !OSjs.Utils.getCompability()['canvas'] ) {
      throw "Canvas is not supported on your platform!";
    }

    this.init();
  };

  ColorSwatch.prototype.init = function() {
    var el        = document.createElement('div');
    el.className  = 'GUIColorSwatch';

    var cv        = document.createElement('canvas');
    cv.width      = this.width;
    cv.height     = this.height;

    var ctx       = cv.getContext('2d');
    var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);

    // Create color gradient
    gradient.addColorStop(0,    "rgb(255,   0,   0)");
    gradient.addColorStop(0.15, "rgb(255,   0, 255)");
    gradient.addColorStop(0.33, "rgb(0,     0, 255)");
    gradient.addColorStop(0.49, "rgb(0,   255, 255)");
    gradient.addColorStop(0.67, "rgb(0,   255,   0)");
    gradient.addColorStop(0.84, "rgb(255, 255,   0)");
    gradient.addColorStop(1,    "rgb(255,   0,   0)");

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Create semi transparent gradient (white -> trans. -> black)
    gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0,   "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(0,     0,   0, 0)");
    gradient.addColorStop(1,   "rgba(0,     0,   0, 1)");

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var self = this;
    cv.addEventListener('click', function(e) {
      var data = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      self.onSelect.call(self, data[0], data[1], data[2]);
    }, false);

    el.appendChild(cv);
    this.$element = el;
    this.$canvas = cv;
  };

  /**
   * Status Bar Element
   */
  var StatusBar = function(name) {
    this.$contents = null;
    GUIElement.apply(this, [name, {focusable: false}]);
  };

  StatusBar.prototype = Object.create(GUIElement.prototype);

  StatusBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIStatusBar']);
    this.$contents = document.createElement('div');
    this.$contents.className = "Contents";
    el.appendChild(this.$contents);
    return el;
  };

  StatusBar.prototype.setText = function(t) {
    this.$contents.innerHTML = t;
  };

  StatusBar.prototype.appendChild = function(el) {
    this.$contents.appendChild(el);
  };

  /**
   * Slider Element
   * TODO: Mouse click react
   */
  var Slider = function(name, opts, onUpdate) {
    this.min      = opts.min || 0;
    this.max      = opts.max || 0;
    this.val      = opts.val || 0;
    this.steps    = opts.steps || 1;
    this.type     = opts.type || 'horizontal';
    this.$root    = null;
    this.$button  = null;

    this.onUpdate = onUpdate || function(val, perc) { console.warn("GUIScroll onUpdate() missing...", val, '('+perc+'%)'); };

    GUIElement.apply(this, [name, {}]);
  };

  Slider.prototype = Object.create(GUIElement.prototype);

  Slider.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUISlider']);
    el.className += ' ' + this.type;

    this.$root = document.createElement('div');
    this.$root.className = 'Root';

    this.$button = document.createElement('div');
    this.$button.className = 'Button';

    var scrolling = false;
    var startX = 0;
    var startY = 0;
    var elX = 0;
    var elY = 0;
    var maxX = 0;
    var maxY = 0;
    var self = this;

    var _onMouseMove = function(ev) {
      if ( !scrolling ) return;

      var newX, newY;
      if ( self.type == 'horizontal' ) {
        var diffX = (ev.clientX - startX);
        newX = elX + diffX;
        if ( newX < 0 ) newX = 0;
        if ( newX > maxX ) newX = maxX;

        self.$button.style.left = newX + 'px';
      } else {
        var diffY = (ev.clientY - startY);
        newY = elY + diffY;
        if ( newY < 0 ) newY = 0;
        if ( newY > maxY ) newY = maxY;
        self.$button.style.top = newY + 'px';
      }

      self.onSliderUpdate(newX, newY, maxX, maxY);
    };

    var _onMouseUp = function(ev) {
      scrolling = false;
      document.removeEventListener('mousemove', _onMouseMove, false);
      document.removeEventListener('mouseup', _onMouseUp, false);
    };

    var _onMouseDown = function(ev) {
      ev.preventDefault();

      scrolling = true;
      if ( self.type == 'horizontal' ) {
        startX  = ev.clientX;
        elX     = self.$button.offsetLeft;
        maxX    = self.$element.offsetWidth - self.$button.offsetWidth;
      } else {
        startY  = ev.clientY;
        elY     = self.$button.offsetTop;
        maxY    = self.$element.offsetHeight - self.$button.offsetHeight;
      }
      document.addEventListener('mousemove', _onMouseMove, false);
      document.addEventListener('mouseup', _onMouseUp, false);
    };

    this.$button.addEventListener('mousedown', _onMouseDown, false);
    this._addHook('destroy', function() {
      this.$button.removeEventListener('mousedown', _onMouseDown, false);
    });

    el.appendChild(this.$root);
    el.appendChild(this.$button);

    return el;
  };

  Slider.prototype.setPercentage = function(p) {
    var cd = (this.max - this.min);
    var val = (cd*(p/100)) << 0;
    this.onUpdate.call(this, val, p);
  };

  Slider.prototype.onSliderUpdate = function(x, y, maxX, maxY) {
    var p = null;
    if ( typeof x !== 'undefined' ) {
      p = (x/maxX) * 100;
    } else if ( typeof y !== 'undefined' ) {
      p = (y/maxY) * 100;
    }
    if ( p !== null ) {
      this.setPercentage(p);
    }
  };

  Slider.prototype.setValue = function(val) {
    if ( val < this.min || val > this.max ) return;
    this.val = val;

    var rw = this.$element.offsetWidth;
    var bw = this.$button.offsetWidth;
    var dw = (rw - bw);

    var cd = (this.max - this.min);
    var cp = this.val / (cd/100);

    var left = (dw/100)*cp;
    this.$button.style.left = left + 'px';
  };

  /**
   * Toolbar Element
   */
  var ToolBar = function(name, opts) {
    this.$container = null;
    this.$active = null;

    this.items = {};
    this.oriantation = opts.orientation || 'horizontal';
    GUIElement.apply(this, [name, {}]);
  };

  ToolBar.prototype = Object.create(GUIElement.prototype);

  ToolBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIToolbar']);
    this.$container = document.createElement('ul');
    this.$container.className = 'Container ' + this.orientation;
    el.appendChild(this.$container);
    return el;
  };

  ToolBar.prototype.addItem = function(name, opts) {
    this.items[name] = opts;
  };

  ToolBar.prototype.addSeparator = (function() {
    var _sid = 0;
    return function() {
      this.items['separator_' + (_sid++)] = null;
    };
  })();

  ToolBar.prototype.render = function() {
    if ( !this.$container ) return;

    var el, btn, img, span, item;
    var self = this;
    for ( var i in this.items ) {
      if ( this.items.hasOwnProperty(i) ) {
        item = this.items[i];
        el = document.createElement('li');

        if ( item === null ) {
          el.className = 'Separator ' + i;
          this.$container.appendChild(el);
          continue;
        }

        el.className = 'Item ' + i;
        switch ( item.type ) {
          case 'custom' :
            btn = document.createElement('div');
          break;

          default :
            btn = document.createElement('button');
          break;
        }

        if ( typeof item.onCreate === 'function' ) {
          item.onCreate.call(this, i, item, el, btn);
        } else {
          if ( item.icon ) {
            img = document.createElement('img');
            img.alt = item.icon;
            img.src = item.icon;
            btn.appendChild(img);
            el.className += ' HasIcon';
          }
          if ( item.title ) {
            span = document.createElement('span');
            span.innerHTML = item.title;
            btn.appendChild(span);
            el.className += ' HasTitle';
          }
        }

        btn.onclick = (function(key, itm) {
          return function(ev) {
            if ( itm.toggleable ) {
              if ( self.$active ) {
                self.$active.className = self.$active.className.replace(/\s?Active/, '');
              }
              self.$active = this;
              self.$active.className += ' Active';
            }

            self._onItemSelect(ev, this, key, itm);
          };
        })(i, item);

        el.appendChild(btn);
        this.$container.appendChild(el);
      }
    }
  };

  ToolBar.prototype._onItemSelect = function(ev, el, name, item) {
    if ( item && item.onClick ) {
      item.onClick(ev, el, name, item);
    }
  };

  ToolBar.prototype.getItem = function(name) {
    if ( this.$container ) {
      var children = this.$container.childNodes;
      for ( var i = 0, l = children.length; i < l; i++ ) {
        if ( (new RegExp(name)).test(children[i].className) ) {
          return children[i];
        }
      }
    }
    return null;
  };

  /**
   * ProgressBar Element
   */
  var ProgressBar = function(name, percentage) {
    this.$container = null;
    this.$bar = null;
    this.$label = null;
    this.percentage = percentage || 0;

    GUIElement.apply(this, [name, {}]);
  };

  ProgressBar.prototype = Object.create(GUIElement.prototype);

  ProgressBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIProgressBar']);
    this.$container = document.createElement('div');
    this.$container.className = 'Container';

    this.$bar = document.createElement('div');
    this.$bar.className = 'Bar';
    this.$container.appendChild(this.$bar);

    this.$label = document.createElement('div');
    this.$label.className = 'Label';
    this.$container.appendChild(this.$label);

    el.appendChild(this.$container);

    this.setPercentage(this.percentage);
    return el;
  };

  ProgressBar.prototype.setPercentage = function(p) {
    if ( p < 0 || p > 100 ) return;
    this.percentage = (p << 0);
    this.$bar.style.width = this.percentage + '%';
    this.$label.innerHTML = this.percentage + '%';
  };


  /**
   * Canvas Element
   */
  var Canvas = function(name, opts) {
    opts = opts || {};
    if ( !OSjs.Utils.getCompability().canvas ) {
      throw "Your platform does not support canvas :/";
    }

    this.$canvas    = null;
    this.$context   = null;
    this.width      = opts.width  || null;
    this.height     = opts.height || null;
    this.type       = opts.type   || 'image/png';

    GUIElement.apply(this, [name, {}]);
  };

  Canvas.prototype = Object.create(GUIElement.prototype);

  Canvas.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUICanvas']);

    this.$canvas = document.createElement('canvas');
    if ( this.width !== null ) {
      this.$canvas.width = this.width;
    }
    if ( this.height !== null ) {
      this.$canvas.height = this.height;
    }
    this.$context = this.$canvas.getContext('2d');

    el.appendChild(this.$canvas);
    return el;
  };

  Canvas.prototype.clear = function() {
    if ( this.$context ) {
      this.$context.clearRect(0, 0, this.width, this.height);
      return true;
    }
    return false;
  };

  Canvas.prototype.fillColor = function(color) {
    this.$context.fillStyle = color;
    this.$context.fillRect(0, 0, this.width, this.height);
  };

  Canvas.prototype.resize = function(w, h) {
    this.width = w;
    this.height = h;
    this.$canvas.width = w;
    this.$canvas.height = h;
  };

  Canvas.prototype.func = function(f, args) {
    if ( !f || !args ) {
      throw "Canvas::func() expects a function name and arguments";
    }
    if ( this.$canvas && this.$context ) {
      return this.$context[f].apply(this.$context, args);
    }
    return null;
  };

  Canvas.prototype.setImageData = function(src, onDone, onError) {
    if ( !this.$context ) return;

    onDone = onDone || function() {};
    onError = onError || function() {};
    var self = this;
    var img = new Image();
    var can = this.$canvas;
    var ctx = this.$context;
    var mime = null;

    try {
      mime = src.split(/;/)[0].replace(/^data\:/, '');
    } catch ( e ) {
      throw "Cannot setImageData() invalid or no mime";
      return;
    }

    this.type = mime;

    img.onload = function() {
      can.width = this.width;
      can.height = this.height;
      self.width = can.width;
      self.height = can.height;
      ctx.drawImage(img, 0, 0);
      onDone.apply(self, arguments);
    };
    img.onerror = function() {
      onError.apply(self, arguments);
    };
    img.src = src;
  };

  Canvas.prototype.getCanvas = function() {
    return this.$canvas;
  };

  Canvas.prototype.getContext = function() {
    return this.$context;
  };

  Canvas.prototype.getColorAt = function(x, y) {
    var imageData = this.$context.getImageData(0, 0, this.$canvas.width, this.$canvas.height).data;
    var index = ((x + y * this.$canvas.width) * 4);

    var rgb = {r:imageData[index + 0], g:imageData[index + 1], b:imageData[index + 2], a:imageData[index + 3]};
    var hex = OSjs.Utils.RGBtoHex(rgb);
    return {rgb: rgb, hex:  hex};
  };

  Canvas.prototype.getImageData = function(type) {
    if ( this.$context && this.$canvas ) {
      type = type || this.type;
      return this.$canvas.toDataURL(type);
    }
    return null;
  };

  //
  // EXPORTS
  //
  OSjs.GUI.GUIElement   = GUIElement;

  OSjs.GUI.MenuBar      = MenuBar;
  OSjs.GUI.ListView     = ListView;
  OSjs.GUI.FileView     = FileView;
  OSjs.GUI.Textarea     = Textarea;
  OSjs.GUI.ColorSwatch  = ColorSwatch;
  OSjs.GUI.StatusBar    = StatusBar;
  OSjs.GUI.Slider       = Slider;
  OSjs.GUI.ToolBar      = ToolBar;
  OSjs.GUI.Canvas       = Canvas;
  OSjs.GUI.ProgressBar  = ProgressBar;

  OSjs.GUI.createDraggable  = createDraggable;
  OSjs.GUI.createDroppable  = createDroppable;

  var _MENU;
  OSjs.GUI.createMenu = function(items, pos) {
    items = items || [];
    pos = pos || {x: 0, y: 0};

    OSjs.GUI.blurMenu();

    _MENU = new Menu(items);
    _MENU.show(pos);
    return _MENU;
  };
  OSjs.GUI.blurMenu   = function() {
    if ( _MENU ) {
      _MENU.destroy();
      _MENU = null;
    }
  };

})();
