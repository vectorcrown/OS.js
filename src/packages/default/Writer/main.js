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
(function(DefaultApplication, DefaultApplicationWindow, Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWriterWindow(app, metadata, scheme, file) {
    DefaultApplicationWindow.apply(this, ['ApplicationWriterWindow', {
      allow_drop: true,
      icon: metadata.icon,
      title: metadata.name,
      width: 550,
      height: 400
    }, app, scheme, file]);

    this.color = {
      background : '#ffffff',
      foreground : '#000000'
    };
    this.font = {
      name: OSjs.Core.getHandler().getConfig('Fonts')['default'],
      size: 14
    };
  }

  ApplicationWriterWindow.prototype = Object.create(DefaultApplicationWindow.prototype);
  ApplicationWriterWindow.constructor = DefaultApplicationWindow.prototype;

  ApplicationWriterWindow.prototype.init = function(wmRef, app, scheme) {
    var root = DefaultApplicationWindow.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'WriterWindow', root);
    var text = scheme.find(this, 'Text');
    var frame = text.querySelector('iframe');

    var buttons = {
      'text-bold': {
        command: 'bold'
      },
      'text-italic': {
        command: 'italic'
      },
      'text-underline': {
        command: 'underline'
      },
      'text-strikethorugh': {
        command: 'strikeThrough'
      },

      'justify-left': {
        command: 'justifyLeft'
      },
      'justify-center': {
        command: 'justifyCenter'
      },
      'justify-right': {
        command: 'justifyRight'
      },

      'indent': {
        command: 'indent'
      },
      'unindent': {
        command: 'outdent'
      }
    };

    function getSelectionStyle() {
      function _call(cmd) {
        return text._call('query', [cmd]);
      }

      var style = {
        fontName: (_call('fontName') || '').split(',')[0],
        fontSize: parseInt(_call('fontSize'), 10),
        foreColor: _call('foreColor'),
        hiliteColor: _call('hiliteColor')
      };

      Object.keys(buttons).forEach(function(b) {
        var button = buttons[b];
        style[button.command] = {
          button: b,
          value:_call(button.command)
        };
      });
      return style;
    }

    function createColorDialog(current, cb) {
      self._toggleDisabled(true);
      API.createDialog('Color', {
        color: current
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          cb(result.hex);
        }
      });
    }

    function createFontDialog(current, cb) {
      self._toggleDisabled(true);
      API.createDialog('Font', {
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          cb(result);
        }
      });
    }

    var back = scheme.find(this, 'Background').on('click', function() {
      createColorDialog(self.color.background, function(hex) {
        text._call('command', ['hiliteColor', false, hex]);
        self.color.background = hex;
        back.set('value', hex);
      });
    });
    var front = scheme.find(this, 'Foreground').on('click', function() {
      createColorDialog(self.color.foreground, function(hex) {
        text._call('command', ['foreColor', false, hex]);
        self.color.foreground = hex;
        front.set('value', hex);
      });
    });

    var font = scheme.find(this, 'Font').on('click', function() {
      createFontDialog(null, function(font) {
        text._call('command', ['fontName', false, font.fontName]);
        text._call('command', ['fontSize', false, font.fontSize]);
        self.font.name = font.fontName;
        self.font.size = font.fontSize;
      });
    });

    root.querySelectorAll('gui-toolbar > gui-button').forEach(function(b) {
      var id = b.getAttribute('data-id');
      var button = buttons[id];
      if ( button ) {
        (new GUI.Element(b)).on('click', function() {
          text._call('command', [button.command]);
        });
      }
    });

    function updateToolbar(style) {
      back.set('value', style.hiliteColor);
      front.set('value', style.foreColor);
      if ( font.fontName ) {
        font.set('label', Utils.format('{0} ({1})', style.fontName, style.fontSize.toString()));
      }
    }

    function updateSelection() {
      var style = getSelectionStyle();
      updateToolbar(style);
    }

    back.set('value', this.color.background);
    front.set('value', this.color.foreground);
    font.set('label', Utils.format('{0} ({1})', this.font.name, this.font.size.toString()));

    text.on('selection', function() {
      updateSelection();
    });

    return root;
  };

  ApplicationWriterWindow.prototype.updateFile = function(file) {
    DefaultApplicationWindow.prototype.updateFile.apply(this, arguments);
    this._scheme.find(this, 'Text').$element.focus();
  };

  ApplicationWriterWindow.prototype.showFile = function(file, content) {
    this._scheme.find(this, 'Text').set('value', content || '');
    DefaultApplicationWindow.prototype.showFile.apply(this, arguments);
  };

  ApplicationWriterWindow.prototype.getFileData = function() {
    return this._scheme.find(this, 'Text').get('value');
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWriter(args, metadata) {
    DefaultApplication.apply(this, ['ApplicationWriter', args, metadata, {
      extension: 'odoc',
      mime: 'osjs/document',
      filename: 'New text file.odoc'
    }]);
  }

  ApplicationWriter.prototype = Object.create(DefaultApplication.prototype);
  ApplicationWriter.constructor = DefaultApplication;

  ApplicationWriter.prototype.destroy = function() {
    return DefaultApplication.prototype.destroy.apply(this, arguments);
  };

  ApplicationWriter.prototype.init = function(settings, metadata) {
    var self = this;
    DefaultApplication.prototype.init.call(this, settings, metadata, function(scheme, file) {
      self._addWindow(new ApplicationWriterWindow(self, metadata, scheme, file));
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWriter = OSjs.Applications.ApplicationWriter || {};
  OSjs.Applications.ApplicationWriter.Class = ApplicationWriter;

})(OSjs.Helpers.DefaultApplication, OSjs.Helpers.DefaultApplicationWindow, OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
