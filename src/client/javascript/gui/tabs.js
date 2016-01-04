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

  function toggleActive(el, eidx, idx) {
    Utils.$removeClass(el, 'gui-active');
    if ( eidx === idx ) {
      Utils.$addClass(el, 'gui-active');
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Element: 'gui-tabs'
   *
   * A container with tabs for displaying content.
   *
   * Events:
   *  select        When tab has changed => fn(ev)
   *  activat       Alias of 'select'
   *
   * @api OSjs.GUI.Elements.gui-tabs
   * @class
   */
  GUI.Elements['gui-tabs'] = {
    bind: function(el, evName, callback, params) {
      if ( (['select', 'activate']).indexOf(evName) !== -1 ) {
        evName = 'change';
      }
      if ( evName === 'change' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var tabs = document.createElement('ul');
      var contents = document.createElement('div');

      var lastTab;
      function selectTab(ev, idx, tab) {
        if ( lastTab ) {
          Utils.$removeClass(lastTab, 'gui-active');
        }

        tabs.querySelectorAll('li').forEach(function(el, eidx) {
          toggleActive(el, eidx, idx);
        });
        contents.querySelectorAll('gui-tab-container').forEach(function(el, eidx) {
          toggleActive(el, eidx, idx);
        });

        lastTab = tab;
        Utils.$addClass(tab, 'gui-active');

        el.dispatchEvent(new CustomEvent('_change', {detail: {index: idx}}));
      }

      el.querySelectorAll('gui-tab-container').forEach(function(el, idx) {
        var tab = document.createElement('li');
        var label = GUI.Helpers.getLabel(el);

        Utils.$bind(tab, 'click', function(ev) {
          selectTab(ev, idx, tab);
        }, false);

        tab.appendChild(document.createTextNode(label));
        tabs.appendChild(tab);
        contents.appendChild(el);
      });

      el.appendChild(tabs);
      el.appendChild(contents);

      var currentTab = parseInt(el.getAttribute('data-selected-index'), 10) || 0;
      selectTab(null, currentTab);
    }
  };

})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);
