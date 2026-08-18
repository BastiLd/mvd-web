/* ==========================================================================
   Sandsturm über den Dünen im Footer (V1).

   Zwei Ebenen auf einem gemeinsamen Canvas:

     1. Treibsand  – Körner, die im Wind über die Kämme ziehen. Der Wind
                     schwillt in Böen an und ab, damit es nicht wie ein
                     gleichmäßiger Regen wirkt.
     2. Sandhosen  – zwei bis drei schmale Wirbel, die über die Dünen wandern.
                     Jeder besteht aus gestapelten, gegeneinander verdrehten
                     Ellipsen: unten schmal und dicht, oben breit und dünn.

   Läuft nur, solange der Footer im Bild ist, pausiert im Hintergrundtab und
   bleibt bei prefers-reduced-motion ganz aus.
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
  var devils = [];
  var running = false;
  var visible = false;
  var lastTime = 0;
  var clock = 0;

  /* Sandtöne von hell (hinten, hoch) bis dunkel (vorne, tief). */
  var TONES = ["243, 232, 205", "228, 196, 138", "201, 154, 88", "148, 101, 55"];

  /* Oberhalb davon ist nur leerer Himmel – dort soll kein Sand liegen. */
  var TOP = 0.3;

  function random(min, max) { return min + Math.random() * (max - min); }

  function makeGrain(spawnAnywhere) {
    var depth = Math.random();

    return {
      x: spawnAnywhere ? random(0, width) : random(-60, -6),
      y: random(height * TOP, height * 0.97),
      /* Deutlich größer als reiner Staub, sonst sieht man auf dem Handy
         praktisch nichts. */
      r: random(0.9, 1.3 + depth * 2.6),
      speed: random(26, 52) + depth * 92,
      rise: random(-11, 2),
      alpha: random(0.2, 0.34 + depth * 0.42),
      tone: TONES[Math.min(TONES.length - 1, Math.floor(depth * TONES.length))],
      wobble: random(0, Math.PI * 2),
      wobbleSpeed: random(0.7, 2.4)
    };
  }

  function makeDevil(index, total, spawnAnywhere) {
    /* Gleichmäßig verteilt starten, danach setzt jeder für sich neu an. */
    var slot = (index + 0.5) / total;

    return {
      x: spawnAnywhere ? slot * width : random(-160, -60),
      /* Fußpunkt auf den Dünen. */
      base: random(height * 0.82, height * 0.99),
      h: random(height * 0.4, height * 0.66),
      /* Breite am Fuß bzw. an der Spitze. */
      footW: random(7, 13),
      headW: random(38, 74),
      speed: random(16, 34),
      spin: random(1.6, 3.2) * (Math.random() < 0.5 ? -1 : 1),
      phase: random(0, Math.PI * 2),
      /* Atmet in der Stärke, damit er auf- und abflaut. */
      breath: random(0.09, 0.19),
      breathSpeed: random(0.25, 0.5),
      lean: random(-0.16, 0.3)
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

    /* Menge an die Fläche koppeln: ein breiter Monitor soll nicht leer
       wirken, ein Handy nicht überladen. */
    var count = Math.round(Math.min(520, Math.max(150, width * 0.55)));

    grains = [];
    for (var i = 0; i < count; i++) {
      grains.push(makeGrain(true));
    }

    var devilCount = width < 640 ? 2 : 3;
    devils = [];
    for (var d = 0; d < devilCount; d++) {
      devils.push(makeDevil(d, devilCount, true));
    }
  }

  /* Eine Sandhose: von unten nach oben gestapelte Ellipsen, die mit der Höhe
     breiter, blasser und stärker verdreht werden. */
  function drawDevil(dv, gust) {
    var strength = dv.breath * (0.62 + 0.38 * Math.sin(clock * dv.breathSpeed + dv.phase)) * gust;
    if (strength <= 0.01) { return; }

    var steps = 16;

    for (var i = 0; i < steps; i++) {
      var t = i / (steps - 1);
      /* Oben schneller breiter werden als unten – das ergibt die typische
         Trichterform statt eines geraden Kegels. */
      var w = dv.footW + (dv.headW - dv.footW) * (t * t);
      var y = dv.base - dv.h * t;
      /* Die Achse kippt mit der Höhe in Windrichtung und schlingert. */
      var sway = Math.sin(clock * 1.5 + dv.phase + t * 3.4) * (6 + t * 22);
      var x = dv.x + dv.lean * dv.h * t + sway;

      var alpha = strength * (1 - t * 0.72);
      var toneIndex = Math.min(TONES.length - 1, Math.floor(t * 2));

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(clock * dv.spin + t * 2.2 + dv.phase) * 0.22);
      ctx.fillStyle = "rgba(" + TONES[toneIndex] + ", " + alpha + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, w, w * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(now) {
    if (!running) { return; }

    if (!lastTime) { lastTime = now; }
    /* Nach einem Tabwechsel kann der Abstand riesig werden – deckeln, sonst
       springt alles auf einen Schlag quer durchs Bild. */
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    clock += dt;

    /* Zwei überlagerte Wellen mit unrunder Periode: so wiederholt sich das
       Böenmuster nicht erkennbar regelmäßig. */
    var gust = 1 + 0.5 * Math.sin(clock * 0.23) + 0.3 * Math.sin(clock * 0.71 + 1.3);

    ctx.clearRect(0, 0, width, height);

    /* Wirbel zuerst, damit die einzelnen Körner davor liegen. */
    for (var d = 0; d < devils.length; d++) {
      var dv = devils[d];
      dv.x += dv.speed * gust * dt;
      drawDevil(dv, gust);

      if (dv.x - dv.headW > width) {
        devils[d] = makeDevil(d, devils.length, false);
      }
    }

    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];

      g.x += g.speed * gust * dt;
      g.wobble += g.wobbleSpeed * dt;
      g.y += (g.rise * dt) + Math.sin(g.wobble) * 7 * dt;

      if (g.x - g.r > width || g.y < height * (TOP - 0.04)) {
        grains[i] = makeGrain(false);
        continue;
      }

      ctx.fillStyle = "rgba(" + g.tone + ", " + g.alpha + ")";
      ctx.beginPath();
      /* In Windrichtung gezogen – wirkt wie Bewegungsunschärfe. */
      ctx.ellipse(g.x, g.y, g.r * (1.5 + gust * 0.6), g.r, 0, 0, Math.PI * 2);
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

  function remeasure() {
    resize();
    if (running) { lastTime = 0; }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(remeasure, 150);
  });

  /* Ein window-resize allein reicht nicht: beim ersten Aufbau kann der Canvas
     noch keine echte Breite haben (z.B. weil das Layout noch nicht steht).
     Dann bliebe die Zeichenfläche dauerhaft zu klein, ohne dass je ein
     resize-Ereignis käme. Der Observer meldet jede Größenänderung des
     Elements selbst und schließt diese Lücke. */
  if ("ResizeObserver" in window) {
    var observerSize = new ResizeObserver(function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(remeasure, 150);
    });
    observerSize.observe(canvas);
  }

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
