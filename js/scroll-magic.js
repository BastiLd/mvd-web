(function () {
  "use strict";

  var layer = document.getElementById("magic-layer");
  if (!layer) return;

  var core = layer.querySelector(".energy-core");
  var orbs = Array.prototype.slice.call(layer.querySelectorAll(".orb"));
  var smokes = Array.prototype.slice.call(layer.querySelectorAll(".smoke"));

  // Wie weit man scrollen muss (relativ zur Fensterhöhe), bis die "Magie"
  // vollständig aufgelöst ist und nur noch der Text übrig bleibt.
  var DISSOLVE_DISTANCE_FACTOR = 1.4;

  var ticking = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function update() {
    ticking = false;

    var distance = window.innerHeight * DISSOLVE_DISTANCE_FACTOR;
    var progress = clamp(window.scrollY / distance, 0, 1);

    layer.style.opacity = String(1 - progress);

    if (core) {
      var coreDrop = progress * 180;
      var coreScale = 1 - progress * 0.5;
      core.style.transform =
        "translate(-50%, calc(-50% + " + coreDrop + "px)) scale(" + coreScale + ")";
    }

    orbs.forEach(function (orb, index) {
      var drift = 60 + index * 25;
      var drop = progress * (140 + index * 30);
      var sway = Math.sin(progress * Math.PI + index) * drift * progress;
      orb.style.transform = "translate(" + sway + "px, " + drop + "px)";
    });

    smokes.forEach(function (smoke, index) {
      var drop = progress * (200 + index * 60);
      smoke.style.transform = "translateY(" + drop + "px)";
      smoke.style.opacity = String(1 - progress);
    });
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
