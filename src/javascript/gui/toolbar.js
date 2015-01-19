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
(function(GUIElement) {
  'use strict';

  /**
   * Toolbar Element
   *
   * @param String    name    Name of GUIElement (unique)
   * @param Object    opts    A list of options
   *
   * @option  opts  String    orientation     Orientation (default=horizontal)
   *
   * @see OSjs.Core.GUIElement
   * @api OSjs.GUI.Toolbar
   *
   * @extends GUIElement
   * @class
   */
  var ToolBar = function(name, opts) {
    opts = opts || {};

    this.$container = null;
    this.$active    = null;

    this.items        = {};
    this.orientation  = opts.orientation || 'horizontal';

    GUIElement.apply(this, [name, {}]);
  };

  ToolBar.prototype = Object.create(GUIElement.prototype);

  ToolBar.prototype.init = function() {
    var el = GUIElement.prototype.init.apply(this, ['GUIToolbar']);
    this.$container = document.createElement('ul');
    this.$container.className = 'Container';
    el.className += ' ' + this.orientation;
    el.appendChild(this.$container);
    return el;
  };

  /**
   * Add an item to the toolbar
   *
   * @param   String      name      Item Name (unique)
   * @param   Object      opts      Item Options
   *
   * @option  opts    String      type          The item type ('custom' to render something other than a button)
   * @option  opts    Function    onCreate      If 'custom' => fn(itemName, itemOptions, outerEl, innerEl)
   * @option  opts    String      title         Button title
   * @option  opts    String      icon          Button icon
   * @option  opts    String      tooltip       Button tooltip (defaults to title)
   * @option  opts    boolean     toggleable    Button toggleable?
   *
   * @return  void
   *
   * @method ToolBar::addItem()
   */
  ToolBar.prototype.addItem = function(name, opts) {
    this.items[name] = opts;
  };

  /**
   * Add a separator to the toolbar
   *
   * @return  void
   * @method  ToolBar::addSeparator()
   */
  ToolBar.prototype.addSeparator = (function() {
    var _sid = 1;
    return function() {
      this.items['separator_' + _sid] = null;
      _sid++;
    };
  })();

  /**
   * Render the Toolbar
   *
   * @return  void
   *
   * @method  ToolBar::render()
   */
  ToolBar.prototype.render = function() {
    if ( !this.$container ) { return; }
    var self = this;

    function _bindMouseClick(btn, key, itm) {
      btn.onclick = function(ev) {
        if ( itm.grouped ) {
          OSjs.Utils.$removeClass(self.$active, 'Active');
          self.$active = this;
          OSjs.Utils.$addClass(self.$active, 'Active');
        }

        if ( itm.toggleable ) {
          self.$active = this;
          if ( OSjs.Utils.$hasClass(self.$active, 'Active') ) {
            OSjs.Utils.$removeClass(self.$active, 'Active');
          } else {
            OSjs.Utils.$addClass(self.$active, 'Active');
          }
        }

        self._onItemSelect(ev, this, key, itm);
      };
    }

    Object.keys(this.items).forEach(function(i) {
      var btn, img, span;

      var item = self.items[i] || null;
      var el = document.createElement('li');

      if ( item ) {
        self.items[i]._element = el;
      }

      if ( !item ) {
        el.className = 'Separator ' + i;
        self.$container.appendChild(el);
        return true;
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
        item.onCreate.call(self, i, item, el, btn);
      } else {
        if ( item.icon ) {
          img = document.createElement('img');
          img.alt = ''; //item.icon;
          img.src = item.icon;
          btn.appendChild(img);
          el.className += ' HasIcon';
        }
        if ( item.title ) {
          span = document.createElement('span');
          span.appendChild(document.createTextNode(item.title));
          btn.appendChild(span);
          el.className += ' HasTitle';
        }
      }

      if ( item.tooltip && !btn.title ) {
        btn.title = item.tooltip;
      }

      _bindMouseClick(btn, i, item);

      el.appendChild(btn);
      self.$container.appendChild(el);

      return true;
    });

  };

  ToolBar.prototype._onItemSelect = function(ev, el, name, item) {
    if ( item && item.onClick ) {
      item.onClick(ev, el, name, item);
    }
  };

  /**
   * Gets an item
   *
   * @param   String    name      The item name (unique)
   *
   * @return  Object
   */
  ToolBar.prototype.getItem = function(name) {
    return this.items[name];
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.GUI.ToolBar      = ToolBar;

})(OSjs.Core.GUIElement);
