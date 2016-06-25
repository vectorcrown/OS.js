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
(function() {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // DOM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Get element by ID
   *
   * @param   String    id      DOM Element ID
   *
   * @return  DOMElement        Found element or null
   *
   * @api     OSjs.Utils.$()
   */
  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };

  /**
   * Remove unwanted characters from ID or className
   *
   * @param   String    str     The name
   *
   * @return  String            The new name
   *
   * @api     OSjs.Utils.$safeName()
   */
  OSjs.Utils.$safeName = function(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
  };

  /**
   * Remove given element from parent
   *
   * @param   DOMElement    node      The DOM Element
   *
   * @return  null
   *
   * @api     OSjs.Utils.$remove()
   */
  OSjs.Utils.$remove = function(node) {
    if ( node && node.parentNode ) {
      node.parentNode.removeChild(node);
    }
    return null;
  };

  /**
   * Empty this element (remove children)
   *
   * @param   DOMElement    myNode      The DOM Element
   *
   * @return  void
   *
   * @api     OSjs.Utils.$empty()
   */
  OSjs.Utils.$empty = function(myNode) {
    if ( myNode ) {
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }
  };

  /**
   * Get CSS style attribute
   *
   * @param   DOMElement    oElm          The DOM Element
   * @param   String        strCssRule    The CSS rule to get
   *
   * @return  String                      Style attribute
   *
   * @api     OSjs.Utils.$getStyle()
   */
  OSjs.Utils.$getStyle = function(oElm, strCssRule) {
    var strValue = '';
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
      strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
    } else if ( oElm.currentStyle ) {
      strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase();
      });
      strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
  };

  /**
   * Get element absolute position
   *
   * Modern browsers will return getBoundingClientRect()
   * See DOM documentation
   *
   * @param   DOMElement      el        The Element to find position of
   * @param   DOMElement      parentEl  Optional parent to end loop in
   *
   * @return  Object                    The bounding box
   *
   * @api     OSjs.Utils.$position()
   */
  OSjs.Utils.$position = function(el, parentEl) {
    if ( el ) {
      if ( parentEl ) {
        var result = {left:0, top:0, width: el.offsetWidth, height: el.offsetHeight};
        while ( true ) {
          result.left += el.offsetLeft;
          result.top  += el.offsetTop;
          if ( el.offsetParent ===  parentEl || el.offsetParent === null ) {
            break;
          }
          el = el.offsetParent;
        }
        return result;
      }
      return el.getBoundingClientRect();
    }
    return null;
  };

  /**
   * Traverses down to the parentnode validated by filter
   *
   * @param   DOMElement      el        The Element to find position of
   * @param   Function        cb        The callback function => fn(node) return true/false here
   *
   * @return  DOMElement      el        The DOM element
   *
   * @api     OSjs.Utils.$parent()
   */
  OSjs.Utils.$parent = function(el, cb) {
    var result = null;

    if ( el && cb ) {
      var current = el;
      while ( current.parentNode ) {
        if ( cb(current) ) {
          result = current;
          break;
        }
        current = current.parentNode;
      }
    }

    return result;
  };

  /**
   * Get the index of an element within a node
   *
   * @param   DOMElement    el          Element to check
   * @param   DOMElement    parentEl    Optional parent (automatically checked)
   *
   * @return  int                       The index
   *
   * @api     OSjs.Utils.$index()
   */
  OSjs.Utils.$index = function(el, parentEl) {
    if ( el ) {
      parentEl = parentEl || el.parentNode;
      if ( parentEl ) {
        var nodeList = Array.prototype.slice.call(parentEl.children);
        var nodeIndex = nodeList.indexOf(el, parentEl);
        return nodeIndex;
      }
    }
    return -1;
  };

  /**
   * Selects range in a text field
   *
   * @param     DOMElement      field     The DOM Element
   * @param     int             start     Start position
   * @param     int             end       End position
   *
   * @return    void
   *
   * @api       OSjs.Utils.$selectRange()
   */
  OSjs.Utils.$selectRange = function(field, start, end) {
    if ( !field ) { throw new Error('Cannot select range: missing element'); }
    if ( typeof start === 'undefined' || typeof end === 'undefined' ) { throw new Error('Cannot select range: mising start/end'); }

    if ( field.createTextRange ) {
      var selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if ( field.setSelectionRange ) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if ( typeof field.selectionStart !== 'undefined' ) {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
  };

  /**
   * Add a className to a DOM Element
   *
   * @param   DOMElement      el      The dom Element
   * @param   String          name    The class name
   *
   * @return  void
   *
   * @api     OSjs.Utils.$addClass()
   */
  OSjs.Utils.$addClass = function(el, name) {
    if ( el && name && !this.$hasClass(el, name) ) {
      el.className += (el.className ? ' ' : '') + name;
    }
  };

  /**
   * Remove a className from a DOM Element
   *
   * @param   DOMElement      el      The dom Element
   * @param   String          name    The class name
   *
   * @return  void
   *
   * @api     OSjs.Utils.$removeClass()
   */
  OSjs.Utils.$removeClass = function(el, name) {
    if ( el && name && this.$hasClass(el, name) ) {
      var re = new RegExp('\\s?' + name);
      el.className = el.className.replace(re, '');
    }
  };

  /**
   * Check if a DOM Element has given className
   *
   * @param   DOMElement      el      The dom Element
   * @param   String          name    The class name
   *
   * @return  boolean
   *
   * @api     OSjs.Utils.$hasClass()
   */
  OSjs.Utils.$hasClass = function(el, name) {
    if ( el && name ) {
      return el.className.replace(/\s+/, ' ').split(' ').indexOf(name) >= 0;
    }
    return false;
  };

  /**
   * Escapes the given string for HTML
   *
   * works sort of like PHPs htmlspecialchars()
   *
   * @param   String    str       Input
   *
   * @return  String              Escaped HTML
   *
   * @api     OSjs.Utils.$escape()
   */
  OSjs.Utils.$escape = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  /**
   * Create a link stylesheet tag
   *
   * @param   String      src     The URL of resource
   *
   * @return  DOMElement          The tag
   *
   * @api     OSjs.Utils.$createCSS()
   */
  OSjs.Utils.$createCSS = function(src) {
    var res    = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(res);

    res.rel    = 'stylesheet';
    res.type   = 'text/css';
    res.href   = src;

    return res;
  };

  /**
   * Create a script tag
   *
   * @param   String      src                   The URL of resource
   * @param   Function    onreadystatechange    readystatechange callback
   * @param   Function    onload                onload callback
   * @param   Function    onerror               onerror callback
   *
   * @return  DOMElement                        The tag
   *
   * @api     OSjs.Utils.$createJS()
   */
  OSjs.Utils.$createJS = function(src, onreadystatechange, onload, onerror) {
    var res                = document.createElement('script');
    res.type               = 'text/javascript';
    res.charset            = 'utf-8';
    res.onreadystatechange = onreadystatechange || function() {};
    res.onload             = onload             || function() {};
    res.onerror            = onerror            || function() {};
    res.src                = src;

    document.getElementsByTagName('head')[0].appendChild(res);

    return res;
  };

  /**
   * Check if event happened on a form element
   *
   * @param   DOMEvent    ev      DOM Event
   * @param   Array       types   Array of types
   *
   * @return  boolean             If is a form element
   *
   * @api     OSjs.Utils.$isFormElement()
   */
  OSjs.Utils.$isFormElement = function(ev, types) {
    types = types || ['TEXTAREA', 'INPUT', 'SELECT'];

    var d = ev.srcElement || ev.target;
    if ( d ) {
      if ( types.indexOf(d.tagName.toUpperCase()) >= 0 ) {
        if ( !(d.readOnly || d.disabled) ) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Alias
   *
   * @see OSjs.Utils.$isFormElement()
   * @api OSjs.Utils.$isInput()
   */
  OSjs.Utils.$isInput = function(ev) {
    return this.$isFormElement(ev); //, ['TEXTAREA', 'INPUT']);
  };

})();
