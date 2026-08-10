(function () {
  "use strict";

  var STORAGE_KEY = "mvd-mode";
  var body = document.body;
  var hamburger = document.getElementById("menu-toggle");
  var menu = document.getElementById("menu");
  var modeSwitchBtn = document.getElementById("mode-switch");

  function applyMode(mode) {
    body.setAttribute("data-mode", mode);
    if (modeSwitchBtn) {
      modeSwitchBtn.textContent =
        mode === "interactive"
          ? "Zu Standard-Modus wechseln"
          : "Zu interaktivem Modus wechseln";
    }
    if (window.MVDVeil) {
      window.MVDVeil.refresh();
    }
  }

  function initMode() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* localStorage nicht verfügbar (z.B. privater Modus) – ignorieren */
    }
    applyMode(saved === "interactive" ? "interactive" : "standard");
  }

  function toggleMode() {
    var current = body.getAttribute("data-mode");
    var next = current === "interactive" ? "standard" : "interactive";
    applyMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* ignorieren, der Modus gilt dann nur für diese Seitenansicht */
    }
  }

  function closeMenu() {
    menu.hidden = true;
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Menü öffnen");
  }

  function openMenu() {
    menu.hidden = false;
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Menü schließen");
  }

  hamburger.addEventListener("click", function () {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  document.addEventListener("click", function (event) {
    if (!menu.hidden && !menu.contains(event.target) && !hamburger.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
    }
  });

  if (modeSwitchBtn) {
    modeSwitchBtn.addEventListener("click", function () {
      toggleMode();
      closeMenu();
    });
  }

  // Platzhalter-Links (Anmelden, Beitreten, Bewerben, Kontakt, Impressum ...)
  // tun aktuell bewusst nichts.
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#"]'), function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  function showAll(targets) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("is-visible");
    });
  }

  function initReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      showAll(targets);
      return;
    }

    /* Sicherheitsnetz: Der Text darf niemals dauerhaft unsichtbar bleiben,
       falls der Observer aus irgendeinem Grund nicht auslöst. */
    window.setTimeout(function () {
      showAll(targets);
    }, 4000);
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  }

  initMode();
  // Kurz warten, damit der Text erst erscheint, während der Vorhang darüber
  // hinwegfährt – nicht schon davor.
  window.setTimeout(initReveal, 500);
})();
