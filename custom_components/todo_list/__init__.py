# Home Assistant Custom Integration: Todo List Panel
# Dieses Modul registriert nur das Custom Panel im HA-Frontend.
# Die Todo-Daten kommen direkt von der offiziellen HA todo-Domain.

import json
from pathlib import Path

DOMAIN = "todo_list"


async def async_setup(hass, config):
    # Version aus manifest.json lesen fuer Cache-Busting
    manifest_path = Path(__file__).parent / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    version = manifest.get("version", "0.0.0")

    # Panel registrieren: zeigt todo-list-panel.js als Sidebar-Eintrag
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title="To-Do Liste",
        sidebar_icon="mdi:checkbox-marked-outline",
        frontend_url_path="todo-panel",
        config={
            "_panel_custom": {
                "name": "todo-list-panel",
                "module_url": f"/local/todo_list_panel/todo-list-panel.js?v={version}",
                "embed_iframe": False,
                "trust_external_script": True,
            }
        },
        require_admin=False,
    )
    return True

