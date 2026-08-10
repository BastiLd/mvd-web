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
  }

  function initMode() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* localStorage nicht verfügbar (z.B. privater Modus) - einfach ignorieren */
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
      /* ignorieren, Modus gilt dann nur für diese Seitenansicht */
    }
  }

  function closeMenu() {
    menu.hidden = true;
    hamburger.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    menu.hidden = false;
    hamburger.setAttribute("aria-expanded", "true");
  }

  hamburger.addEventListener("click", function () {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  document.addEventListener("click", function (event) {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== hamburger) {
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
  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  function initReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  initMode();
  initReveal();
})();
