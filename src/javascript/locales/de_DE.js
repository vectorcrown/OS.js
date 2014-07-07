"use strict";
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

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.de_DE = {

    // core.js

    "Error opening file": "Fehler beim Öffnen der Datei",
    "No window manager is running": "Es wird kein Fenster-Manager ausgeführt",
    "The file '<span>{0}</span>' could not be opened": "Die Datei '<span>{0}</span>' kann nicht geöffnet werden",
    "Could not find any Applications with support for '{0}' files": "Keine Anwendung gefunden, die den Datentyp '{0}' unterstützt",

    'Failed to launch Application': 'Fehler beim Starten der Anwendung',
    'An error occured while trying to launch: {0}': 'Ein Fehler ist aufgetreten, während des Versuchs "{0}" zu starten',
    "The application '{0}' is already launched and allows only one instance!": "Anwendung '{0}' ist bereits gestartet und erlaubt nur eine Instanz",
    "Application '{0}' construct failed: {1}": "Anwendung '{0}' construct gescheitert: {1}",
    "Application '{0}' init() failed: {1}": "Anwendung '{0}' init() gescheitert: {1}",
    "Application resources missing for '{0}' or it failed to load!": "Anwendungsressourcen fehlen oder wurden nicht geladen für: {0}",
    "Application '{0}' preloading failed: \n{1}": "Anwendung '{0}' preloading gescheitert: \n{1}",
    "Failed to launch '{0}'. Application manifest data not found!": "'{0}' konnte nicht gestartet werden. Anwendungsmanifest nicht gefunden!",
    "Failed to launch '{0}'. Your browser does not support: {1}" : "Klarte ikke starte '{0}'. Uw browser ondersteunt geen: {1}",

    'JavaScript Error Report': 'JavaScript Fehlerbericht',
    'An unexpected error occured, maybe a bug.': 'Ein unerwarteter Fehler ist aufgetreten, möglicherweise ein Bug',
    'Failed to initialize OS.js': 'OS.js konnte nicht initialisiert werden',
    'An error occured while initializing OS.js': 'Während der Initialisirung von OS.js ist ein Fehler aufgetreten',
    "Cannot launch OS.js: No window manager defined!": 'OS.js konnte nicht gestartet werden: Fenster-Manager nicht festgelegt!',
    "Cannot launch OS.js: Failed to launch Window Manager: {0}": 'OS.js konnte nicht gestartet werden: Fenster-Manager konnte nicht gestartet werden: {0}',
    "Cannot launch OS.js: Failed to preload resources...": 'OS.js konnte nicht gestartet werden: Resourssen konnten nicht vorab geladen werden...',

    "Application API error": 'Anwendungs API Fehler',
    "Application {0} failed to perform operation '{1}'": "Anwendung {0} konnte Aktion nicht ausführen '{1}'",

    // helpers.js
    "The requested file MIME '{0}' is not accepted by this application.": "Die Anwendung unterstützt den folgenden Dateityp '{0}' nicht",
    'Fatal error on open file!': 'Schwerwigender Fehler während des Öffnen der Datei!',
    "Failed to open file: {0}": 'Datei konnte nicht geöffnet werden: {0}',
    'Fatal error on save file!': 'Schwerwigender Fehler während des Speichern der Datei!',
    "Failed to save file: {0}": 'Datei konnte nicht gespeichert werden: {1}',

    // dialogs.js
    "Choose Application": 'Wählen Sie eine Anwendung',
    "Choose an application to open": 'Wählen Sie eine Anwendung zum Öffnen',
    "You need to select an application": 'Sie müssen eine Anwendung auswählen',
    'Use as default application for {0}': 'Als Standartanwendung für {0} verwenden',
    "File Operation Progress": 'Fortschritt',
    'Upload file to <span>{0}</span>.<br />Maximum size: {1} bytes': 'Upload nach <span>{0}</span>.<br />Maximale Größe: {1} bytes',
    "Upload Dialog": 'Upload-Dialog',
    "Uploading file...": 'Datei-Upload...',
    "Uploading '{0}' ({1} {2}) to {3}": "Hochladen von '{0}' ({1} {2}) von {3}",
    "Upload failed": 'Upload fehlgeschlagen',
    "The upload has failed": 'Der Upload ist fehlgeschlagen',
    "Reason unknown...": 'Unbekannter Grund...',
    "Cancelled by user...": 'Abbruch durch Benutzer...',
    "FileDialog Error": 'Datei-Dialog Fehler',
    "Failed listing directory '{0}' because an error occured": "Verzeichnis '{0}' konnte nicht geöffnet werden",
    "Are you sure you want to overwrite the file '{0}'?": "Sind Sie sicher, dass Sie die Datei '{0}' überschreiben wollen?",
    'You need to select a file or enter new filename!': 'Sie müssen eine Datei auswählen oder geben Sie einen neuen Dateinamen an!',
    'You need to select a file!': 'Sie müssen eine Datei auswählen!',
    "File Information": 'Dateiinformationen',
    "Loading file information for: {0}": 'Laster fil-informasjon for: {0}',
    "FileInformationDialog Error": 'File-informasjon Dialog Feil',
    "Failed to get file information for <span>{0}</span>": "Klarte ikke hente fil-informasjon for <span>{0}</span>",
    "Failed to get file information for: {0}": 'Klarte ikke hente fil-informasjon for: {0}',
    "Alert Dialog": 'Warnungsdialog',
    "Confirm Dialog": 'Bestätigungsdialog',
    "Input Dialog": 'Eingabedialog',
    "Color Dialog": 'Farb-Dialog',
    'Red: {0}': 'Rot: {0}',
    'Green: {0}': 'Grün: {0}',
    'Blue: {0}': 'Blau: {0}',
    'Alpha: {0}': 'Alpha: {0}',
    "Font Dialog": 'Schriftarten-Dialog',

    // Application-specific
    '{0} Application Error': '{0} Anwendungsfehler',
    "Failed to perform action '{0}'": "Konnte Aktion nicht durchführen: '{0}'",
    'Failed to save file (call): {0}': 'Fehler beim Speichern der Datei (call): {0}',
    'Cannot open file': 'Datei kann nicht geöffnte werden',
    'Not supported!': 'Nicht unterstützt!',
    'Unknown Error': 'Unbekannter Fehler',
    'Failed to open file (call): {0}': 'Datei kann nicht geöffnte werden (call): {0}',
    'An error occured while handling your request': 'Während Ihres Requests ist ein Fehler aufgetreten',
    'Fatal error: {0}': 'Schwerwiegender Fehler: {0}',
    'An error occured in action: {0}': 'Fehler während Aktion: {0}',
    'Discard current document ?': 'Aktuelles Dokument verwerfen?',

    // Common
    'Minimize'          : 'Minimieren',
    'Maximize'          : 'Maximieren',
    'Restore'           : 'Wiederherstellen',
    'On Top - Disable'  : 'Im Vordergrund - Deaktivieren',
    'On Top - Enable'   : 'Im Vordergrund - Aktivieren',
    'Application'       : 'Anwendung',
    'Settings'          : 'Einstellungen',
    'Log out (Exit)'    : 'Abmelden',
    'Loading...'        : 'Lade...',
    'Message'           : 'Meldung',
    'Summary'           : 'Zusammenfassung',
    'Trace'             : 'Trace',
    'Name'              : 'Name',
    'Save'              : 'Speichern',
    'Open'              : 'Öffnen',
    'Close'             : 'Schließen',
    'Cancel'            : 'Abbrechen',
    'OK'                : 'OK',
    'Filename'          : 'Dateiname',
    'Type'              : 'Type',
    'MIME'              : 'MIME',
    'Path'              : 'Pfad',
    'Size'              : 'Größe',
    'Index'             : 'Index',
    'Bugreport'         : 'Fehlerbericht',
    'File'              : 'Datei',
    'Add'               : 'Hinzufügen',
    'New'               : 'Neu',
    'Save As...'        : 'Speichern unter...',
    'Create directory'  : 'Verzeichnis erstellen',
    'Edit'              : 'Bearbeiten',
    'View'              : 'Ansicht',
    'Upload'            : 'Hochladen',
    'Rename'            : 'Umbenennen',
    'Delete'            : 'Löschen',
    'Information'       : 'Information',
    'Open With...'      : 'Öffnen mit...',
    'List View'         : 'Liste',
    'Icon View'         : 'Symbole',
    'Refresh'           : 'Aktualisieren',
    'View type'         : 'Ansichtstyp',
    'PID'               : 'PID',
    'Alive'             : 'Aktiv',
    'Undo'              : 'Rückgängig',
    'Redo'              : 'Vorwärts',
    'Copy'              : 'Kopieren',
    'Paste'             : 'Einfügen',
    'Cut'               : 'Ausschneiden',
    'Unlink'            : 'Verknüpfung entfernen',
    'Ordered List'      : 'Sortierte Liste',
    'Unordered List'    : 'Unsortierte Liste',
    'Image'             : 'Bild',
    'Link'              : 'Verknüpfung',
    'Insert'            : 'Einfügen',
    'Bold'              : 'Fett',
    'Italic'            : 'Kursiv',
    'Underline'         : 'Unterstrichen',
    'Skrike'            : 'Gjennomstrek',
    'Left'              : 'Links',
    'Center'            : 'Zentriert',
    'Right'             : 'Rechts',
    'Indent'            : 'Einzug',
    'Outdent'           : 'Negativeinzug',
    'Text Color'        : 'Textfarbe',
    'Back Color'        : 'Hintergrundfarbe',
    'Fatal error'       : 'Schwerwiegender Fehler',
    'Reset to defaults' : 'Werkseinstellungen wiederherstellen',
    'Panels'            : 'Panel',
    'Theme'             : 'Design',
    'Color'             : 'Farbe',
    'Background Image'  : 'Hintergrundbild',
    'Background Color'  : 'Hintergrundfarbe',
    'Font'              : 'Schriftart',
    'Top'               : 'Oben',
    'Bottom'            : 'Unten',
    'Yes'               : 'Ja',
    'No'                : 'Nein',
    'Apply'             : 'Übernehmen',
    'Locales'           : 'Lokalisierung'

  };

})();
