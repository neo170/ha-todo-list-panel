# Todo List Panel für Home Assistant

Ein Custom Panel für Home Assistant, das die **offizielle `todo`-Domain** von HA nutzt.  
Todos werden direkt in HA gespeichert und sind mit allen HA-Integrationen (Google Tasks, Local Todo, etc.) kompatibel.

## Voraussetzungen

- Home Assistant ≥ 2023.11
- Mindestens eine Todo-Liste in HA (z.B. über **Einstellungen → Integrationen → To-do-Liste**)

## Installation

### 1. Dateien kopieren

```
custom_components/todo_list/   →  /config/custom_components/todo_list/
www/todo_list_panel/           →  /config/www/todo_list_panel/
```

> Via Samba, SSH, SFTP oder dem File Editor Add-on.

### 2. `configuration.yaml` ergänzen

```yaml
todo_list:
```

> **Alternativ** (ohne Python-Komponente): Das Panel direkt als `panel_custom` eintragen:

```yaml
panel_custom:
  - name: todo-list-panel
    sidebar_title: To-Do Liste
    sidebar_icon: mdi:checkbox-marked-outline
    url_path: todo-panel
    module_url: /local/todo_list_panel/todo-list-panel.js
```

### 3. Home Assistant neu starten

**Einstellungen → System → Neu starten**

## Features

- ✅ Zeigt alle HA-Todo-Listen in einem Dropdown an
- ✅ Todos hinzufügen (Eingabefeld + Enter)
- ✅ Todos abhaken (Checkbox, erledigt = durchgestrichen)
- ✅ Todos löschen (Button oder Swipe nach links auf Touch-Geräten)
- ✅ Fälligkeitsdatum wird angezeigt (falls vorhanden)
- ✅ Echtzeit-Updates: Panel reagiert auf HA State-Änderungen
- ✅ Offener Badge zeigt Anzahl unerledigter Todos

## Kompatible Todo-Integrationen

Das Panel funktioniert mit allen HA-Todo-Entitäten:
- 📋 **Local To-do** (HA-intern)
- 🔵 **Google Tasks**
- ✅ **Todoist**
- 📱 **OurGroceries**, **Bring!** und weitere
