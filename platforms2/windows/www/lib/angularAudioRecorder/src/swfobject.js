(function (win) {
  'use strict';

  /*!SWFObject v2.1 <http://code.google.com/p/swfobject/>
   Copyright (c) 2007-2008 Geoff Stearns, Michael Williams, and Bobby van der Sluis
   This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
   */
  win.swfobject = function () {

    var UNDEF = "undefined",
      OBJECT = "object",
      SHOCKWAVE_FLASH = "Shockwave Flash",
      SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
      FLASH_MIME_TYPE = "application/x-shockwave-flash",
      EXPRESS_INSTALL_ID = "SWFObjectExprInst",

      win = window,
      doc = document,
      nav = navigator,

      domLoadFnArr = [],
      regObjArr = [],
      objIdArr = [],
      listenersArr = [],
      script,
      timer = null,
      storedAltContent = null,
      storedAltContentId = null,
      isDomLoaded = false,
      isExpressInstallActive = false;

    /* Centralized function for browser feature detection
     - Proprietary feature detection (conditional compiling) is used to detect Internet Explorer's features
     - User agent string detection is only used when no alternative is possible
     - Is executed directly for optimal performance
     */
    var ua = function () {
      var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
        playerVersion = [0, 0, 0],
        d = null;
      if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
        d = nav.plugins[SHOCKWAVE_FLASH].description;
        if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
          d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
          playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
          playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
          playerVersion[2] = /r/.test(d) ? parseInt(d.replace(/^.*r(.*)$/, "$1"), 10) : 0;
        }
      }
      else if (typeof win.ActiveXObject != UNDEF) {
        var a = null, fp6Crash = false;
        try {
          a = new ActiveXObject(SHOCKWAVE_FLASH_AX + ".7");
        }
        catch (e) {
          try {
            a = new ActiveXObject(SHOCKWAVE_FLASH_AX + ".6");
            playerVersion = [6, 0, 21];
            a.AllowScriptAccess = "always";	 // Introduced in fp6.0.47
          }
          catch (e) {
            if (playerVersion[0] == 6) {
              fp6Crash = true;
            }
          }
          if (!fp6Crash) {
            try {
              a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
            }
            catch (e) {
            }
          }
        }
        if (!fp6Crash && a) { // a will return null when ActiveX is disabled
          try {
            d = a.GetVariable("$version");	// Will crash fp6.0.21/23/29
            if (d) {
              d = d.split(" ")[1].split(",");
              playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
            }
          }
          catch (e) {
          }
        }
      }
      var u = nav.userAgent.toLowerCase(),
        p = nav.platform.toLowerCase(),
        webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
        ie = false,
        windows = p ? /win/.test(p) : /win/.test(u),
        mac = p ? /mac/.test(p) : /mac/.test(u);
      /*@cc_on
       ie = true;
       @if (@_win32)
       windows = true;
       @elif (@_mac)
       mac = true;
       @end
       @*/
      return {w3cdom: w3cdom, pv: playerVersion, webkit: webkit, ie: ie, win: windows, mac: mac};
    }();

    /* Cross-browser onDomLoad
     - Based on Dean E
