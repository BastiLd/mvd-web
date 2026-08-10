# MVD Web

Website für MVD – Marvel Vereinigt Deutschland. Reines HTML/CSS/JS, kein Build-Schritt, läuft direkt über GitHub Pages.

## Struktur

```
index.html
css/
  style.css        Basis-Layout + Standard-Modus (schwarz/rot, Scroll-Magie)
  interactive.css  Überschreibungen für den interaktiven Modus (Sand/Blau/Rot)
js/
  main.js           Hamburger-Menü, Moduswechsel (localStorage), Reveal-on-Scroll
  scroll-magic.js   Steuert die Orb-/Energie-Animation im Standard-Modus
assets/images/
  header-placeholder.svg   Platzhalter für den Strand-Header mit Helden-Schatten
  footer-placeholder.svg   Platzhalter für den Sand-Footer mit Impressum/Kontakt/...
```

## Zwei Modi

- **Standard** (Default): schwarz-roter Hintergrund, "Chaosmagie"-Scrolleffekt (Orbs/Energie lösen
  sich beim Scrollen von oben nach unten auf), sonst nur Text.
- **Interaktiv**: Sand-Header mit Helden-Schatten, Blau/Rot als Hauptfarben, Verlaufstext
  Lila/Rosa → Dunkelblau, Sand-Footer mit eingebetteten Begriffen.
- Umschalten über das Hamburger-Menü oben rechts (3 Striche) → "Zu interaktivem Modus wechseln".
  Die Wahl wird im Browser gespeichert (`localStorage`).

## Platzhalterbilder ersetzen

Sobald du die beiden Bilder mit ChatGPT erzeugt hast, einfach unter genau diesen Dateinamen
in `assets/images/` ablegen (vorhandene Platzhalter überschreiben — PNG/JPG geht auch,
dann in `css/interactive.css` die Dateiendung in den beiden `url(...)`-Pfaden anpassen):

- `header-placeholder.svg` → Header-Bild (Sand + 5 Helden-Schatten)
- `footer-placeholder.svg` → Footer-Bild (Sand mit Impressum/Kontakt/Anmelden/Beitreten)

### Prompt für das Header-Bild

> Strandszene von oben/schräg fotografiert, warmes Sandlicht, im Sand liegen lange, weiche
> Schlagschatten von fünf stehenden Figuren nebeneinander, erkennbar an Silhouette und Pose
> (nicht an Details) — Iron-Man-Haltung, Spider-Man-Haltung, Black-Panther-Haltung,
> Moon-Knight-Haltung, Deadpool-Haltung; keine Gesichter, keine Logos, nur der Schattenwurf im
> Sand; ruhiger, minimalistischer, filmischer Look; oben in der Bildmitte bleibt Platz frei für
> einen Titel-Schriftzug; Breitbild-Format (16:9).

### Prompt für das Footer-Bild

> Nahaufnahme von feinem Sand mit sanftem seitlichem Streiflicht, in den Sand wie mit dem Finger
> eingeritzt stehen verteilt die Wörter "Impressum", "Kontakt", "Anmelden", "Beitreten" und
> "© MVD"; die Schrift wirkt organisch in den Sand geschrieben, nicht wie digitale Schrift; warme
> Abendlicht-Stimmung; breites Panorama-Format.

## Hinweis zu den Marvel-Figuren

Die Silhouetten von Iron Man, Spider-Man, Black Panther, Moon Knight und Deadpool sind
urheber-/markenrechtlich geschützte Marvel-Figuren. Als nicht-kommerzielles Fan-Projekt ist das
Risiko gering, im Footer steht daher ein kurzer Disclaimer ("Fan-Projekt, keine Verbindung zu
Marvel oder Disney"). Bei Bedarf anpassen oder entfernen.

## Lokal ansehen

Einfach `index.html` im Browser öffnen — keine Installation nötig.

## Deployment (GitHub Pages)

Das Repository wird unter dem GitHub-Account `BastiLd` gehostet, Pages-Quelle ist
`main`-Branch / `/ (root)`. Nach jedem Push auf `main` aktualisiert sich die Seite automatisch
unter der im Repo hinterlegten GitHub-Pages-URL (siehe "About" im Repo bzw. Pages-Einstellungen).
