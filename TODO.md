
## Roadmap

## TODOs
* Refactor some of the dialogs
* Rename fs api function (`file_get_contents` => `fswrite` etc.)
* Finish bew build system
* Finish Node.js backend
* Create reserved strings for locales in `locales.js` (for core messages etc)
* Fix crazy IE bug where calling blur() actually minimizes the browser window *facepalm*

### Applications
* Refactor DefaultApplication helper
* Writer -- Check for changes before opening/new file
* Finish Music Player
* Refactor from currentX to currentFile.x for file stuff
* CoreWM -- Finish panel item options

### GUI
* GUIScrollbar
* More Themes
* Finish new Menu implementation
* Custom styling for GUISelect
* Custom styling for GUISelectList
* Custom styling for GUICheckbox
* Custom styling for GUIRadio

### Not prioritized
* Create bin/ scripts for nodejs (redo create-application for PHP)
* Offline resource pre-loading
* Offline VFS
* Full Source code documentation
* Mobile version
* CoreWM: Custom keyboard binding shortcuts
* Misc FIXME and TODO in source-code
  - `grep -e 'TODO\|FIXME' frontend/* apps/*/*`

## Ideas for solving misc problems
* Unfocused windows should have a transparent overlay to prevent clicks+iframe probles
  * When DnD hide
