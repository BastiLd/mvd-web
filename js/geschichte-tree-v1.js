/* ==========================================================================
   Yggdrasil, Fassung V1 (2D)

   Zwei Dinge passieren hier:

     1. Der Streifen mit den drei Reichen wandert seitlich, während man durch
        den hohen .yg-track scrollt. Es wird kein Scroll-Ereignis abgefangen –
        gescrollt wird ganz normal, wir lesen nur die Position des Tracks und
        verschieben den Streifen entsprechend. Dadurch bleiben Tastatur,
        Scrollbalken und Trägheitsscrollen unangetastet.

     2. Lichtsporen auf zwei Canvas-Ebenen (Kopfbereich und Bühne). Gleiche
        Technik wie die Glühwürmchen in js/night.js, nur in Baumfarben.

   Auf schmalen Schirmen und bei reduzierter Bewegung wird die Mechanik gar
   nicht erst aufgebaut: .yg-track bekommt die Klasse --plain und die drei
   Reiche stehen einfach untereinander. Das HTML ist von vornherein ein
   normales Dokument, deshalb ist das kein Sonderfall, sondern schlicht der
   Zustand, in dem dieses Skript nichts tut.
   ========================================================================== */

(function () {
  "use strict";

  var PLAIN_BELOW = 820;

  var track = document.getElementById("yg-track");
  var strip = document.getElementById("yg-strip");
  if (!track || !strip) { return; }

  var realms = Array.prototype.slice.call(strip.querySelectorAll(".yg-realm"));
  var roots = Array.prototype.slice.call(document.querySelectorAll(".yg-root"));
  if (!realms.length) { return; }

  var reduceQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  var dots = null;
  var current = -1;
  var queued = false;
  /* null = noch nichts entschieden. Dadurch wendet decide() beim ersten Lauf
     immer einen der beiden Zustände wirklich an, statt anzunehmen, das
     Dokument sei schon im einfachen Modus. */
  var plain = null;

  /* ------------------------------------------------------------------ Baum */

  function tintOf(realm) {
    return realm.style.getPropertyValue("--realm-tint").trim() || "";
  }

  function setActive(index) {
    if (index === current) { return; }
    current = index;

    realms.forEach(function (realm, i) {
      /* Die Nachbarn bleiben sichtbar, treten aber zurück. */
      realm.style.opacity = i === index ? "1" : "0.35";
    });

    roots.forEach(function (root) {
      var match = realms[index] && root.getAttribute("data-root") === realms[index].getAttribute("data-root");
      root.classList.toggle("is-active", !!match);
      if (match) {
        root.style.setProperty("--root-tint", tintOf(realms[index]));
      }
    });

    if (dots) {
      Array.prototype.forEach.call(dots.children, function (button, i) {
        button.classList.toggle("is-active", i === index);
        button.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }
  }

  function update() {
    queued = false;
    if (plain) { return; }

    var rect = track.getBoundingClientRect();
    var scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) { return; }

    /* 0 = Bühne gerade angekommen, 1 = Track komplett durchgescrollt. */
    var progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

    /* Der erste Bildschirm dient dem Ankommen, danach wird gewandert. */
    var eased = Math.min(Math.max((progress - 0.12) / 0.76, 0), 1);
    var span = realms.length - 1;

    strip.style.transform = "translateX(" + (-eased * span * (100 / realms.length)) + "%)";
    setActive(Math.min(Math.round(eased * span), span));
  }

  function onScroll() {
    if (queued) { return; }
    queued = true;
    window.requestAnimationFrame(update);
  }

  /* In einem versteckten Tab laufen keine Animationsframes. Ohne dieses
     Zurücksetzen bliebe queued für immer auf true stehen und der Streifen
     würde nach der Rückkehr nicht mehr mitwandern. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { return; }
    queued = false;
    /* decide() ist absichtlich dabei: war beim Laden noch keine Breite
       messbar, wird die Entscheidung hier nachgeholt. */
    decide();
    onScroll();
  });

  /* Springt zu der Scrollposition, an der das gewünschte Reich mittig steht. */
  function goTo(index) {
    var scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) { return; }

    var eased = realms.length > 1 ? index / (realms.length - 1) : 0;
    var progress = eased * 0.76 + 0.12;
    var top = track.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({ top: top + progress * scrollable, behavior: "smooth" });
  }

  function buildDots() {
    if (dots) { return; }

    dots = document.createElement("div");
    dots.className = "yg-dots";
    dots.setAttribute("role", "group");
    dots.setAttribute("aria-label", "Wurzel wählen");

    realms.forEach(function (realm, i) {
      var name = realm.querySelector(".yg-realm__name");
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", name ? name.textContent : "Wurzel " + (i + 1));
      button.addEventListener("click", function () { goTo(i); });
      dots.appendChild(button);
    });

    track.querySelector(".yg-stage").appendChild(dots);
  }

  function teardown() {
    plain = true;
    track.classList.add("yg-track--plain");
    strip.style.transform = "";
    realms.forEach(function (realm) { realm.style.opacity = ""; });
    roots.forEach(function (root) { root.classList.remove("is-active"); });
    if (dots) {
      dots.remove();
      dots = null;
    }
    current = -1;
  }

  function setup() {
    plain = false;
    track.classList.remove("yg-track--plain");
    buildDots();
    current = -1;
    update();
  }

  function decide() {
    /* Ohne gemessene Breite – etwa in einem noch nicht dargestellten Tab –
       wäre innerWidth 0 und die Seite bliebe dauerhaft in der einfachen
       Fassung hängen. In dem Fall wird schlicht noch nicht entschieden. */
    if (!window.innerWidth) { return; }

    var wantsPlain = window.innerWidth < PLAIN_BELOW || !!(reduceQuery && reduceQuery.matches);

    if (wantsPlain === plain) {
      if (!plain) { update(); }
      return;
    }

    if (wantsPlain) { teardown(); } else { setup(); }
  }

  /* --------------------------------------------------------------- Sporen */

  function motes(canvas, density) {
    if (!canvas || !canvas.getContext) { return; }
    if (reduceQuery && reduceQuery.matches) { return; }

    var ctx = canvas.getContext("2d");
    var width = 0;
    var height = 0;
    var dust = [];
    var running = false;
    var lastTime = 0;
    var clock = 0;

    function random(min, max) { return min + Math.random() * (max - min); }

    function makeMote() {
      var warm = Math.random();
      return {
        x: random(0, width),
        y: random(0, height),
        r: random(0.9, 2.2),
        /* Sporen steigen leicht auf statt zu fallen. */
        vy: random(-16, -4),
        vx: random(-6, 6),
        pulse: random(0.4, 1.3),
        phase: random(0, Math.PI * 2),
        drift: random(0.2, 0.7),
        driftPhase: random(0, Math.PI * 2),
        color: warm < 0.55 ? "150, 255, 200" : (warm < 0.85 ? "210, 170, 255" : "255, 240, 190")
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

      var count = Math.round(Math.min(density, width / 16));
      dust = [];
      for (var i = 0; i < count; i++) { dust.push(makeMote()); }
    }

    function frame(now) {
      if (!running) { return; }

      if (!lastTime) { lastTime = now; }
      var dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < dust.length; i++) {
        var m = dust[i];
        m.driftPhase += m.drift * dt;
        m.x += (m.vx + Math.sin(m.driftPhase) * 8) * dt;
        m.y += m.vy * dt;

        /* Oben hinaus heißt unten wieder herein. */
        if (m.y < -20) { m.y = height + 20; m.x = random(0, width); }
        if (m.x < -20) { m.x = width + 20; }
        if (m.x > width + 20) { m.x = -20; }

        var glow = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(clock * m.pulse + m.phase));
        var g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 8);
        g.addColorStop(0, "rgba(" + m.color + ", " + (0.7 * glow) + ")");
        g.addColorStop(0.4, "rgba(" + m.color + ", " + (0.18 * glow) + ")");
        g.addColorStop(1, "rgba(" + m.color + ", 0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 250, " + (0.75 * glow) + ")";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || document.hidden) { return; }
      running = true;
      lastTime = 0;
      window.requestAnimationFrame(frame);
    }

    function stop() { running = false; }

    /* Außerhalb des Sichtfelds wird nicht gezeichnet – spart Akku. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { start(); } else { stop(); }
        });
      }, { rootMargin: "120px" }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); }
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resize();
        if (running) { lastTime = 0; }
      }, 150);
    });

    resize();
  }

  /* ----------------------------------------------------------------- Start */

  window.addEventListener("scroll", onScroll, { passive: true });

  var decideTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(decideTimer);
    decideTimer = window.setTimeout(decide, 150);
  });

  if (reduceQuery && reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", decide);
  }

  motes(document.getElementById("yg-motes"), 34);
  motes(document.getElementById("yg-hero-motes"), 26);

  decide();
})();
