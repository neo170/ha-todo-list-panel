# Home Assistant Custom Integration: Todo List Panel
# Dieses Modul registriert das Custom Panel im HA-Frontend.
# Die Todo-Daten kommen direkt von der offiziellen HA todo-Domain.

import json
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

DOMAIN = "todo_list"
REGISTERED_KEY = f"{DOMAIN}_panel_registered"
STATIC_PATH_BASE = "/todo_list_panel"


def _read_manifest_version(manifest_path: Path) -> str:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return manifest.get("version", "0.0.0")


async def _register_panel(hass: HomeAssistant) -> None:
    if hass.data.get(REGISTERED_KEY):
        return

    manifest_path = Path(__file__).parent / "manifest.json"
    version = await hass.async_add_executor_job(_read_manifest_version, manifest_path)

    # Version im Pfad statt Query-Param → umgeht Service-Worker-Cache
    static_path = f"{STATIC_PATH_BASE}/{version}"

    await hass.http.async_register_static_paths([
        StaticPathConfig(static_path, str(Path(__file__).parent), True),
    ])

    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="To-Do",
        sidebar_icon="mdi:checkbox-marked-outline",
        frontend_url_path="todo-panel",
        config={
            "_panel_custom": {
                "name": "todo-list-panel",
                "module_url": f"{static_path}/todo-list-panel.js?v={version}",
                "embed_iframe": False,
                "trust_external_script": True,
            }
        },
        require_admin=False,
    )

    hass.data[REGISTERED_KEY] = True


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    if DOMAIN in config:
        await _register_panel(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    await _register_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True

