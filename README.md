# Herzklopf-Casting

Private, passwortgeschützte Flirt-Einladungsseite. Next.js 14 + SQLite (better-sqlite3),
gebaut nach dem gleichen Muster wie Lifereport.

## Stack
- Next.js 14 (App Router)
- SQLite über `better-sqlite3` (Datei unter `data/db.sqlite`, per `.gitignore` ausgeschlossen)
- Sessions über JWT in einem httpOnly-Cookie
- Passwörter mit bcrypt gehasht (nicht im Klartext gespeichert)

## Einmalige Einrichtung auf dem Proxmox-Server

1. **LXC-Container** wie bei den anderen Node-Apps (Debian/Ubuntu, unprivilegiert),
   Node.js installieren (z. B. via nvm oder NodeSource, Version ≥ 18).
2. **Repo klonen** in ein Verzeichnis auf dem Container:
   ```bash
   git clone <dein-github-repo-url> herzklopf-casting
   cd herzklopf-casting
   ```
3. **.env anlegen**:
   ```bash
   cp .env.example .env
   # JWT_SECRET auf einen langen, zufälligen String setzen, z. B.:
   # openssl rand -hex 32
   ```
4. **Abhängigkeiten installieren & bauen**:
   ```bash
   npm ci
   npm run build
   ```
5. **Starten** (Beispiel mit pm2, passe an eure übliche Lösung an):
   ```bash
   pm2 start npm --name herzklopf-casting -- start
   pm2 save
   ```
6. Im Browser aufrufen → beim allerersten Aufruf wird das Admin-Passwort festgelegt.
   Danach im Admin-Bereich Namen/Passwörter für Gäste anlegen.
7. **Erreichbarkeit**: wie gewohnt über Cloudflare Tunnel nach außen geben, falls
   die Seite von unterwegs erreichbar sein soll.

## Updates über GitHub

Wie bei Lifereport: Änderungen lokal entwickeln, nach GitHub pushen, auf dem Server
```bash
bash update.sh main
```
Das Skript holt den neuesten Stand, installiert Abhängigkeiten, baut neu und startet
den Dienst neu (pm2 oder systemd — je nachdem, was auf dem Container vorhanden ist).

Falls ihr wie bei Lifereport mit zwei Servern (Testing-Branch + Hauptserver-Branch `main`)
arbeitet, lässt sich das 1:1 übernehmen: auf dem Testing-Container `bash update.sh testing`,
auf dem Hauptserver `bash update.sh main`.

## Datensicherung

`data/db.sqlite` enthält alle Gäste, Passwort-Hashes und eingereichten Dates.
Genau wie bei Lifereport bietet sich ein tägliches Proxmox-Snapshot bzw. eine
rotierende Sicherung dieser Datei an.
