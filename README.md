# MVD Web

Website für MVD – Marvel Vereinigt Deutschland. Reines HTML/CSS/JS, kein Build-Schritt,
läuft direkt über GitHub Pages.

## Struktur

```
index.html
css/style.css      gesamtes Design
js/main.js         Hamburger-Menü + sanftes Einblenden der Textblöcke
assets/images/
  header-beach.jpg   Strand mit den fünf Schatten  (ausgeliefert, 427 KB)
  footer-sand.jpg    Sand mit den Begriffen        (ausgeliefert, 418 KB)
  header-beach.png   Original von ChatGPT (7,4 MB, nicht im Repo)
  footer-sand.png    Original von ChatGPT (3,5 MB, nicht im Repo)
```

## Aufbau der Seite

Von oben nach unten: **Strand-Header → dunkle Nachtzone → Sand-Footer.**

Die Übergänge sind nicht geraten, sondern an den echten Bildrändern ausgemessen:

| Stelle | gemessene Farbe |
|---|---|
| Unterkante Header-Bild | `#67573E` |
| Oberkante Footer-Bild | `#C3803C` |

- Der Header läuft über `.hero::after` von dieser Randfarbe ins Seitendunkel aus –
  die Schatten lösen sich dabei in der Nacht auf.
- Vor dem Footer liegt ein eigenes Übergangsband (`.footer-transition`), das von
  Dunkel auf den Sandton führt. Es liegt **über** dem Bild statt darauf, damit die
  in den Sand geschriebenen Wörter nicht überdeckt werden.
- Der Footer hat `aspect-ratio: 2 / 1` (Bildformat 1600×800), damit die Sandwörter
  nicht angeschnitten oder verzerrt werden.

## Bilder

Die beiden PNG-Originale waren zusammen **11,5 MB** – das hätte die Seite auf dem
Handy sehr langsam gemacht. Ausgeliefert werden deshalb optimierte JPGs
(zusammen **845 KB**, optisch kein Unterschied). Die PNGs bleiben lokal im Ordner
liegen, sind aber über `.gitignore` vom Repo ausgenommen.

**Bild ausgetauscht? Dann neu optimieren** – sonst wirkt die Änderung nicht, weil
die Seite die `.jpg` lädt. Sag mir einfach Bescheid, ich mache das.

### Optionales Hintergrundbild für die Mittelzone

`css/style.css` bindet bereits `assets/images/middle-night.jpg` als Hintergrund für
den Textbereich ein. Die Datei existiert noch nicht – solange bleibt einfach die
dunkle Hintergrundfarbe stehen (im Browser-Log erscheint dafür ein 404, das ist
gewollt und harmlos). Sobald du das Bild unter genau diesem Namen ablegst, ist es
ohne Code-Änderung da.

Prompt dafür:

> Sehr dunkle, ruhige Nachtaufnahme an einem menschenleeren Strand. Tiefschwarzer
> Himmel mit feinen Sternen, am unteren Bildrand ein schwacher, warm-oranger
> Lichtschein wie kurz nach Sonnenuntergang. Spiegelglatter nasser Sand, sehr
> wenig Detail, große gleichmäßig dunkle Flächen. Keine Personen, keine Objekte,
> keine Schrift. Filmisch, leicht körnig, dunkel belichtet. Hochformat 2:3.

Wichtig: ruhig und dunkel – über dem Bild liegt Text, ein unruhiges Motiv würde
das Lesen stören.

### Prompt für das Footer-Bild (hat funktioniert)

> Nahaufnahme von feinem Sand mit sanftem seitlichem Streiflicht, in den Sand wie
> mit dem Finger eingeritzt stehen verteilt die Wörter "Impressum", "Kontakt",
> "Anmelden", "Beitreten" und "© MVD"; die Schrift wirkt organisch in den Sand
> geschrieben, nicht wie digitale Schrift; warme Abendlicht-Stimmung; breites
> Panorama-Format.

## Hinweis zu den Marvel-Figuren

Die Silhouetten sind an geschützte Marvel-Figuren angelehnt. Als
nicht-kommerzielles Fan-Projekt ist das Risiko gering; im Footer steht deshalb ein
kurzer Disclaimer („Fan-Projekt, keine Verbindung zu Marvel oder Disney").

## Lokal ansehen

`index.html` im Browser öffnen – keine Installation nötig.

## Deployment

Repository `BastiLd/mvd-web`, Pages-Quelle `main` / `/ (root)`.
Nach jedem Push aktualisiert sich <https://bastild.github.io/mvd-web/> automatisch
(ca. 1 Minute).
