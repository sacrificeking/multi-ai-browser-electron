# Multi-AI-Browser

Kurzbeschreibung
----------------
Multi-AI-Browser ist eine Electron-App, die mehrere Webview-Panels nebeneinander anzeigt (z. B. ChatGPT, Claude, Gemini). Oben gibt es eine Meta-Prompt-Leiste: ein eingegebener Prompt kann per „Send to all“ an alle offenen Webviews geschickt werden. Login erfolgt normal im jeweiligen Panel (kein API-Key nötig).

Features
--------
- Mehrere Webview-Panels nebeneinander
- Ein zentraler Prompt, der an alle Panels gesendet wird
- Keine API-Keys nötig — Login im Browserfenster
- Konfigurierbare URLs pro Panel

Voraussetzungen
---------------
- Node.js (LTS empfohlen, z. B. 20.x)
- npm (wird mit Node geliefert)
- Betriebssystem: Windows / macOS / Linux

Prüfen:
```powershell
node -v
npm -v
```

Installation
------------
Im Projektordner einmal ausführen:
```powershell
cd "[Pfad]\Multi-AI-Browser"
npm install
```

package.json (Start-Script)
---------------------------
Stelle sicher, dass dein package.json ein start-script hat:
```json
{
  "scripts": {
    "start": "electron ."
  }
}
```

App starten
-----------
```powershell
npm start
```
Die App öffnet sich und lädt die konfigurierten URLs in den Panels.

Projektstruktur
---------------
multi-ai-browser/
  - package.json
  - main.js        (Electron Main Process)
  - preload.js     (Bridge zwischen Main und Renderer)
  - index.html     (UI)
  - renderer.js    (Renderer-Logik)
  - config.js      (Einstellbare URLs / Panel-Konfiguration)
  - node_modules/

Konfiguration
-------------
- Trage deine gewünschten URLs in `config.js` ein (z. B. welche AI-Seiten in welchen Panels geladen werden sollen).
- Die Meta-Prompt-Leiste sendet den Text an alle Webviews und löst dort Enter aus.

Git / .gitignore
----------------
- Lege `.gitignore` im Repo-Root an (bereits vorhanden). Beispiel-Einträge:
```
node_modules/
dist/
.env
.vscode/
```
- Falls node_modules versehentlich getrackt wurde:
```powershell
git rm -r --cached node_modules
git add .gitignore
git commit -m "Exclude node_modules"
```

Tipps & Troubleshooting
-----------------------
- Keine Antworten in Panels: prüfe ob die Seite Eingaben per JS erlaubt (manche Seiten blockieren Programmatic input).
- Probleme beim Start: Console-Ausgabe in VS Code Terminal prüfen, ggf. fehlende Abhängigkeiten per `npm install` nachziehen.
- Dev-Tools öffnen: Rechtsklick → "Inspect" oder in main.js devtools aktivieren.
