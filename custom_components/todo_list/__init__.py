# Home Assistant Custom Integration: Todo List Panel
# Dieses Modul registriert nur das Custom Panel im HA-Frontend.
# Die Todo-Daten kommen direkt von der offiziellen HA todo-Domain.

import json
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

DOMAIN = "todo_list"
PANEL_URL = "/todo_list_panel/frontend"
REGISTERED_KEY = f"{DOMAIN}_panel_registered"


async def _register_panel(hass: HomeAssistant) -> None:
    if hass.data.get(REGISTERED_KEY):
        return

    # Version aus manifest.json lesen fuer Cache-Busting
    manifest_path = Path(__file__).parent / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    version = manifest.get("version", "0.0.0")

    # JS-Datei aus dem Integration-Verzeichnis ausliefern
    frontend_path = str(Path(__file__).parent / "frontend")
    # Maximal kompatibel: zuerst legacy API, dann async API als Fallback.
    if hasattr(hass.http, "register_static_path"):
        hass.http.register_static_path(PANEL_URL, frontend_path, cache_headers=False)
    elif hasattr(hass.http, "async_register_static_paths"):
        await hass.http.async_register_static_paths(
            [
                {
                    "url_path": PANEL_URL,
                    "path": frontend_path,
                    "cache_headers": False,
                }
            ]
        )
    else:
        raise RuntimeError("No supported static path registration API found")

    # Panel registrieren: zeigt todo-list-panel.js als Sidebar-Eintrag
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title="To-Do Liste",
        sidebar_icon="mdi:checkbox-marked-outline",
        frontend_url_path="todo-panel",
        config={
            "_panel_custom": {
                "name": "todo-list-panel",
                "module_url": f"{PANEL_URL}/todo-list-panel.js?v={version}",
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
    await _register_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Das Panel bleibt bis zum Neustart registriert.
    return True

