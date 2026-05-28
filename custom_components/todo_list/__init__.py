# Home Assistant Custom Integration: Todo List Panel
# Dieses Modul registriert das Custom Panel im HA-Frontend.
# Die Todo-Daten kommen direkt von der offiziellen HA todo-Domain.

import json
import shutil
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

DOMAIN = "todo_list"
REGISTERED_KEY = f"{DOMAIN}_panel_registered"


def _read_manifest_version(manifest_path: Path) -> str:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return manifest.get("version", "0.0.0")


def _ensure_panel_file_sync(hass: HomeAssistant) -> None:
    """Kopiere Panel-JS zu www/ wenn nicht vorhanden (wird von async_add_executor_job aufgerufen)."""
    src = Path(__file__).parent / "todo-list-panel.js"
    dest = hass.config.path("www", "todo_list", "todo-list-panel.js")
    dest_path = Path(dest)
    
    # Verzeichnis erstellen wenn nötig
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Datei kopieren wenn Quelle vorhanden und Ziel nicht
    if src.exists() and not dest_path.exists():
        shutil.copy2(str(src), str(dest))


async def _register_panel(hass: HomeAssistant) -> None:
    if hass.data.get(REGISTERED_KEY):
        return

    # Version aus manifest.json lesen fuer Cache-Busting
    manifest_path = Path(__file__).parent / "manifest.json"
    version = await hass.async_add_executor_job(_read_manifest_version, manifest_path)

    # Panel registrieren: zeigt todo-list-panel.js als Sidebar-Eintrag
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="To-Do",
        sidebar_icon="mdi:checkbox-marked-outline",
        frontend_url_path="todo-panel",
        config={
            "_panel_custom": {
                "name": "todo-list-panel",
                "module_url": f"/local/todo_list/todo-list-panel.js?v={version}",
                "embed_iframe": False,
                "trust_external_script": True,
            }
        },
        require_admin=False,
    )

    hass.data[REGISTERED_KEY] = True


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    # YAML-Fallback fuer bestehende Installationen
    if DOMAIN in config:
        await _register_panel(hass)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Panel-Datei zu www/ kopieren wenn nicht vorhanden
    await hass.async_add_executor_job(_ensure_panel_file_sync, hass)
    await _register_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Das Panel bleibt bis zum Neustart registriert.
    return True

