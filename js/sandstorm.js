/* ==========================================================================
   Treibsand über den Dünen im Footer.

   Ergänzt die vier driftenden SVG-Dünenebenen aus style.css um feine Körner,
   die im Wind über die Kämme ziehen. Der Wind schwillt in unregelmäßigen Böen
   an und ab, damit es nicht wie ein gleichmäßiger Partikelregen wirkt.

   Läuft nur, solange der Footer tatsächlich im Bild ist – sonst rechnet die
   Seite die ganze Zeit an etwas, das niemand sieht.
   ========================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("sandstorm");
  if (!canvas || !canvas.getContext) { return; }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced && reduced.matches) { return; }

  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var grains = [];
  var running = false;
  var visible = false;
  var lastTime = 0;
  var gustTime = 0;

  /* Sandtöne von hell (hohe, schnelle Körner) bis dunkel (tiefe, träge). */
  var TONES = ["239, 227, 198", "224, 190, 130", "198, 150, 84", "150, 104, 58"];

  function random(min, max) { return min + Math.random() * (max - min); }

  function makeGrain(spawnAnywhere) {
    /* Weiter unten liegen die vorderen, dunkleren Dünen: dort sind die Körner
       größer und schneller, oben kleiner und langsamer. Das ergibt Tiefe. */
    var depth = Math.random();

    return {
      x: spawnAnywhere ? random(0, width) : random(-40, -4),
      /* Nur über den Dünenkämmen, nicht im leeren oberen Footerbereich. */
      y: random(height * 0.34, height * 0.96),
      r: random(0.5, 0.6 + depth * 1.5),
      speed: random(14, 32) + depth * 46,
      /* Leichter Auftrieb – Sand wird über den Kamm gehoben. */
      rise: random(-7, 1),
      alpha: random(0.16, 0.28 + depth * 0.4),
      tone: TONES[Math.min(TONES.length - 1, Math.floor(depth * TONES.length))],
      wobble: random(0, Math.PI * 2),
      wobbleSpeed: random(0.6, 2.1)
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;
    if (!width || !height) { return; }

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Menge an die Fläche koppeln, damit ein breiter Monitor nicht leer und
       ein Handy nicht überfüllt wirkt. */
    var count = Math.round(Math.min(320, Math.max(90, width * 0.34)));

    grains = [];
    for (var i = 0; i < count; i++) {
      grains.push(makeGrain(true));
    }
  }

  function frame(now) {
    if (!running) { return; }

    if (!lastTime) { lastTime = now; }
    /* Bei einem Tabwechsel kann der Abstand riesig werden – deckeln, sonst
       springt der ganze Sand auf einen Schlag quer durchs Bild. */
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    gustTime += dt;

    /* Zwei überlagerte Sinuswellen mit unrunder Periode: dadurch wiederholt
       sich das Böenmuster nicht hörbar regelmäßig. */
    var gust = 1 + 0.45 * Math.sin(gustTime * 0.23) + 0.28 * Math.sin(gustTime * 0.71 + 1.3);

    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];

      g.x += g.speed * gust * dt;
      g.wobble += g.wobbleSpeed * dt;
      g.y += (g.rise * dt) + Math.sin(g.wobble) * 6 * dt;

      if (g.x - g.r > width || g.y < height * 0.28) {
        grains[i] = makeGrain(false);
        continue;
      }

      ctx.fillStyle = "rgba(" + g.tone + ", " + g.alpha + ")";
      ctx.beginPath();
      /* Etwas in Windrichtung gezogen – wirkt wie Bewegungsunschärfe. */
      ctx.ellipse(g.x, g.y, g.r * (1.4 + gust * 0.5), g.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible || document.hidden) { return; }
    running = true;
    lastTime = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    ctx.clearRect(0, 0, width, height);
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resize();
      if (running) { lastTime = 0; }
    }, 150);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  resize();

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { start(); } else { stop(); }
    }, { threshold: 0 });
    observer.observe(canvas);
  } else {
    visible = true;
    start();
  }
})();
