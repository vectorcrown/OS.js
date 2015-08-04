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

  function createEntry(e) {
    var entry = GUI.Helpers.createElement('gui-icon-view-entry', e);
    return entry;
  }

  function initEntry(el, cel) {
    // TODO: Custom Icon Size
    var icon = cel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(cel);

    var dicon = document.createElement('div');
    var dimg = document.createElement('img');
    dimg.src = icon;
    dicon.appendChild(dimg);

    var dlabel = document.createElement('div');
    var dspan = document.createElement('span');
    dspan.appendChild(document.createTextNode(label));
    dlabel.appendChild(dspan);

    GUI.Elements._dataview.bindEntryEvents(el, cel, 'gui-icon-view-entry');

    cel.appendChild(dicon);
    cel.appendChild(dlabel);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  GUI.Elements['gui-icon-view'] = {
    bind: GUI.Elements._dataview.bind,

    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-icon-view-entry'));
    },

    build: function(el) {
      el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
        initEntry(el, cel);
      });
    },

    set: function(el, param, value, arg) {
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, el.querySelectorAll('gui-icon-view-entry'), value, arg);
        return true;
      }

      return false;
    },

    call: function(el, method, args) {
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var entry = createEntry(e);
          el.appendChild(entry);
          initEntry(el, entry);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-icon-view-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-icon-view-entry', el, createEntry, initEntry);
      }
    }

  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
