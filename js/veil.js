/* =============================================================================
   MVD Web – Vordergrund-Vorhang mit blubbernder Lava-Kante
   -----------------------------------------------------------------------------
   Ablauf:
     1. Beim Laden ist der Bildschirm komplett schwarz.
     2. Über 1,5 s fährt der Vorhang nach unten. Seine gewölbte Kante ist mit
        roten Kreisen, Rechtecken und Dreiecken besetzt, die wie Lava blubbern.
        Was die Kante passiert hat, wird sichtbar.
     3. Danach steht die Kante bei ca. 3/4 der Sichthöhe und wandert beim
        Scrollen langsam weiter nach unten.
     4. Am Footer verdampft der Vorhang.
   ========================================================================== */
(function () {
  "use strict";

  var veil = document.getElementById("veil");
  if (!veil) return;

  var lavaHost = veil.querySelector(".veil__lava");
  var footer = document.getElementById("site-footer");

  /* Ruheposition der Kante: 3/4 der Sichthöhe sind Inhalt. */
  var REST = 0.75;
  /* Wie weit die Kante beim Durchscrollen zusätzlich nach unten wandert. */
  var DRIFT = 0.3;
  var INTRO_MS = 1500;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var introDone = false;
  var ticking = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* Die Kurve des Vorhangs in viewBox-Einheiten: y(t) = 1041 * t * (1 - t),
     Boxhöhe 260. Liefert die Höhe als Anteil (0..1) der Kuppelhöhe. */
  function curveY(t) {
    return (1041 * t * (1 - t)) / 260;
  }

  /* ---------------------------------------------------------------------
     Lava-Elemente entlang der Kante erzeugen
     ------------------------------------------------------------------ */
  function buildLava() {
    if (!lavaHost) return;

    var fragment = document.createDocumentFragment();
    var shapes = ["circle", "circle", "circle", "circle", "rect", "tri"];
    var i;

    /* Die sichtbare Bildschirmbreite entspricht t = 0.167 .. 0.833.
       Etwas darüber hinaus streuen, damit die Kante an den Rändern nicht
       plötzlich leer wirkt. */
    var T_MIN = 0.1;
    var T_MAX = 0.9;
    var COUNT = 34;

    for (i = 0; i < COUNT; i++) {
      var t = T_MIN + ((T_MAX - T_MIN) * i) / (COUNT - 1);
      t += (Math.random() - 0.5) * 0.02;

      var shape = shapes[Math.floor(Math.random() * shapes.length)];
      var size = 8 + Math.random() * 26;
      var el = document.createElement("span");

      el.className =
        "lava" + (shape === "rect" ? " lava--rect" : shape === "tri" ? " lava--tri" : "");
      el.style.left = (t * 100).toFixed(3) + "%";
      /* Leicht über der Kurve sitzen lassen, damit die Formen auf der Kante liegen. */
      el.style.top = (curveY(t) * 100 - 2 - Math.random() * 8).toFixed(3) + "%";
      el.style.width = size.toFixed(1) + "px";
      el.style.height = size.toFixed(1) + "px";
      el.style.animationDuration = (2 + Math.random() * 2.4).toFixed(2) + "s";
      el.style.animationDelay = (-Math.random() * 3).toFixed(2) + "s";

      fragment.appendChild(el);
    }

    /* Ein paar Blasen, die aufsteigen und sich auflösen. */
    for (i = 0; i < 10; i++) {
      var bt = T_MIN + Math.random() * (T_MAX - T_MIN);
      var bubble = document.createElement("span");
      var bsize = 6 + Math.random() * 14;

      bubble.className = "lava lava--bubble";
      bubble.style.left = (bt * 100).toFixed(3) + "%";
      bubble.style.top = (curveY(bt) * 100 - 4).toFixed(3) + "%";
      bubble.style.width = bsize.toFixed(1) + "px";
      bubble.style.height = bsize.toFixed(1) + "px";
      bubble.style.animationDuration = (3.2 + Math.random() * 2.8).toFixed(2) + "s";
      bubble.style.animationDelay = (-Math.random() * 5).toFixed(2) + "s";

      fragment.appendChild(bubble);
    }

    lavaHost.appendChild(fragment);
  }

  /* ---------------------------------------------------------------------
     Position beim Scrollen
     ------------------------------------------------------------------ */
  function edgePosition() {
    var vh = window.innerHeight;
    var docEl = document.documentElement;
    var maxScroll = Math.max(1, docEl.scrollHeight - vh);
    var progress = clamp(window.scrollY / maxScroll, 0, 1);

    /* Kante wandert sanft weiter nach unten, je tiefer man scrollt. */
    var pos = (REST + DRIFT * progress * progress) * vh;

    /* Verdampfen, sobald der Footer ins Bild kommt. */
    var evaporate = 0;
    if (footer) {
      var footerTop = footer.getBoundingClientRect().top;
      evaporate = clamp((vh - footerTop) / (vh * 0.6), 0, 1);
    }

    return { pos: pos + evaporate * vh * 0.5, evaporate: evaporate };
  }

  function update() {
    ticking = false;
    if (!introDone) return;

    var state = edgePosition();
    veil.style.transform = "translateY(" + state.pos.toFixed(1) + "px)";
    veil.style.opacity = (1 - state.evaporate).toFixed(3);
    veil.classList.toggle("is-vanishing", state.evaporate > 0.35);
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  /* ---------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    veil.classList.remove("is-intro");
    update();
  }

  var introStarted = false;

  function runIntro() {
    if (introStarted) return;
    introStarted = true;

    veil.classList.add("is-intro");
    veil.style.transform =
      "translateY(" + (REST * window.innerHeight).toFixed(1) + "px)";
    /* transitionend ist unzuverlässig – deshalb zusätzlich ein Timer. */
    window.setTimeout(finishIntro, INTRO_MS + 120);
  }

  function startIntro() {
    veil.style.transform = "translateY(0px)";

    if (reduceMotion) {
      finishIntro();
      return;
    }

    /* In einem Hintergrund-Tab läuft requestAnimationFrame nicht. Dann erst
       starten, wenn die Seite wirklich sichtbar wird – sonst verpasst man
       die Animation komplett. */
    if (document.hidden) {
      document.addEventListener("visibilitychange", function onVisible() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onVisible);
        startIntro();
      });
      return;
    }

    /* Zwei Frames warten, damit der Startwert sicher gerendert ist,
       bevor die Transition greift. */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(runIntro);
    });
    /* Sicherheitsnetz, falls requestAnimationFrame ausgebremst wird. */
    window.setTimeout(runIntro, 400);
  }

  buildLava();
  startIntro();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* Damit main.js nach einem Moduswechsel die Position neu setzen kann. */
  window.MVDVeil = { refresh: onScroll };
})();
