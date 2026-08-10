# MVD Web

Website für MVD – Marvel Vereinigt Deutschland. Reines HTML/CSS/JS, kein Build-Schritt, läuft direkt über GitHub Pages.

## Struktur

```
index.html
css/
  style.css        Basis-Layout, schwarzer Standard-Modus, Palast, Lava-Vorhang
  interactive.css  Überschreibungen für den interaktiven Modus (Sand/Blau/Rot)
js/
  veil.js           Vordergrund-Vorhang mit blubbernder Lava-Kante
  main.js           Hamburger-Menü, Moduswechsel (localStorage), Text-Einblendung
assets/images/
  header-beach.png         ← hier dein ChatGPT-Header-Bild ablegen
  footer-sand.png          ← hier dein ChatGPT-Footer-Bild ablegen
  header-placeholder.svg   Platzhalter, greift solange das echte Bild fehlt
  footer-placeholder.svg   dito
```

## Zwei Modi

**Standard** (Default)
- Hintergrund komplett schwarz, darin ein Palast aus abgerundeten Rechtecken
  (Türme, Kuppeln, Zinnenmauer, Bogenfenster) in dunklem Rot – reines CSS.
- Beim Laden ist der Bildschirm schwarz. Über 1,5 s fährt ein Vorhang nach unten;
  seine gewölbte Kante ist mit roten Kreisen, Rechtecken und Dreiecken besetzt,
  die wie Lava blubbern. Was die Kante passiert hat, wird sichtbar.
- Danach steht die Kante bei 3/4 der Sichthöhe und wandert beim Scrollen langsam
  weiter nach unten. Am Footer verdampft der Vorhang.

**Interaktiv**
- Sand-Header mit den Schatten der fünf Helden, Blau/Rot als Hauptfarben,
  Verlaufstext Rosa → Lila → Dunkelblau, Sand-Footer mit eingeritzten Begriffen.

Umschalten über das orange Hamburger-Menü oben rechts. Die Wahl wird im Browser
gespeichert (`localStorage`).

## Bilder einsetzen

Die beiden ChatGPT-Bilder einfach unter **genau diesen Namen** in `assets/images/`
ablegen – die Platzhalter werden dann automatisch überdeckt:

- `header-beach.png` – Strand mit den fünf Helden-Schatten
- `footer-sand.png` – Sand mit den eingeritzten Begriffen

Fehlt eine Datei, zeigt die Seite weiterhin den passenden SVG-Platzhalter. Es geht
also nichts kaputt, wenn erst ein Bild fertig ist.

### Prompt für das Footer-Bild (funktioniert bereits)

> Nahaufnahme von feinem Sand mit sanftem seitlichem Streiflicht, in den Sand wie
> mit dem Finger eingeritzt stehen verteilt die Wörter "Impressum", "Kontakt",
> "Anmelden", "Beitreten" und "© MVD"; die Schrift wirkt organisch in den Sand
> geschrieben, nicht wie digitale Schrift; warme Abendlicht-Stimmung; breites
> Panorama-Format.

### Prompt für das Header-Bild (ohne Figurennamen)

ChatGPT lehnt Prompts ab, in denen geschützte Figuren namentlich vorkommen. Dieser
Prompt beschreibt nur die Posen und läuft dadurch durch:

> Weitwinkel-Strandszene bei tief stehender Abendsonne, feiner heller Sand, Blick
> leicht von oben. Fünf lange, weiche Schlagschatten fallen nebeneinander auf den
> Sand – die Personen selbst sind NICHT im Bild, man sieht ausschließlich ihre
> Schatten. Die fünf Silhouetten sind deutlich unterschiedlich: eine Gestalt steht
> breitbeinig, die Arme leicht vom Körper abgespreizt; eine hockt geduckt und
> stützt eine Hand vor sich auf den Boden; eine steht aufrecht mit verschränkten
> Armen und einem knappen Umhang; eine steht mit weit ausgebreitetem, lang
> fallendem Umhang; eine steht lässig mit den Händen in den Hüften und zwei
> angedeuteten Griffen hinter den Schultern. Keine Gesichter, keine Logos, keine
> Kostümdetails – nur schwarze Schattenformen im Sand. Ruhige, filmische Stimmung,
> viel freier Sand oben in der Bildmitte für einen Titel-Schriftzug.
> Breitbild-Format 16:9.

Falls es damit immer noch klemmt, hilft meist der Zusatz *"generische Heldenposen,
keine bestehenden Comicfiguren"*.

## Hinweis zu den Marvel-Figuren

Die Silhouetten sind an geschützte Marvel-Figuren angelehnt. Als
nicht-kommerzielles Fan-Projekt ist das Risiko gering; im Footer steht deshalb ein
kurzer Disclaimer („Fan-Projekt, keine Verbindung zu Marvel oder Disney"). Bei
Bedarf anpassen.

## Lokal ansehen

`index.html` im Browser öffnen – keine Installation nötig.

## Deployment (GitHub Pages)

Repository: `BastiLd/mvd-web`, Pages-Quelle `main` / `/ (root)`.
Nach jedem Push auf `main` aktualisiert sich <https://bastild.github.io/mvd-web/>
automatisch (dauert nach dem Push ca. 1 Minute).
