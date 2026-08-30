/* ==========================================================================
   Yggdrasil, Fassung V2 (3D mit Three.js)

   Zwei getrennte Dinge, die einander nicht brauchen:

     1. Der Streifen mit den drei Reichen wandert seitlich, während man durch
        den hohen .yg3-track scrollt – dieselbe Mechanik wie in V1: kein
        abgefangenes Scrollen, nur Position lesen und verschieben.

     2. Der Baum als 3D-Szene im Hintergrund.

   Läuft (2) nicht, läuft (1) trotzdem. Läuft (1) nicht, stehen die Reiche
   untereinander. Fällt beides aus, bleibt eine ganz normale Seite übrig –
   das HTML ist von vornherein vollständig und lesbar.

   Leistungsstufen:
     full   – volle Partikelzahl, Bildschärfe bis 2x
     lite   – weniger Partikel, Bildschärfe 1x, einfachere Materialien
     plain  – gar kein 3D

   Die Stufe wird zuerst aus den Geräteangaben geschätzt und danach an der
   tatsächlichen Bildrate nachgeschärft: Wer unter 30 Bilder je Sekunde
   bleibt, fällt automatisch eine Stufe zurück. So bekommt ein aktuelles
   Handy den vollen Baum und ein altes trotzdem eine flüssige Seite.
   ========================================================================== */

(function () {
  "use strict";

  var PAN_BELOW = 820;

  var track = document.getElementById("yg3-track");
  var strip = document.getElementById("yg3-strip");
  var canvas = document.getElementById("yg3-canvas");
  var status = document.getElementById("yg3-status");
  if (!track || !strip) { return; }

  var realms = Array.prototype.slice.call(strip.querySelectorAll(".yg3-realm"));
  if (!realms.length) { return; }

  var reduceQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  var dots = null;
  var current = -1;
  var queued = false;
  var plain = null;
  var progress = 0;

  /* ============================================================== Streifen */

  function setActive(index) {
    if (index === current) { return; }
    current = index;

    realms.forEach(function (realm, i) {
      realm.style.opacity = i === index ? "1" : "0.35";
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

    var rect = track.getBoundingClientRect();
    var scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) { return; }

    progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
    if (plain) { return; }

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
     Zurücksetzen bliebe queued dauerhaft auf true stehen. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { return; }
    queued = false;
    onScroll();
  });

  function goTo(index) {
    var scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) { return; }

    var eased = realms.length > 1 ? index / (realms.length - 1) : 0;
    var top = track.getBoundingClientRect().top + window.pageYOffset;

    window.scrollTo({ top: top + (eased * 0.76 + 0.12) * scrollable, behavior: "smooth" });
  }

  function buildDots() {
    if (dots) { return; }

    dots = document.createElement("div");
    dots.className = "yg3-dots";
    dots.setAttribute("role", "group");
    dots.setAttribute("aria-label", "Wurzel wählen");

    realms.forEach(function (realm, i) {
      var name = realm.querySelector(".yg3-realm__name");
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", name ? name.textContent : "Wurzel " + (i + 1));
      button.addEventListener("click", function () { goTo(i); });
      dots.appendChild(button);
    });

    track.querySelector(".yg3-stage").appendChild(dots);
  }

  function decide() {
    var wantsPlain = window.innerWidth < PAN_BELOW || !!(reduceQuery && reduceQuery.matches);

    if (wantsPlain === plain) {
      if (!plain) { update(); }
      return;
    }

    plain = wantsPlain;

    if (wantsPlain) {
      track.classList.add("yg3-track--plain");
      strip.style.transform = "";
      realms.forEach(function (realm) { realm.style.opacity = ""; });
      if (dots) { dots.remove(); dots = null; }
      current = -1;
    } else {
      track.classList.remove("yg3-track--plain");
      buildDots();
      current = -1;
      update();
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  var decideTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(decideTimer);
    decideTimer = window.setTimeout(decide, 150);
  });

  if (reduceQuery && reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", decide);
  }

  decide();

  /* =================================================================== 3D */

  function say(text) {
    if (!status) { return; }
    if (!text) { status.hidden = true; return; }
    status.hidden = false;
    status.textContent = text;
  }

  function hasWebGL() {
    try {
      var probe = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (probe.getContext("webgl") || probe.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  /* Erste Schätzung aus dem, was der Browser über das Gerät verrät. */
  function guessTier() {
    var cores = navigator.hardwareConcurrency || 4;
    var memory = navigator.deviceMemory || 4;
    var dense = (window.devicePixelRatio || 1) > 2.5;

    if (cores <= 4 || memory <= 4 || dense) { return "lite"; }
    return "full";
  }

  /* Alle Gründe, aus denen es kein 3D gibt, an einer Stelle. Trifft einer zu,
     bleibt schlicht die Textfassung stehen – die ist ohnehin schon da. */
  function canRun() {
    if (!canvas || !canvas.getContext) { return false; }
    if (document.documentElement.classList.contains("no-three")) { return false; }
    if (typeof window.THREE === "undefined") { return false; }
    if (reduceQuery && reduceQuery.matches) { return false; }
    return hasWebGL();
  }

  function startTree() {
    var THREE = window.THREE;
    var tier = guessTier();
    var renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: tier === "full",
        alpha: true,
        powerPreference: "low-power"
      });
    } catch (e) {
      say("");
      return;
    }

    say("");

    var scene = new THREE.Scene();
    /* Nebel nur so dicht, dass Tiefe entsteht – bei höheren Werten frisst er
       bei der Kameraentfernung von ~48 Einheiten die Leuchtfarben auf. */
    scene.fog = new THREE.FogExp2(0x061110, 0.011);

    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);

    /* Licht: ein warmes Grün von unten, ein kühles Violett von oben. */
    scene.add(new THREE.AmbientLight(0x2c5a4a, 1.1));

    var lightLow = new THREE.PointLight(0x6effb4, 60, 90);
    lightLow.position.set(0, 2, 6);
    scene.add(lightLow);

    var lightHigh = new THREE.PointLight(0xc084fc, 45, 110);
    lightHigh.position.set(-6, 26, 8);
    scene.add(lightHigh);

    var tree = new THREE.Group();
    scene.add(tree);

    /* Stamm: mehrere Segmente, nach oben schmaler werdend. */
    var trunkMat = new THREE.MeshStandardMaterial({
      color: 0x1c6b4c,
      emissive: 0x3fe89b,
      emissiveIntensity: 1.15,
      roughness: 0.55,
      metalness: 0.05,
      flatShading: tier === "lite"
    });

    var segments = [
      { r0: 2.6, r1: 1.9, h: 5, y: 2.5 },
      { r0: 1.9, r1: 1.45, h: 5, y: 7.5 },
      { r0: 1.45, r1: 1.05, h: 5, y: 12.5 },
      { r0: 1.05, r1: 0.7, h: 4, y: 17 }
    ];

    segments.forEach(function (s) {
      var geo = new THREE.CylinderGeometry(s.r1, s.r0, s.h, tier === "full" ? 20 : 10, 1, true);
      var mesh = new THREE.Mesh(geo, trunkMat);
      mesh.position.y = s.y;
      tree.add(mesh);
    });

    /* Wurzelfuß */
    var flare = new THREE.Mesh(
      new THREE.ConeGeometry(5.2, 3.4, tier === "full" ? 22 : 10, 1, true),
      trunkMat
    );
    flare.position.y = 1.7;
    tree.add(flare);

    /* Äste: schlanke Zylinder, im Kreis nach außen geneigt. */
    var branchMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a6b,
      emissive: 0xb18cf5,
      emissiveIntensity: 0.95,
      roughness: 0.6,
      flatShading: tier === "lite"
    });

    var branchCount = tier === "full" ? 9 : 6;
    for (var b = 0; b < branchCount; b++) {
      var angle = (b / branchCount) * Math.PI * 2;
      var len = 5 + (b % 3) * 1.4;
      var branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.42, len, tier === "full" ? 10 : 6),
        branchMat
      );
      branch.position.set(
        Math.cos(angle) * len * 0.34,
        18.4 + (b % 3) * 1.1,
        Math.sin(angle) * len * 0.34
      );
      branch.rotation.z = -Math.cos(angle) * 0.85;
      branch.rotation.x = Math.sin(angle) * 0.85;
      tree.add(branch);
    }

    /* Krone: eine große, weiche Kugel als Lichtwolke. */
    /* Zwei ineinanderliegende Schalen statt einer: die äußere von innen
       gerendert, dadurch wird der Rand weich statt zu einer harten Scheibe. */
    [
      { r: 8, opacity: 0.2, side: THREE.FrontSide },
      { r: 11.5, opacity: 0.1, side: THREE.BackSide }
    ].forEach(function (shell) {
      var crown = new THREE.Mesh(
        new THREE.SphereGeometry(shell.r, tier === "full" ? 26 : 12, tier === "full" ? 20 : 10),
        new THREE.MeshBasicMaterial({
          color: 0xb98cf0,
          transparent: true,
          opacity: shell.opacity,
          side: shell.side,
          depthWrite: false
        })
      );
      crown.position.y = 21.5;
      tree.add(crown);
    });

    /* Drei Wurzeln als Röhren entlang geschwungener Kurven. */
    var rootTints = realms.map(function (realm) {
      var value = realm.style.getPropertyValue("--realm-tint").trim();
      return new THREE.Color(value || "#4ade80");
    });

    var rootMeshes = [];
    realms.forEach(function (realm, i) {
      var side = i - 1;
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.4, 0),
        new THREE.Vector3(side * 3.5 + 1.5, 0.5, 3 + i * 1.4),
        new THREE.Vector3(side * 7 + 3.5, -0.6, 7 + i * 2.2),
        new THREE.Vector3(side * 10 + 6, -1.6, 12 + i * 3)
      ]);

      var mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, tier === "full" ? 40 : 18, 0.5, tier === "full" ? 10 : 5, false),
        new THREE.MeshStandardMaterial({
          color: 0x14432f,
          emissive: rootTints[i],
          emissiveIntensity: 0.25,
          roughness: 0.6,
          flatShading: tier === "lite"
        })
      );
      tree.add(mesh);
      rootMeshes.push(mesh);
    });

    /* Sporen: Punktwolke mit weichem, selbst gezeichnetem Punkt. */
    function makeDot() {
      var size = 64;
      var c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      var g = c.getContext("2d");
      var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.35, "rgba(190,255,220,0.55)");
      grad.addColorStop(1, "rgba(190,255,220,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }

    var moteCount = tier === "full" ? 900 : 260;
    var positions = new Float32Array(moteCount * 3);
    var speeds = new Float32Array(moteCount);

    for (var m = 0; m < moteCount; m++) {
      positions[m * 3] = (Math.random() - 0.5) * 60;
      positions[m * 3 + 1] = Math.random() * 46 - 4;
      positions[m * 3 + 2] = (Math.random() - 0.5) * 50;
      speeds[m] = 0.6 + Math.random() * 1.8;
    }

    var moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      size: 0.5,
      map: makeDot(),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    scene.add(motes);

    /* ------------------------------------------------------------ Ablauf */

    var running = false;
    var lastTime = 0;
    var clock = 0;
    var frames = 0;
    var sampleTime = 0;
    var checked = false;

    function applyTier() {
      renderer.setPixelRatio(tier === "full"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1);
    }

    function downgrade() {
      if (tier === "full") {
        tier = "lite";
        applyTier();
        motes.material.opacity = 0.6;
        return true;
      }
      /* Auch die schlanke Stufe ist zu viel: 3D ganz abschalten. */
      stop();
      renderer.dispose();
      canvas.style.display = "none";
      return false;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) { return; }
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }

    function frame(now) {
      if (!running) { return; }

      if (!lastTime) { lastTime = now; }
      var dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      /* Bildrate über die ersten Sekunden messen und notfalls abstufen. */
      if (!checked) {
        frames++;
        sampleTime += dt;
        if (sampleTime > 2.5) {
          checked = true;
          if (frames / sampleTime < 30 && !downgrade()) { return; }
        }
      }

      /* Sporen steigen langsam auf. */
      var pos = moteGeo.attributes.position.array;
      for (var i = 0; i < moteCount; i++) {
        pos[i * 3 + 1] += speeds[i] * dt;
        if (pos[i * 3 + 1] > 42) { pos[i * 3 + 1] = -4; }
      }
      moteGeo.attributes.position.needsUpdate = true;

      /* Der Baum dreht sich mit dem Scrollfortschritt, die Kamera fährt
         dabei tiefer an die Wurzeln heran. */
      tree.rotation.y = -0.5 + progress * 1.5 + Math.sin(clock * 0.08) * 0.03;

      /* Im Querformat liegt der Blickpunkt rechts der Baumachse, damit der
         Baum im linken Bilddrittel steht und die Karte ihn nicht verdeckt.
         Im Hochformat steht die Karte darunter statt daneben: dann wird
         mittig geblickt und weiter weggerückt, sonst füllt der Stamm allein
         das ganze Bild. */
      var portrait = camera.aspect < 1.1;
      var radius = (48 - progress * 8) * (portrait ? 1.7 : 1);

      camera.position.set(
        Math.sin(progress * 0.9 - 0.35) * radius,
        22 - progress * 15,
        Math.cos(progress * 0.9 - 0.35) * radius
      );
      camera.lookAt(portrait ? 0 : 7, 13 - progress * 11, 0);

      /* Die Wurzel des aktuellen Reichs glüht auf. */
      rootMeshes.forEach(function (mesh, i) {
        var want = i === current ? 1.5 : 0.22;
        var mat = mesh.material;
        mat.emissiveIntensity += (want - mat.emissiveIntensity) * Math.min(dt * 4, 1);
      });

      renderer.render(scene, camera);
      window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || document.hidden) { return; }
      running = true;
      lastTime = 0;
      window.requestAnimationFrame(frame);
    }

    function stop() { running = false; }

    applyTier();
    resize();

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

    /* Außerhalb des Sichtfelds wird nicht gerechnet. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { start(); } else { stop(); }
        });
      }, { rootMargin: "200px" }).observe(track);
    } else {
      start();
    }
  }

  function boot() {
    if (!canRun()) { say(""); return; }
    startTree();
  }

  say("Baum wird geladen");

  /* Erst starten, wenn der Rest der Seite steht – der Baum ist Beiwerk. */
  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot);
  }

  /* Sicherheitsnetz: Bleibt die Meldung aus irgendeinem Grund stehen, wird
     sie nach ein paar Sekunden entfernt. Eine Ladeanzeige, die nie
     verschwindet, ist schlimmer als gar keine. */
  window.setTimeout(function () { say(""); }, 6000);
})();
