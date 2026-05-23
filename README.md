# ha-todo-list-panel

Custom Home Assistant Panel für Todo-Listen mit Echtzeit-Sync, Drag & Drop, Swipe-to-Delete und Multi-Listen-Support.

## Features

- **Echtzeit-Sync** via WebSocket (`todo/item/subscribe`)
- **Drag & Drop** Sortierung (Touch + Mouse) mit Server-Persistenz (`todo/item/move`)
- **Swipe-to-Delete** (Touch + Mouse)
- **Multi-Listen** mit per-List Icons in Sidebar und Dropdown
- **Offline-Resilience** – 5s Timeout auf alle Calls, optimistisches UI mit Rollback
- **Detail-Ansicht** – Readonly + Edit-Modus, Notizen, Fälligkeit, "Erstellt"-Feld (aus UUID v1 Timestamp)
- **Neue Items oben** – nach Anlage wird das Item via `todo/item/move` an Position 1 geschoben
- **Drei-Punkt-Menü** – Neue Liste erstellen, Detailansicht (HA more-info), Liste löschen

## Kompatible Todo-Integrationen

Funktioniert mit allen HA-Todo-Entitäten:
- 📋 **Local To-do** (HA-intern)
- 🔵 **Google Tasks**
- ✅ **Todoist**
- 📱 **OurGroceries**, **Bring!** und weitere

## Architektur

- **Single-File Custom Element** – `www/todo_list_panel/todo-list-panel.js` (~2050 Zeilen)
- Vanilla JS, Shadow DOM, kein Build-Step
- Registriert via `panel_custom` in HA `configuration.yaml`
- Keyed Reconciliation: DOM wird nur neu gerendert wenn sich die UID-Reihenfolge ändert

## Deploy

### Voraussetzungen

- Samba-Share auf HA-Server erreichbar (`\\hatest\config`, `\\homeassistant\config`)
- Long-Lived Access Tokens in `deploy.ps1` hinterlegt

### Befehle

```powershell
.\deploy.ps1          # Deploy auf TEST (hatest)
.\deploy.ps1 -Live    # Deploy auf LIVE (homeassistant)
.\deploy.ps1 -All     # Deploy auf beide
```

### Was das Script macht

1. Kopiert `todo-list-panel.js` auf den Server
2. Setzt `?v=TIMESTAMP` in `module_url` der `configuration.yaml` (Cache-Busting)
3. Startet HA neu und wartet 30s
4. **Danach reicht F5 im Browser** – kein Clear Site Data nötig

### Warum Cache-Busting nötig ist

HA liefert `/local/`-Dateien mit `Cache-Control: public, max-age=2678400` (31 Tage!) aus.
Der `?v=` Parameter in `module_url` sorgt dafür, dass der Browser eine neue URL sieht und den Cache umgeht.

## Server-Konfiguration

In `configuration.yaml` auf dem HA-Server:

```yaml
panel_custom:
  - name: todo-list-panel
    sidebar_title: To-Do Liste
    sidebar_icon: mdi:checkbox-marked-outline
    url_path: todo-panel
    module_url: /local/todo_list_panel/todo-list-panel.js?v=20260523160633
```

## Dateistruktur

```
├── www/
│   └── todo_list_panel/
│       └── todo-list-panel.js    # Das Panel (Single-File Custom Element)
├── deploy.ps1                    # Deploy-Script (enthält Tokens – NICHT committen!)
├── deploy.cmd                    # Wrapper für deploy.ps1
├── .gitignore                    # Schließt deploy.ps1/cmd aus
└── README.md
```

## Hinweise für neue Sessions

- Code ändern → `.\deploy.ps1` → F5 im Browser
- Tokens und Server-Config stehen in `deploy.ps1`
- Die JS-Datei ist ein einzelnes Custom Element (`TodoListPanel`), registriert als `<todo-list-panel>`
- HA setzt `hass`, `narrow`, `panel`, `route` Properties auf das Element
