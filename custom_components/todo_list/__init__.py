# Home Assistant Custom Integration: Todo List Panel
# Dieses Modul registriert nur das Custom Panel im HA-Frontend.
# Die Todo-Daten kommen direkt von der offiziellen HA todo-Domain.

DOMAIN = "todo_list"

async def async_setup(hass, config):
    # Panel registrieren: zeigt todo-list-panel.js als Sidebar-Eintrag
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title="To-Do Liste",
        sidebar_icon="mdi:checkbox-marked-outline",
        frontend_url_path="todo-panel",
        config={
            "_panel_custom": {
                "name": "todo-list-panel",
                "module_url": "/local/todo_list_panel/todo-list-panel.js",
                "embed_iframe": False,
                "trust_external_script": True,
            }
        },
        require_admin=False,
    )
    return True

