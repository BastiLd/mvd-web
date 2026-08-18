/* ==========================================================================
   Schwebende Deko-Objekte in den Bereichen.

   ---------------------------------------------------------------------------
   EIN- UND AUSSCHALTEN
   Jeder Bereich sagt selbst, was bei ihm schweben soll:

       <section id="youtube" data-deco="play">     …  Play-Dreiecke
       <section id="discord" data-deco="bubble">   …  Sprechblasen + Funken
       <section id="zugriff" data-deco="key">      …  Schlüssel und Schilde
       <section id="basti"   data-deco="gear">     …  Zahnräder

   Deko in einem Bereich wieder loswerden: einfach das data-deco-Attribut aus
   dem HTML löschen. Sonst ist nirgends etwas einzutragen – dieses Skript
   sucht die Bereiche selbst und legt das Canvas an.

   Mehrere Formen gleichzeitig gehen mit Komma: data-deco="play,spark"
   ---------------------------------------------------------------------------

   Gezeichnet wird auf je einem Canvas hinter dem Inhalt. Die Objekte treiben
   langsam nach oben und drehen sich dabei leicht.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced && reduced.matches) { return; }

  var hosts = Array.prototype.slice.call(document.querySelectorAll("[data-deco]"));
  if (!hosts.length) { return; }

  function random(min, max) { return min + Math.random() * (max - min); }

  /* ------------------------------------------------------------- Zeichner
     Alle Formen sind auf eine Größe von etwa 1 normiert und werden über
     ctx.scale auf ihre tatsächliche Größe gebracht. */
  var SHAPES = {
    play: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-0.42, -0.55);
      ctx.lineTo(0.6, 0);
      ctx.lineTo(-0.42, 0.55);
      ctx.closePath();
      ctx.stroke();
    },

    bubble: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-0.75, -0.5);
      ctx.lineTo(0.75, -0.5);
      ctx.lineTo(0.75, 0.32);
      ctx.lineTo(-0.28, 0.32);
      ctx.lineTo(-0.5, 0.72);
      ctx.lineTo(-0.55, 0.32);
      ctx.lineTo(-0.75, 0.32);
      ctx.closePath();
      ctx.stroke();
    },

    key: function (ctx) {
      ctx.beginPath();
      ctx.arc(-0.42, 0, 0.3, 0, Math.PI * 2);
      ctx.moveTo(-0.14, 0);
      ctx.lineTo(0.72, 0);
      ctx.moveTo(0.5, 0);
      ctx.lineTo(0.5, 0.28);
      ctx.moveTo(0.68, 0);
      ctx.lineTo(0.68, 0.22);
      ctx.stroke();
    },

    shield: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(0, -0.65);
      ctx.lineTo(0.55, -0.4);
      ctx.lineTo(0.55, 0.16);
      ctx.quadraticCurveTo(0.55, 0.55, 0, 0.72);
      ctx.quadraticCurveTo(-0.55, 0.55, -0.55, 0.16);
      ctx.lineTo(-0.55, -0.4);
      ctx.closePath();
      ctx.stroke();
    },

    gear: function (ctx) {
      var teeth = 8;
      var inner = 0.34;
      var outer = 0.62;

      ctx.beginPath();
      for (var i = 0; i < teeth * 2; i++) {
        var a = (i / (teeth * 2)) * Math.PI * 2;
        var r = i % 2 === 0 ? outer : inner * 1.28;
        var x = Math.cos(a) * r;
        var y = Math.sin(a) * r;
        if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
      }
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, inner * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    },

    /* Funken sind gefüllt statt umrissen – sie sollen glimmen, nicht
       gezeichnet wirken. */
    spark: function (ctx) {
      ctx.beginPath();
      ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  var FILLED = { spark: true };

  function setup(host) {
    var kinds = host.getAttribute("data-deco").split(",").map(function (k) {
      return k.trim();
    }).filter(function (k) { return SHAPES[k]; });

    if (!kinds.length) { return; }

    var canvas = document.createElement("canvas");
    canvas.className = "deco";
    canvas.setAttribute("aria-hidden", "true");
    host.insertBefore(canvas, host.firstChild);

    var ctx = canvas.getContext("2d");
    if (!ctx) { return; }

    /* Auf hellem Grund dunkle Umrisse, auf dunklem Grund helle – sonst
       verschwindet die Deko oder wird zu laut. */
    var dark = host.classList.contains("band--ink") ||
               host.classList.contains("band--basti") ||
               host.getAttribute("data-deco-dark") === "true";

    var stroke = dark ? "rgba(255, 255, 255, 0.16)" : "rgba(20, 20, 26, 0.13)";
    var sparkColor = "rgba(226, 35, 26, 0.5)";

    var width = 0;
    var height = 0;
    var items = [];
    var running = false;
    var visible = false;
    var lastTime = 0;

    function makeItem(spawnAnywhere) {
      var kind = kinds[Math.floor(Math.random() * kinds.length)];
      var isSpark = !!FILLED[kind];

      return {
        kind: kind,
        spark: isSpark,
        x: random(0.04, 0.96) * width,
        y: spawnAnywhere ? random(0, height) : height + random(20, 120),
        size: isSpark ? random(3, 7) : random(26, 62),
        rise: isSpark ? random(14, 34) : random(6, 17),
        drift: random(-9, 9),
        spin: random(-0.35, 0.35),
        angle: random(0, Math.PI * 2),
        alpha: isSpark ? random(0.35, 1) : random(0.5, 1),
        pulse: random(0.4, 1.1),
        phase: random(0, Math.PI * 2)
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

      /* Wenige und große Objekte auf schmalen Schirmen, sonst wirkt es
         zugestellt. */
      var count = width < 620 ? 5 : Math.round(Math.min(14, Math.max(7, width / 130)));

      items = [];
      for (var i = 0; i < count; i++) { items.push(makeItem(true)); }
    }

    function frame(now) {
      if (!running) { return; }

      if (!lastTime) { lastTime = now; }
      var dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";

      for (var i = 0; i < items.length; i++) {
        var it = items[i];

        it.y -= it.rise * dt;
        it.x += it.drift * dt;
        it.angle += it.spin * dt;
        it.phase += it.pulse * dt;

        if (it.y < -it.size * 1.5) {
          items[i] = makeItem(false);
          continue;
        }

        /* Am oberen und unteren Rand ausblenden, damit nichts hart
           auftaucht oder abgeschnitten wird. */
        var edge = Math.min(1, Math.min(it.y, height - it.y) / (height * 0.16));
        var a = it.alpha * Math.max(0, edge) * (0.65 + 0.35 * Math.sin(it.phase));

        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(it.angle);
        ctx.scale(it.size, it.size);
        ctx.lineWidth = 2 / it.size;
        ctx.globalAlpha = a;

        if (it.spark) {
          ctx.fillStyle = sparkColor;
        } else {
          ctx.strokeStyle = stroke;
        }

        SHAPES[it.kind](ctx);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
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
    function remeasure() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resize();
        if (running) { lastTime = 0; }
      }, 150);
    }

    window.addEventListener("resize", remeasure);

    if ("ResizeObserver" in window) {
      new ResizeObserver(remeasure).observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    resize();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { start(); } else { stop(); }
      }, { threshold: 0 }).observe(canvas);
    } else {
      visible = true;
      start();
    }
  }

  hosts.forEach(setup);
})();
