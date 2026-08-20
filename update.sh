#!/bin/bash
# Update-Skript für den Proxmox-Container.
# Nutzung: bash update.sh [branch]   (Standard: main)
#
# Annahme wie bei Lifereport: Repo liegt bereits geklont im aktuellen Verzeichnis,
# .env ist vorhanden, Node.js ist installiert.
# Passe den Neustart-Block unten an eure tatsächliche Prozessverwaltung an
# (pm2 oder systemd), falls sie vom Lifereport-Skript abweicht.

set -e

BRANCH="${1:-main}"
APP_NAME="herzklopf-casting"

echo "==> Hole neuesten Stand von origin/$BRANCH"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Installiere Abhängigkeiten"
npm ci

echo "==> Baue Produktions-Build"
npm run build

echo "==> Starte Dienst neu"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" || pm2 start npm --name "$APP_NAME" -- start
  pm2 save
elif systemctl list-unit-files | grep -q "^${APP_NAME}.service"; then
  sudo systemctl restart "$APP_NAME"
else
  echo "Kein pm2 und kein systemd-Service '${APP_NAME}' gefunden."
  echo "Einmalig einrichten, z. B. mit pm2:"
  echo "  pm2 start npm --name $APP_NAME -- start"
  echo "  pm2 save && pm2 startup"
fi

echo "==> Fertig."
