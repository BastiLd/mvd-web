/* ==========================================================================
   Schalter: Symbole in Originalfarben oder in den Farben des Bereichs.

   ---------------------------------------------------------------------------
   DIESES FEATURE WIEDER LOSWERDEN
   Es steckt vollständig in dieser einen Datei. Zum Entfernen genügt:

       1. <script src="js/deco-colors.js"></script> aus creator.html und
          creator-v2.html löschen
       2. diese Datei löschen

   Danach wird die Klasse "deco-original" nie gesetzt und js/deco.js zeichnet
   dauerhaft in den gedeckten, zum Bereich passenden Tönen. An deco.js selbst
   ist nichts zu ändern. Die zugehörigen Stilregeln (.deco-toggle) dürfen im
   CSS stehenbleiben, sie greifen dann einfach nicht mehr.
   ---------------------------------------------------------------------------

   Die Wahl wird im Browser gemerkt, damit sie beim Seitenwechsel und beim
   nächsten Besuch erhalten bleibt.
   ========================================================================== */

(function () {
  "use strict";

  if (!document.querySelector("[data-deco]")) { return; }

  var KEY = "mvd-deco-original";
  var root = document.documentElement;

  function stored() {
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch (e) {
      /* Privates Fenster oder Speicher gesperrt – dann eben ohne Merken. */
      return false;
    }
  }

  function remember(on) {
    try {
      window.localStorage.setItem(KEY, on ? "1" : "0");
    } catch (e) { /* nicht weiter schlimm */ }
  }

  var on = stored();

  var button = document.createElement("button");
  button.type = "button";
  button.className = "deco-toggle";

  var label = document.createElement("span");
  label.className = "deco-toggle__label";
  button.appendChild(label);

  function apply() {
    root.classList.toggle("deco-original", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    label.textContent = on ? "Symbole: Originalfarben" : "Symbole: passend";
    button.title = on
      ? "Symbole in Originalfarben – klicken für die Farben des Bereichs"
      : "Symbole in den Farben des Bereichs – klicken für Originalfarben";

    /* deco.js zeichnet ein stehendes Bild nur auf Zuruf neu. */
    document.dispatchEvent(new CustomEvent("deco-colors-changed"));
  }

  button.addEventListener("click", function () {
    on = !on;
    remember(on);
    apply();
  });

  apply();
  document.body.appendChild(button);
})();
