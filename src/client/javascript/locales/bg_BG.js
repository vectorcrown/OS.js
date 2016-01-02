/*!
 * OS.js - JavaScript Operating System
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
  // jscs:disable validateQuoteMarks
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.bg_BG = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : '������ ��� �������� �� ����',
    'ERR_WM_NOT_RUNNING'        : '��������� �� �������� �� ������ ',
    'ERR_FILE_OPEN_FMT'         : '������ \'**{0}**\' �� ���� �� ���� �������',
    'ERR_APP_MIME_NOT_FOUND_FMT': '���� �������� ���������� � ��������� �� \'{0}\' �������',
    'ERR_APP_LAUNCH_FAILED'     : '������������ �� ���� �� ���� ����������',
    'ERR_APP_LAUNCH_FAILED_FMT' : '������ �� ������ �� ����� �� ����������: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : '������������ \'{0}\' ��������� ����������: {1}',
    'ERR_APP_INIT_FAILED_FMT'       : '������������ \'{0}\' init() ���������: {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : '�������� ������� �� ������������ \'{0}\' ��� �� ������� ������������!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : '������������ \'{0}\' ������������� ���������� ���������: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : '������������ \'{0}\' � ���� ����������!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : '������ ��� ���������� \'{0}\'. ���� �������� �����!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : '������ ��� ���������� \'{0}\'. ����������� �������: {1}',

    'ERR_NO_WM_RUNNING'         : '���� ������� �������� �� ��������',
    'ERR_CORE_INIT_FAILED'      : '��������� �������������� �� OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : '������ ��� �������������� �� OS.js',
    'ERR_CORE_INIT_NO_WM'       : 'OS.js �� ���� �� �� ��������: �� � ��������� �������� �� ��������!',
    'ERR_CORE_INIT_WM_FAILED_FMT': 'OS.js �� ���� �� �� ��������: ��������� �������� �� �������� �� ��������: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED': 'OS.js �� ���� �� �� ��������: ��������� ��������� �� ���������...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'JavaScript ���������� �� ������ ',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : '����� �� ���������� ������, �������� ���.',

    'ERR_APP_API_ERROR'           : '������ �  API �� ������������',
    'ERR_APP_API_ERROR_DESC_FMT'  : '������������ {0} �� ���� �� ������� ���������� \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': '������� ��������: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : '��������� ������',

    'ERR_OPERATION_TIMEOUT'       : '���������� ����� �� ����������',
    'ERR_OPERATION_TIMEOUT_FMT'   : '���������� ����� �� ���������� ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : '���� ��� ���������� �������� \'{0}\'',
    'WINDOW_MINIMIZE' : '�����������',
    'WINDOW_MAXIMIZE' : '�������������',
    'WINDOW_RESTORE'  : '���������',
    'WINDOW_CLOSE'    : '�������',
    'WINDOW_ONTOP_ON' : '���-������ (���������)',
    'WINDOW_ONTOP_OFF': '���-������ (���������)',

    // Handler
    'TITLE_SIGN_OUT' : '�����',
    'TITLE_SIGNED_IN_AS_FMT' : '������ ��� ����: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : '������� �� ���, �� ������ �� �������� �� OS.js? ������ �� �������� ��������� � ���������� �� ����� ��������!',

    // Service
    'BUGREPORT_MSG' : '���� ����������� ���� ��� �������, �� � ���.\�������� �������� �������� ��� �� ������ �������� � ���� ��� ������; ��� ���� �� ���� ��������� ',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : '������ ��� ��� ������ ������: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : '������� ������',
    'ERR_UTILS_XHR_FMT' : 'AJAX/XHR ������: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : '����� (�����)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : '�������� �� ���������� \'{0}\'.\n������ �� �� �������� �������� �����?',

    'DIALOG_CLOSE' : '�������',
    'DIALOG_CANCEL': '������',
    'DIALOG_APPLY' : '�������',
    'DIALOG_OK'    : '��',

    'DIALOG_ALERT_TITLE' : '������ �� ��������',

    'DIALOG_COLOR_TITLE' : '���� �� �������',
    'DIALOG_COLOR_R' : '������: {0}',
    'DIALOG_COLOR_G' : '�����: {0}',
    'DIALOG_COLOR_B' : '���: {0}',
    'DIALOG_COLOR_A' : '����: {0}',

    'DIALOG_CONFIRM_TITLE' : '�������� ������',

    'DIALOG_ERROR_MESSAGE'   : '���������',
    'DIALOG_ERROR_SUMMARY'   : '����������',
    'DIALOG_ERROR_TRACE'     : '�����',
    'DIALOG_ERROR_BUGREPORT' : '��������� ���',

    'DIALOG_FILE_SAVE'      : '������',
    'DIALOG_FILE_OPEN'      : '������',
    'DIALOG_FILE_MKDIR'     : '���� �����',
    'DIALOG_FILE_MKDIR_MSG' : '������ ���� ���������� � **{0}**',
    'DIALOG_FILE_OVERWRITE' : '������� �� ���, �� ������ �� ����������� ������ \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : '��� �� ������',
    'DIALOG_FILE_MNU_LISTVIEW' : '������',
    'DIALOG_FILE_MNU_TREEVIEW' : '�����',
    'DIALOG_FILE_MNU_ICONVIEW' : '�����',
    'DIALOG_FILE_ERROR'        : '������ ��� ������ ������',
    'DIALOG_FILE_ERROR_SCANDIR': '��������� ����������� �� ������������ \'{0}\' ������ ������',
    'DIALOG_FILE_MISSING_FILENAME' : '������ �� �������� ���� ��� �� �������� ���!',
    'DIALOG_FILE_MISSING_SELECTION': '������ �� �������� ����!',

    'DIALOG_FILEINFO_TITLE'   : '���������� �� ������',
    'DIALOG_FILEINFO_LOADING' : '��������� �� ���������� ��: {0}',
    'DIALOG_FILEINFO_ERROR'   : '������ � ���������� �� ����',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : '�� ���� �� ���� �������� ���������� �� ������ **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : '�� ���� �� ���� �������� ���������� �� ������: {0}',

    'DIALOG_INPUT_TITLE' : '������ ������',

    'DIALOG_FILEPROGRESS_TITLE'   : '������� �� ���������� �� ������',
    'DIALOG_FILEPROGRESS_LOADING' : '���������...',

    'DIALOG_UPLOAD_TITLE'   : '������ ������',
    'DIALOG_UPLOAD_DESC'    : '������ ���� ��� **{0}**.<br />���������� ������: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : '�������� \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : '�������� �� ����...',
    'DIALOG_UPLOAD_FAILED'  : '�������� ���������',
    'DIALOG_UPLOAD_FAILED_MSG'      : '���������� � ���������',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : '������������ �������...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': '�������� �� ����������...',
    'DIALOG_UPLOAD_TOO_BIG': '������ � ��������� �����',
    'DIALOG_UPLOAD_TOO_BIG_FMT': '������ � ��������� �����, ��������� {0}',

    'DIALOG_FONT_TITLE' : '����� �� ������',

    'DIALOG_APPCHOOSER_TITLE' : '�������� ����������',
    'DIALOG_APPCHOOSER_MSG'   : '�������� ���������� ����� �� �� ������',
    'DIALOG_APPCHOOSER_NO_SELECTION' : '������ �� �������� ����������',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : '��������� ���� ���������� �� ������������ �� {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'GoogleAPI ����� �� � ������������ ��� � ��������',
    'GAPI_SIGN_OUT'           : '����� �� Google API ������',
    'GAPI_REVOKE'             : '��������� �� ������� � �����',
    'GAPI_AUTH_FAILURE'       : 'Google API �������������� ��������� ��� �� � ���������',
    'GAPI_AUTH_FAILURE_FMT'   : '������ ��� ��������������: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : '��������� ���������� �� Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Windows Live API ����� �� � ������������ ��� � ��������',
    'WLAPI_SIGN_OUT'          : '����� �� Window Live API',
    'WLAPI_LOAD_FAILURE'      : '��������� ���������� �� Windows Live API',
    'WLAPI_LOGIN_FAILED'      : '��������� ������� � Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : '��������� ������� � Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API �������� {0} ������',

    // IndexedDB
    'IDB_MISSING_DBNAME' : '�� ���� �� ���� ��������� IndexedDB ��� ��� �� ���� �����',
    'IDB_NO_SUCH_ITEM'   : '�� ����������� �����',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : '������� ������',
    'ERR_VFS_UNAVAILABLE'     : '�� � �������',
    'ERR_VFS_FILE_ARGS'       : '������ ������ ���� ���� ��������',
    'ERR_VFS_NUM_ARGS'        : '���� ���������� ���������',
    'ERR_VFS_EXPECT_FILE'     : '������ ������-�����',
    'ERR_VFS_EXPECT_SRC_FILE' : '����� �������� ������-�����',
    'ERR_VFS_EXPECT_DST_FILE' : '������ ���������� ������-�����',
    'ERR_VFS_FILE_EXISTS'     : '������������ ���� ����������',
    'ERR_VFS_TRANSFER_FMT'    : '����� �� ������ ������ �� ���������� ��������: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : '�� ���� �� ���� ������� ���� ��� �����������',
    'ERR_VFS_UPLOAD_NO_FILES' : '�� ���� �� �� ������ ��� ���������� �� �������',
    'ERR_VFS_UPLOAD_FAIL_FMT' : '��������� �������� �� �������: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': '���������� �� ������� ���� ����������',
    'ERR_VFS_DOWNLOAD_NO_FILE': '�� ���� �� �� ������� ��� ������ ��� ',
    'ERR_VFS_DOWNLOAD_FAILED' : '����� �� ������ ��� ���������: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': '�������� ���� ������',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': '��������� �� ����',

    'ERR_VFSMODULE_XHR_ERROR'      : 'XHR ������',
    'ERR_VFSMODULE_ROOT_ID'        : '�� ���� �� ���� �������� �� �� root �������',
    'ERR_VFSMODULE_NOSUCH'         : '������ �� ����������',
    'ERR_VFSMODULE_PARENT'         : '���� ������� ��������',
    'ERR_VFSMODULE_PARENT_FMT'     : '�� ���� �� ���� ������� ��������: {0}',
    'ERR_VFSMODULE_SCANDIR'        : '��������� ��������� �� ����������',
    'ERR_VFSMODULE_SCANDIR_FMT'    : '��������� ��������� �� ����������: {0}',
    'ERR_VFSMODULE_READ'           : '��������� ��������� �� ������',
    'ERR_VFSMODULE_READ_FMT'       : '��������� ��������� �� ������: {0}',
    'ERR_VFSMODULE_WRITE'          : '��������� ��������� �� ������',
    'ERR_VFSMODULE_WRITE_FMT'      : '��������� ��������� �� ������: {0}',
    'ERR_VFSMODULE_COPY'           : '��������� ��������',
    'ERR_VFSMODULE_COPY_FMT'       : '��������� ��������: {0}',
    'ERR_VFSMODULE_UNLINK'         : '��������� ��������� �� ������ ',
    'ERR_VFSMODULE_UNLINK_FMT'     : '��������� ��������� �� ������: {0}',
    'ERR_VFSMODULE_MOVE'           : '��������� ����������� �� ������',
    'ERR_VFSMODULE_MOVE_FMT'       : '��������� ����������� �� ������: {0}',
    'ERR_VFSMODULE_EXIST'          : '��������� �������� �� ������������ �� ������',
    'ERR_VFSMODULE_EXIST_FMT'      : '��������� �������� �� ������������ �� ������: {0}',
    'ERR_VFSMODULE_FILEINFO'       : '��������� ���������� �� ���������� �� ������',
    'ERR_VFSMODULE_FILEINFO_FMT'   : '��������� ���������� �� ���������� �� ������: {0}',
    'ERR_VFSMODULE_MKDIR'          : '��������� ��������� �� ����������',
    'ERR_VFSMODULE_MKDIR_FMT'      : '��������� ��������� �� ����������: {0}',
    'ERR_VFSMODULE_URL'            : '��������� ���������� �� URL �� ������',
    'ERR_VFSMODULE_URL_FMT'        : '��������� ���������� �� URL �� ������: {0}',
    'ERR_VFSMODULE_TRASH'          : '��������� ���������',
    'ERR_VFSMODULE_TRASH_FMT'      : '��������� ���������: {0}',
    'ERR_VFSMODULE_UNTRASH'        : '��������� ��������� �� �������',
    'ERR_VFSMODULE_UNTRASH_FMT'    : '��������� ��������� �� �������: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : '��������� ���������� �� �������',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : '��������� ���������� �� �������: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : '������ ��� � Dropbox API',
    'DROPBOX_SIGN_OUT'           : '����� �� Dropbox API',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : '��������� �������� �� ���: ������ �� � �������',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': '���������� �� ����������� �� ������ ���� ����������. �� ���� �� ����������!',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : '�� ���� �� ���� ������� ������',
    'ERR_FILE_APP_OPEN_FMT'     : '������ {0} �� ���� �� ���� �������� {1} �� �� ��������',
    'ERR_FILE_APP_OPEN_ALT_FMT' : '������ {0} �� ���� �� ���� �������',
    'ERR_FILE_APP_SAVE_ALT_FMT' : '������ {0} �� ���� �� ���� �������',
    'ERR_GENERIC_APP_FMT'       : '{0} ������ � ������������',
    'ERR_GENERIC_APP_ACTION_FMT': '��������� ������������� �� �������� \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : '��������� ������',
    'ERR_GENERIC_APP_REQUEST'   : '������ �� ������ ��� ����������� �� ��������',
    'ERR_GENERIC_APP_FATAL_FMT' : '������� ������: {0}',
    'MSG_GENERIC_APP_DISCARD'   : '������ ���������?',
    'MSG_FILE_CHANGED'          : '������ � ��������. ���������?',
    'MSG_APPLICATION_WARNING'   : '��������������',
    'MSG_MIME_OVERRIDE'         : '���� �� ����� "{0}" �� �� ��������, ����������� "{1}".',

    //
    // General
    //

    'LBL_UNKNOWN'      : '��������',
    'LBL_APPEARANCE'   : '������ ���',
    'LBL_USER'         : '����������',
    'LBL_NAME'         : '���',
    'LBL_APPLY'        : '�������',
    'LBL_FILENAME'     : '��� �� ����',
    'LBL_PATH'         : '���',
    'LBL_SIZE'         : '������',
    'LBL_TYPE'         : '���',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : '���������',
    'LBL_SETTINGS'     : '���������',
    'LBL_ADD_FILE'     : '������ ����',
    'LBL_COMMENT'      : '��������',
    'LBL_ACCOUNT'      : '������',
    'LBL_CONNECT'      : '������ ��',
    'LBL_ONLINE'       : '�� �����',
    'LBL_OFFLINE'      : '����� �����',
    'LBL_AWAY'         : '���������',
    'LBL_BUSY'         : '����',
    'LBL_CHAT'         : '���',
    'LBL_HELP'         : '�����',
    'LBL_ABOUT'        : '����������',
    'LBL_PANELS'       : '������',
    'LBL_LOCALES'      : '�����������',
    'LBL_THEME'        : '����',
    'LBL_COLOR'        : '����',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : '��������',
    'LBL_ALIVE'        : '������',
    'LBL_INDEX'        : '������',
    'LBL_ADD'          : '������',
    'LBL_FONT'         : '�����',
    'LBL_YES'          : '��',
    'LBL_NO'           : '��',
    'LBL_CANCEL'       : '������',
    'LBL_TOP'          : '����',
    'LBL_LEFT'         : '����',
    'LBL_RIGHT'        : '�����',
    'LBL_BOTTOM'       : '����',
    'LBL_CENTER'       : '������',
    'LBL_FILE'         : '����',
    'LBL_NEW'          : '���',
    'LBL_OPEN'         : '������',
    'LBL_SAVE'         : '������',
    'LBL_SAVEAS'       : '������ ����...',
    'LBL_CLOSE'        : '��������',
    'LBL_MKDIR'        : '������ ����������',
    'LBL_UPLOAD'       : '������',
    'LBL_VIEW'         : '������',
    'LBL_EDIT'         : '����������',
    'LBL_RENAME'       : '�����������',
    'LBL_DELETE'       : '������',
    'LBL_OPENWITH'     : '������ �...',
    'LBL_ICONVIEW'     : '�����',
    'LBL_TREEVIEW'     : '�����',
    'LBL_LISTVIEW'     : '������',
    'LBL_REFRESH'      : '�������',
    'LBL_VIEWTYPE'     : '����� �� ������',
    'LBL_BOLD'         : '�������',
    'LBL_ITALIC'       : '��������',
    'LBL_UNDERLINE'    : '���������',
    'LBL_REGULAR'      : '���������',
    'LBL_STRIKE'       : 'Strike',
    'LBL_INDENT'       : '�������������',
    'LBL_OUTDENT'      : '�����������',
    'LBL_UNDO'         : '���������',
    'LBL_REDO'         : '������ ������������',
    'LBL_CUT'          : '������',
    'LBL_UNLINK'       : '������',
    'LBL_COPY'         : '�������',
    'LBL_PASTE'        : '�������',
    'LBL_INSERT'       : '������',
    'LBL_IMAGE'        : '�����������',
    'LBL_LINK'         : '����',
    'LBL_DISCONNECT'    : '����� �� ������',
    'LBL_APPLICATIONS'  : '����������',
    'LBL_ADD_FOLDER'    : '������ �����',
    'LBL_INFORMATION'   : '����������',
    'LBL_TEXT_COLOR'    : '���� �� ������',
    'LBL_BACK_COLOR'    : '���� �� ����',
    'LBL_RESET_DEFAULT' : '����� �� ������������',
    'LBL_DOWNLOAD_COMP' : '��������� �� ���������',
    'LBL_ORDERED_LIST'  : '�������� ������',
    'LBL_BACKGROUND_IMAGE' : '����������� �� ���',
    'LBL_BACKGROUND_COLOR' : '���� �� ���',
    'LBL_UNORDERED_LIST'   : '���������� ������',
    'LBL_STATUS'   : '�����',
    'LBL_READONLY' : '���� �� ������',
    'LBL_CREATED' : '��������',
    'LBL_MODIFIED' : '�����������',
    'LBL_SHOW_COLUMNS' : '������ ������',
    'LBL_MOVE' : '��������',
    'LBL_OPTIONS' : '�����',
    'LBL_OK' : '��',
    'LBL_DIRECTORY' : '����������',
    'LBL_CREATE' : '������',
    'LBL_BUGREPORT' : '���-������',
    'LBL_INSTALL' : '����������',
    'LBL_UPDATE' : '������������',
    'LBL_REMOVE' : '��������'
  };

})();
