/* ==========================================================================
   Wolken für die Himmelzone der Creator-Seite.

   Gezeichnet wird auf ein <canvas>, weil weiche, sich überlagernde Formen mit
   CSS nur mit vielen Blur-Ebenen gehen – das kostet auf dem Handy deutlich
   mehr Leistung als ein einziger Canvas.

   Jede Wolke besteht aus mehreren runden Ballen mit weichem Rand und wandert
   per Sinus langsam hin und her, statt in eine Richtung durchzulaufen.
   ========================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("sky-clouds");
  if (!canvas || !canvas.getContext) { return; }

  /* Wer im System weniger Bewegung eingestellt hat, bekommt gar keine
     Animation. Das CSS blendet den Canvas dann ohnehin aus. */
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced && reduced.matches) { return; }

  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var clouds = [];
  var running = false;
  var startTime = 0;

  /* Bauplan der fünf Wolken. y ist der Anteil der Zonenhöhe: die Überschrift
     sitzt bei etwa 22–38%, das orange Horizontband bei 63%. Die Wolken liegen
     also bewusst dazwischen und lassen den Text frei. */
  var PLAN = [
    { y: 0.435, scale: 1.00, x: 0.20, drift: 0.20, period: 78, alpha: 0.30, warm: 0.15 },
    { y: 0.485, scale: 1.45, x: 0.68, drift: 0.16, period: 96, alpha: 0.26, warm: 0.25 },
    { y: 0.530, scale: 0.80, x: 0.44, drift: 0.26, period: 63, alpha: 0.24, warm: 0.35 },
    { y: 0.575, scale: 1.20, x: 0.84, drift: 0.14, period: 110, alpha: 0.22, warm: 0.55 },
    { y: 0.605, scale: 0.95, x: 0.10, drift: 0.22, period: 87, alpha: 0.18, warm: 0.70 }
  ];

  /* Ballen einer Wolke, relativ zu ihrer Grundgröße. */
  var PUFFS = [
    { x: -1.15, y: 0.16, r: 0.52 },
    { x: -0.55, y: -0.10, r: 0.72 },
    { x: 0.10, y: -0.24, r: 0.88 },
    { x: 0.72, y: -0.02, r: 0.68 },
    { x: 1.28, y: 0.20, r: 0.46 },
    { x: 0.28, y: 0.28, r: 0.60 }
  ];

  function resize() {
    var rect = canvas.getBoundingClientRect();
    /* Auf schmalen Displays bleiben die Wolken kleiner, sonst füllt eine
       einzige Wolke schon die halbe Breite. */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var base = Math.max(90, Math.min(width * 0.16, 210));

    clouds = PLAN.map(function (p) {
      return {
        baseX: p.x * width,
        y: p.y * height,
        size: base * p.scale,
        drift: p.drift * width,
        period: p.period,
        phase: p.x * Math.PI * 2,
        alpha: p.alpha,
        warm: p.warm
      };
    });
  }

  /* Ein einzelner Ballen: radialer Verlauf von innen deckend nach außen
     transparent – dadurch entsteht der weiche Rand ohne Blur-Filter. */
  function drawPuff(x, y, r, alpha, warm) {
    var g = ctx.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r);
    /* Weiter unten am Horizont bekommen die Wolken einen wärmeren Ton, damit
       sie zum Sonnenuntergang darunter passen. */
    var top = "rgba(" + Math.round(206 + warm * 44) + ", " +
                        Math.round(206 + warm * 12) + ", " +
                        Math.round(214 - warm * 44) + ", " + alpha + ")";
    var mid = "rgba(" + Math.round(150 + warm * 70) + ", " +
                        Math.round(148 + warm * 30) + ", " +
                        Math.round(168 - warm * 40) + ", " + (alpha * 0.45) + ")";

    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, "rgba(120, 120, 140, 0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCloud(cloud, t) {
    /* Hin und her statt einmal quer: Sinus über die eigene Periode. */
    var x = cloud.baseX + Math.sin((t / cloud.period) * Math.PI * 2 + cloud.phase) * cloud.drift;
    var y = cloud.y + Math.sin((t / (cloud.period * 1.7)) * Math.PI * 2 + cloud.phase) * (cloud.size * 0.05);

    for (var i = 0; i < PUFFS.length; i++) {
      var p = PUFFS[i];
      drawPuff(
        x + p.x * cloud.size,
        y + p.y * cloud.size * 0.6,
        p.r * cloud.size,
        cloud.alpha,
        cloud.warm
      );
    }
  }

  function frame(now) {
    if (!running) { return; }

    if (!startTime) { startTime = now; }
    var t = (now - startTime) / 1000;

    ctx.clearRect(0, 0, width, height);
    /* Übereinanderliegende Ballen sollen sich aufhellen, nicht gegenseitig
       überdecken – sonst sieht man die einzelnen Kreise. */
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < clouds.length; i++) {
      drawCloud(clouds[i], t);
    }

    ctx.globalCompositeOperation = "source-over";
    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running) { return; }
    running = true;
    startTime = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() { running = false; }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  });

  /* Im Hintergrundtab nicht weiterrechnen. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  resize();
  start();
})();
