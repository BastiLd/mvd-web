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

  /* Wie weit jedes Reich in der Mitte steht, 0..1. Dieselbe Zahl treibt das
     Emblem im CSS und den Baum in der 3D-Szene – so zeigen Karte und Baum
     immer dasselbe Reich, ohne dass eins vom anderen wissen muss. */
  var near = realms.map(function () { return 0; });

  /* ============================================================== Streifen */

  /* Wie weit steht Reich i in der Mitte? 1 = genau mittig, 0 = ein volles
     Feld daneben. Diese Zahl geht als --near ins CSS und treibt dort das
     ganze Emblem: Ring, Schein, Buchstabe. Sie ist bewusst stufenlos, damit
     die Bewegung am Scrollen hängt statt an einem Umschaltpunkt. */
  function nearness(position, index) {
    var d = Math.abs(position - index);
    return d >= 1 ? 0 : 1 - d;
  }

  /* Weich in der Mitte, weich an den Rändern – lässt das Aufleuchten
     weniger nach linearer Rampe aussehen. */
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  function setNear(position) {
    realms.forEach(function (realm, i) {
      near[i] = smooth(nearness(position, i));
      realm.style.setProperty("--near", near[i].toFixed(3));
    });
  }

  function setActive(index) {
    if (index === current) { return; }
    current = index;

    realms.forEach(function (realm, i) {
      realm.classList.toggle("is-active", i === index);
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
    var position = eased * span;

    strip.style.transform = "translateX(" + (-eased * span * (100 / realms.length)) + "%)";
    setNear(position);
    setActive(Math.min(Math.round(position), span));
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
    /* decide() ist absichtlich dabei: war beim Laden noch keine Breite
       messbar, wird die Entscheidung hier nachgeholt. */
    decide();
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
    /* Ohne gemessene Breite – etwa in einem noch nicht dargestellten Tab –
       wäre innerWidth 0 und die Seite bliebe dauerhaft in der einfachen
       Fassung hängen. In dem Fall wird schlicht noch nicht entschieden. */
    if (!window.innerWidth) { return; }

    var wantsPlain = window.innerWidth < PAN_BELOW || !!(reduceQuery && reduceQuery.matches);

    if (wantsPlain === plain) {
      if (!plain) { update(); }
      return;
    }

    plain = wantsPlain;

    if (wantsPlain) {
      track.classList.add("yg3-track--plain");
      strip.style.transform = "";
      /* Untereinander steht kein Reich „weiter vorn“ als ein anderes: alle
         Embleme sind fertig gezeichnet, keines ist das aktive. */
      realms.forEach(function (realm, i) {
        realm.style.opacity = "";
        realm.style.setProperty("--near", "1");
        realm.classList.remove("is-active");
        near[i] = i === 0 ? 1 : 0;
      });
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

  /* ------------------------------------------------------------ Werkzeug */

  /* Fester Zufall. Der Baum soll bei jedem Aufruf derselbe sein – sonst
     wächst er bei jedem Neuladen anders, und das fällt sofort auf. */
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6d2b79f5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Weiche Scheibe, aus der Sporen, Blüten und der Bodenschein bestehen. */
  function radialTexture(THREE, stops, size) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { grad.addColorStop(s[0], s[1]); });
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /* Ein Buchstabe als leuchtende Tafel. Damit stehen M, B und M nicht nur
     in der Karte, sondern auch draußen am Ende der jeweiligen Wurzel. */
  function glyphTexture(THREE, letter, color) {
    var size = 256;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var g = c.getContext("2d");

    g.font = "bold " + Math.round(size * 0.62) + "px 'Bangers', 'Anton', Impact, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";

    /* Erst breit und weich, dann schmal und hart: ergibt einen Schein um den
       Buchstaben, ohne dass ein Weichzeichner gebraucht wird. */
    g.shadowColor = color;
    g.shadowBlur = size * 0.22;
    g.fillStyle = color;
    g.fillText(letter, size / 2, size * 0.54);
    g.fillText(letter, size / 2, size * 0.54);

    g.shadowBlur = size * 0.06;
    g.fillStyle = "#ffffff";
    g.fillText(letter, size / 2, size * 0.54);

    return new THREE.CanvasTexture(c);
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

    var rng = seeded(20260809);

    var scene = new THREE.Scene();
    /* Nebel nur so dicht, dass Tiefe entsteht – bei höheren Werten frisst er
       bei der Kameraentfernung von ~44 Einheiten die Leuchtfarben auf. */
    scene.fog = new THREE.FogExp2(0x061110, 0.0105);

    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 320);

    /* Licht: ein warmes Grün von unten, ein kühles Violett von oben, dazu
       ein schwaches Gegenlicht, damit die Rückseite nicht schwarz absäuft. */
    scene.add(new THREE.AmbientLight(0x2c5a4a, 1.15));

    var lightLow = new THREE.PointLight(0x6effb4, 70, 95);
    lightLow.position.set(0, 2.5, 7);
    scene.add(lightLow);

    var lightHigh = new THREE.PointLight(0xc084fc, 55, 120);
    lightHigh.position.set(-7, 30, 9);
    scene.add(lightHigh);

    var rim = new THREE.DirectionalLight(0x88a8ff, 0.5);
    rim.position.set(-14, 14, -18);
    scene.add(rim);

    var tree = new THREE.Group();
    scene.add(tree);

    /* ================================================================ Stamm

       Ein einziges Drehteil statt gestapelter Zylinder: das Profil links
       beschreibt die halbe Silhouette (Radius über Höhe), LatheGeometry
       dreht sie einmal herum. Dadurch gibt es keine Absätze zwischen den
       Segmenten und der Wurzelfuß geht ohne Naht in den Stamm über. */

    var TRUNK_TOP = 15;

    /* Unten breit, oben schlank. Der Fuß ist bewusst deutlich ausgestellt –
       dort münden die drei Wurzeln, und ohne diese Verbreiterung sähen sie
       aus, als klebten sie von außen an einer Röhre. */
    var profile = [
      [3.9, 0.0], [3.0, 0.8], [2.35, 1.9], [1.95, 3.4], [1.72, 5.2],
      [1.55, 7.2], [1.38, 9.4], [1.2, 11.4], [1.0, 13.2], [0.78, TRUNK_TOP]
    ].map(function (p) { return new THREE.Vector2(p[0], p[1]); });

    var trunkMat = new THREE.MeshStandardMaterial({
      color: 0x1a6146,
      emissive: 0x3fe89b,
      emissiveIntensity: 0.85,
      roughness: 0.62,
      metalness: 0.04,
      flatShading: tier === "lite"
    });

    var trunk = new THREE.Mesh(
      new THREE.LatheGeometry(profile, tier === "full" ? 40 : 16),
      trunkMat
    );
    tree.add(trunk);

    /* Ein zweiter, etwas größerer Mantel von innen gerendert: er legt einen
       weichen Lichtsaum um die Silhouette, ohne dass es Bloom braucht. */
    var trunkHalo = new THREE.Mesh(
      new THREE.LatheGeometry(profile.map(function (v) {
        return new THREE.Vector2(v.x * 1.09 + 0.12, v.y);
      }), tier === "full" ? 30 : 12),
      new THREE.MeshBasicMaterial({
        color: 0x5cf0a8,
        transparent: true,
        opacity: 0.11,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    tree.add(trunkHalo);

    /* ================================================================= Äste

       Rekursiv gewachsen statt einzeln hingesetzt: jeder Ast bringt zwei bis
       drei kürzere, dünnere Kinder hervor. Das ergibt eine Verzweigung, die
       nach Baum aussieht, und liefert nebenbei die Punkte für das Blattwerk.

       Gezeichnet wird alles zusammen als ein InstancedMesh – ein Zeichenweg
       für ein paar hundert Äste statt ein paar hundert Zeichenwege. */

    var MAX_DEPTH = tier === "full" ? 5 : 3;
    var segments = [];
    var leafSpots = [];

    function grow(start, dir, len, rad, depth) {
      var end = start.clone().addScaledVector(dir, len);
      segments.push({ start: start.clone(), end: end, rad: rad, depth: depth });

      /* Blattwerk sitzt nicht nur an den Spitzen, sondern entlang der
         äußeren Äste – sonst hängen die Lichtpunkte wie Wattebäusche an
         kahlen Zweigen, statt den Ast einzuhüllen. */
      if (depth >= 3) {
        for (var t = 0.4; t <= 1.0001; t += 0.3) {
          leafSpots.push(start.clone().addScaledVector(dir, len * t));
        }
      }

      if (depth >= MAX_DEPTH || rad < 0.05) {
        leafSpots.push(end);
        return;
      }

      var kids = depth < 2 ? 3 : 2;
      for (var k = 0; k < kids; k++) {
        var next = dir.clone();

        /* Um eine zufällige Achse kippen, danach wieder etwas aufrichten:
           Äste sollen sich öffnen, aber nicht nach unten hängen. */
        var axis = new THREE.Vector3(rng() - 0.5, (rng() - 0.5) * 0.3, rng() - 0.5).normalize();
        next.applyAxisAngle(axis, 0.42 + rng() * 0.5);
        next.y += 0.22;
        next.normalize();

        grow(end, next, len * (0.68 + rng() * 0.16), rad * (0.6 + rng() * 0.14), depth + 1);
      }
    }

    /* Eine Krone aus der Spitze plus fünf tiefer ansetzende Starkäste. Die
       Starkäste sind das, was den Baum breit macht: ohne sie bliebe oben ein
       schmaler Büschel auf einer langen Stange. */
    grow(new THREE.Vector3(0, TRUNK_TOP - 0.5, 0), new THREE.Vector3(0, 1, 0), 5.4, 0.66, 0);

    [
      { y: 13.4, a: 0.4, out: 0.95 },
      { y: 12.2, a: 1.7, out: 1.05 },
      { y: 11.0, a: 3.1, out: 1.1 },
      { y: 10.0, a: 4.4, out: 1.15 },
      { y: 9.0, a: 5.5, out: 1.2 }
    ].forEach(function (b) {
      /* out steuert, wie flach der Ast wegsteht – je tiefer er ansetzt,
         desto waagerechter wächst er. */
      var dir = new THREE.Vector3(Math.cos(b.a) * b.out, 0.95, Math.sin(b.a) * b.out).normalize();
      var r = 1.3;
      grow(
        new THREE.Vector3(Math.cos(b.a) * r, b.y, Math.sin(b.a) * r),
        dir, 4.6, 0.46, 1
      );
    });

    /* Einheitszylinder: unten 1, oben 0.55, Länge 1, Fuß im Ursprung. So
       genügt pro Ast eine Verschiebung, eine Drehung und eine Skalierung. */
    var unitBranch = new THREE.CylinderGeometry(0.55, 1, 1, tier === "full" ? 7 : 4, 1, true);
    unitBranch.translate(0, 0.5, 0);

    /* Zwei Astwerke statt einem. Die dicken Äste unten tragen noch das Grün
       des Stamms, die feinen oben das Violett der Krone – so gibt es keine
       harte Farbkante dort, wo der Stamm aufhört. */
    var branchSets = [
      {
        keep: function (seg) { return seg.depth <= 1; },
        mat: new THREE.MeshStandardMaterial({
          color: 0x2c5a4e,
          emissive: 0x63d3a6,
          emissiveIntensity: 0.6,
          roughness: 0.64,
          flatShading: tier === "lite"
        })
      },
      {
        keep: function (seg) { return seg.depth > 1; },
        mat: new THREE.MeshStandardMaterial({
          color: 0x3d3160,
          emissive: 0xa982f0,
          emissiveIntensity: 0.72,
          roughness: 0.66,
          flatShading: tier === "lite"
        })
      }
    ];

    var dummy = new THREE.Object3D();
    var UP = new THREE.Vector3(0, 1, 0);

    branchSets.forEach(function (set) {
      var list = segments.filter(set.keep);
      if (!list.length) { return; }

      var mesh = new THREE.InstancedMesh(unitBranch, set.mat, list.length);
      list.forEach(function (seg, i) {
        var delta = seg.end.clone().sub(seg.start);
        var len = delta.length();

        dummy.position.copy(seg.start);
        dummy.quaternion.setFromUnitVectors(UP, delta.normalize());
        dummy.scale.set(seg.rad, len, seg.rad);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      tree.add(mesh);
    });

    /* ============================================================ Blattwerk

       Keine Blattformen, sondern Lichtpunkte: an einem leuchtenden Baum
       liest sich das als Laub und kostet fast nichts. Die Farbe wandert von
       Grün innen zu Violett außen. */

    /* Zwei Drittel der Blätter sitzen an den feinen Zweigen, ein Drittel
       füllt den Raum dazwischen. Nur am Ast wirkt die Krone wie Raureif auf
       kahlen Zweigen, nur im Raum wie eine Wolke ohne Baum darin – erst
       beides zusammen liest sich als Laub. */
    var leafCount = tier === "full" ? 4200 : 1000;

    var leafPos = new Float32Array(leafCount * 3);
    var leafCol = new Float32Array(leafCount * 3);

    /* Ausdehnung der Krone aus den tatsächlichen Zweigenden ableiten,
       statt sie zu raten – sonst passt die Wolke nicht zum Baum. */
    var cMinY = Infinity, cMaxY = -Infinity, cRad = 0;
    leafSpots.forEach(function (v) {
      if (v.y < cMinY) { cMinY = v.y; }
      if (v.y > cMaxY) { cMaxY = v.y; }
      var d = Math.sqrt(v.x * v.x + v.z * v.z);
      if (d > cRad) { cRad = d; }
    });
    var cMidY = (cMinY + cMaxY) / 2;
    var cHalf = Math.max((cMaxY - cMinY) / 2, 1);

    var inner = new THREE.Color(0x3cff9e);
    var outer = new THREE.Color(0xb271ff);
    var mixed = new THREE.Color();

    for (var l = 0; l < leafCount; l++) {
      var x, y, z;

      if (l % 3 !== 0) {
        /* Am Zweig. */
        var spot = leafSpots[Math.floor(rng() * leafSpots.length)];
        var spread = 0.7 + rng() * 1.3;
        x = spot.x + (rng() - 0.5) * spread;
        y = spot.y + (rng() - 0.5) * spread * 0.9;
        z = spot.z + (rng() - 0.5) * spread;
      } else {
        /* Im Kronenraum. Die dritte Wurzel aus dem Zufallswert schiebt die
           Punkte nach außen, sonst sammelt sich alles in der Mitte. */
        var u = rng() * 2 - 1;
        var phi = rng() * Math.PI * 2;
        var rr = Math.pow(rng(), 1 / 3);
        var ring = Math.sqrt(1 - u * u) * rr;

        x = Math.cos(phi) * ring * cRad;
        z = Math.sin(phi) * ring * cRad;
        y = cMidY + u * rr * cHalf;
      }

      leafPos[l * 3] = x;
      leafPos[l * 3 + 1] = y;
      leafPos[l * 3 + 2] = z;

      /* Je weiter außen, desto violetter. */
      var out = Math.min(Math.sqrt(x * x + z * z) / Math.max(cRad, 1), 1);
      mixed.copy(inner).lerp(outer, out * 0.9 + rng() * 0.1);

      leafCol[l * 3] = mixed.r;
      leafCol[l * 3 + 1] = mixed.g;
      leafCol[l * 3 + 2] = mixed.b;
    }

    var leafGeo = new THREE.BufferGeometry();
    leafGeo.setAttribute("position", new THREE.BufferAttribute(leafPos, 3));
    leafGeo.setAttribute("color", new THREE.BufferAttribute(leafCol, 3));

    var softDot = radialTexture(THREE, [
      [0, "rgba(255,255,255,1)"],
      [0.3, "rgba(255,255,255,0.55)"],
      [1, "rgba(255,255,255,0)"]
    ], 64);

    /* Für das Laub eine eigene, weichere Scheibe. Mit dem harten weißen Kern
       der Sporen-Textur addieren sich hunderte Punkte in der Krone zu Weiß
       auf, und von Grün und Violett bleibt nichts übrig. */
    var leafDot = radialTexture(THREE, [
      [0, "rgba(255,255,255,0.45)"],
      [0.4, "rgba(255,255,255,0.2)"],
      [1, "rgba(255,255,255,0)"]
    ], 64);

    var leaves = new THREE.Points(leafGeo, new THREE.PointsMaterial({
      size: 1.7,
      map: leafDot,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    tree.add(leaves);

    /* Ein paar wenige helle Blüten als Akzent in der Krone. */
    var bloomCount = tier === "full" ? 26 : 10;
    var bloomPos = new Float32Array(bloomCount * 3);
    for (var bl = 0; bl < bloomCount; bl++) {
      var bs = leafSpots[Math.floor(rng() * leafSpots.length)];
      bloomPos[bl * 3] = bs.x + (rng() - 0.5) * 1.2;
      bloomPos[bl * 3 + 1] = bs.y + (rng() - 0.5) * 1.2;
      bloomPos[bl * 3 + 2] = bs.z + (rng() - 0.5) * 1.2;
    }
    var bloomGeo = new THREE.BufferGeometry();
    bloomGeo.setAttribute("position", new THREE.BufferAttribute(bloomPos, 3));

    var blooms = new THREE.Points(bloomGeo, new THREE.PointsMaterial({
      size: 2.4,
      map: softDot,
      color: 0xfbe7ff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    tree.add(blooms);

    /* =============================================================== Wurzeln

       Drei Wurzeln, eine je Reich. Sie liegen in fest gewählten Winkeln, und
       der ganze Baum wird beim Scrollen so gedreht, dass die Wurzel des
       gerade sichtbaren Reichs zum Betrachter zeigt. */

    var ROOT_ANGLES = [-0.7, 0, 0.7];

    var rootTints = realms.map(function (realm) {
      var value = realm.style.getPropertyValue("--realm-tint").trim();
      return new THREE.Color(value || "#4ade80");
    });

    var roots = [];

    realms.forEach(function (realm, i) {
      var a = ROOT_ANGLES[i];
      var sway = (i - 1) * 0.28;

      /* Die Kurve startet innerhalb des Wurzelfußes, taucht ab und läuft
         dann flach nach außen aus. */
      var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.sin(a) * 1.4, 2.2, Math.cos(a) * 1.4),
        new THREE.Vector3(Math.sin(a) * 3.8, 0.4, Math.cos(a) * 3.8),
        new THREE.Vector3(Math.sin(a + sway * 0.5) * 8, -0.8, Math.cos(a + sway * 0.5) * 8),
        new THREE.Vector3(Math.sin(a + sway) * 13, -0.9, Math.cos(a + sway) * 13),
        /* Das Ende hebt sich wieder an: darüber steht der Buchstabe, und der
           soll nicht im Boden hängen. */
        new THREE.Vector3(Math.sin(a + sway * 1.35) * 17.5, 0.6, Math.cos(a + sway * 1.35) * 17.5)
      ]);

      var mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, tier === "full" ? 60 : 22, 0.62, tier === "full" ? 10 : 5, false),
        new THREE.MeshStandardMaterial({
          color: 0x123a2a,
          emissive: rootTints[i],
          emissiveIntensity: 0.2,
          roughness: 0.6,
          flatShading: tier === "lite"
        })
      );
      tree.add(mesh);

      /* Lichtsaum um die Wurzel, damit sie im Dunkeln nicht verschwindet. */
      var glow = new THREE.Mesh(
        new THREE.TubeGeometry(curve, tier === "full" ? 40 : 16, 1.15, 6, false),
        new THREE.MeshBasicMaterial({
          color: rootTints[i],
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      tree.add(glow);

      /* Zwei Funken, die von außen zum Stamm wandern – die Wurzel „liefert“
         sichtbar etwas an den Baum. */
      var pulses = [];
      for (var k = 0; k < 2; k++) {
        var pulse = new THREE.Sprite(new THREE.SpriteMaterial({
          map: softDot,
          color: rootTints[i],
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
        pulse.scale.setScalar(2.2);
        tree.add(pulse);
        pulses.push(pulse);
      }

      /* Der Buchstabe am Ende der Wurzel: M, B, M. */
      var glyphNode = realm.querySelector(".yg3-sigil__glyph");
      var nameNode = realm.querySelector(".yg3-realm__name");
      var letter = (glyphNode && glyphNode.textContent.trim()) ||
        (nameNode ? nameNode.textContent.trim().charAt(0) : "?");

      var sigil = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glyphTexture(THREE, letter, "#" + rootTints[i].getHexString()),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));

      /* Etwas vor dem äußersten Ende und nur wenig darüber: so klebt der
         Buchstabe sichtbar an dieser Wurzel und nicht daneben. */
      var tip = curve.getPointAt(0.94);
      sigil.position.set(tip.x, tip.y + 3.4, tip.z);
      sigil.scale.setScalar(4);
      tree.add(sigil);

      roots.push({ curve: curve, mesh: mesh, glow: glow, pulses: pulses, sigil: sigil, tint: rootTints[i] });
    });

    /* ============================================================ Umgebung */

    /* Bodenschein: eine liegende Scheibe mit weichem Verlauf. Sie gibt dem
       Baum einen Stand, ohne dass es einen Boden bräuchte. */
    var ground = new THREE.Mesh(
      new THREE.CircleGeometry(34, tier === "full" ? 48 : 20),
      new THREE.MeshBasicMaterial({
        map: radialTexture(THREE, [
          [0, "rgba(150,255,205,0.55)"],
          [0.28, "rgba(110,220,180,0.2)"],
          [1, "rgba(90,200,160,0)"]
        ], 256),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.3;
    scene.add(ground);

    /* Sporen im ganzen Raum, die langsam aufsteigen. */
    var moteCount = tier === "full" ? 1100 : 300;
    var motePos = new Float32Array(moteCount * 3);
    var moteSpeed = new Float32Array(moteCount);

    for (var m = 0; m < moteCount; m++) {
      motePos[m * 3] = (rng() - 0.5) * 76;
      motePos[m * 3 + 1] = rng() * 50 - 5;
      motePos[m * 3 + 2] = (rng() - 0.5) * 66;
      moteSpeed[m] = 0.5 + rng() * 1.9;
    }

    var moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));

    var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      size: 0.5,
      map: softDot,
      color: 0xd8ffe8,
      transparent: true,
      opacity: 0.75,
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

    /* Die Kamera wird nicht hart gesetzt, sondern nachgezogen. Dadurch
       ruckelt nichts, wenn das Scrollrad grobe Sprünge macht. */
    var camNow = new THREE.Vector3(0, 24, 46);
    var lookNow = new THREE.Vector3(0, 14, 0);
    var camWant = new THREE.Vector3();
    var lookWant = new THREE.Vector3();
    var spin = 0;

    function applyTier() {
      renderer.setPixelRatio(tier === "full"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1);
    }

    function downgrade() {
      if (tier === "full") {
        tier = "lite";
        applyTier();
        leaves.material.opacity = 0.38;
        motes.material.opacity = 0.5;
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
        pos[i * 3 + 1] += moteSpeed[i] * dt;
        if (pos[i * 3 + 1] > 46) { pos[i * 3 + 1] = -5; }
      }
      moteGeo.attributes.position.needsUpdate = true;

      /* Das Blattwerk atmet leicht mit. */
      leaves.material.size = 1.7 + Math.sin(clock * 0.7) * 0.12;
      blooms.material.opacity = 0.7 + Math.sin(clock * 1.3) * 0.15;

      /* --------------------------------------------------------- Drehung

         near[] sagt, wie weit jedes Reich in der Mitte steht. Daraus wird
         eine stufenlose Position 0..2 – und daraus der Winkel, der die
         zugehörige Wurzel nach vorn dreht. */
      var weight = 0;
      var placeSum = 0;
      for (var r = 0; r < near.length; r++) {
        weight += near[r];
        placeSum += near[r] * r;
      }
      var place = weight > 0.001 ? placeSum / weight : progress * (near.length - 1);

      var angleForPlace = ROOT_ANGLES[0] +
        (ROOT_ANGLES[ROOT_ANGLES.length - 1] - ROOT_ANGLES[0]) * (place / Math.max(near.length - 1, 1));

      /* Die aktive Wurzel wird nicht auf den Betrachter zu gedreht, sondern
         quer nach links. Zeigt sie auf die Kamera, läuft sie perspektivisch
         auf den unteren Bildrand zu, ihr Ende liegt außerhalb des Bildes –
         und der Buchstabe darüber schwebt dann irgendwo im Nichts, scheinbar
         an einer fremden Wurzel. Quer gelegt liegt die ganze Wurzel im Bild
         und der Buchstabe sitzt sichtbar an ihrem Ende. */
      var wantSpin = -1.15 - angleForPlace + Math.sin(clock * 0.12) * 0.03;
      spin += (wantSpin - spin) * Math.min(dt * 2.6, 1);
      tree.rotation.y = spin;

      /* ---------------------------------------------------------- Kamera

         Im Querformat steht die Karte rechts, der Baum bekommt die linke
         Bildhälfte. Im Hochformat liegt die Karte darunter: dann wird mittig
         geblickt und weiter weggerückt, sonst füllt der Stamm allein das
         ganze Bild. */
      var portrait = camera.aspect < 1.1;
      var pull = portrait ? 1.5 : 1;
      var shift = portrait ? 0 : 9;

      /* Der Baum ist gut 30 Einheiten hoch und die Wurzeln reichen 21 nach
         außen. Bei 46° Blickwinkel braucht das rund 55 Einheiten Abstand,
         damit die Krone oben nicht abgeschnitten wird. Beim Scrollen fährt
         die Kamera herunter zu den Wurzeln, bleibt aber weit genug weg,
         dass der Stamm im Bild bleibt. */
      var radius = (54 - progress * 8) * pull;
      var swing = progress * 0.5 - 0.18;

      camWant.set(
        Math.sin(swing) * radius,
        (24 - progress * 12) * (portrait ? 1.1 : 1),
        Math.cos(swing) * radius
      );
      lookWant.set(shift, 15 - progress * 7, 0);

      var ease = Math.min(dt * 2.2, 1);
      camNow.lerp(camWant, ease);
      lookNow.lerp(lookWant, ease);

      camera.position.copy(camNow);
      camera.lookAt(lookNow);

      /* ---------------------------------------------------------- Wurzeln */
      roots.forEach(function (root, i) {
        var n = near[i] || 0;

        /* Auch die stillen Wurzeln glimmen. Ganz dunkel sähen sie aus wie
           abgestorbenes Holz, das um den Stamm herumliegt. */
        root.mesh.material.emissiveIntensity = 0.34 + n * 1.45;
        root.glow.material.opacity = n * 0.16;

        /* Alle drei Buchstaben sind zu sehen – so ist von Anfang an klar,
           dass der Baum drei Wurzeln hat. Der zum aktuellen Reich brennt
           durch, die anderen bleiben eine Andeutung. */
        root.sigil.material.opacity = 0.16 + n * n * 0.84;
        root.sigil.scale.setScalar(3.2 + n * 1.4);

        root.pulses.forEach(function (pulse, k) {
          /* t läuft von außen (1) nach innen (0) zum Stamm. */
          var t = 1 - ((clock * 0.24 + k * 0.5 + i * 0.17) % 1);
          var point = root.curve.getPointAt(Math.min(Math.max(t, 0), 1));
          pulse.position.copy(point);

          /* Am Stamm angekommen verglüht der Funke. */
          pulse.material.opacity = n * 0.9 * Math.sin(t * Math.PI);
          pulse.scale.setScalar(1.6 + n * 1.4);
        });
      });

      /* Der Stamm leuchtet stärker, je tiefer die Kamera an den Wurzeln
         steht – unten ist der Baum am hellsten. */
      trunkMat.emissiveIntensity = 0.72 + progress * 0.5;

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
