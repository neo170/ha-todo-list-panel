const PANEL_VERSION = '1.0.20';

class TodoListPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass        = null;
    this._todos       = [];
    this._lists       = [];
    this._selected    = '';
    this._newText     = '';
    this._loading     = false;
    this._swipeStartX = null;
    this._swipeStartY = null;
    this._swipeId     = null;
    this._swipeMoved  = false;
    this._domReady    = false;
    this._detailTodo  = null;
    this._detailEditMode = false;
    this._fetchTimer  = null;
    this._waitingForNewList = null; 
    this._unsubItems      = null;  
    this._lastUids        = new Set(); 
    this._connected       = true;
    // Drag & Drop
    this._dragUid         = null;
    this._dragLi          = null;
    this._dragPlaceholder = null;
    this._dragStartY      = 0;
    this._dragCurrentY    = 0;
    this._dragTimer       = null;
    this._dragTargetIdx   = -1;
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ HASS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬

  set hass(hass) {
    const prev = this._hass;
    this._hass = hass;

    // Wenn hass gesetzt wird, ist die Verbindung da

    const lists = Object.values(hass.states)
      .filter(e => e.entity_id.startsWith('todo.'))
      .map(e => ({ id: e.entity_id, name: e.attributes.friendly_name || e.entity_id, icon: e.attributes.icon || 'mdi:clipboard-list' }));

    // Benutzerdefinierte Reihenfolge aus localStorage laden
    const savedOrder = JSON.parse(localStorage.getItem('todo_list_order') || '[]');
    if (savedOrder.length > 0) {
      const orderMap = new Map(savedOrder.map((id, i) => [id, i]));
      lists.sort((a, b) => {
        const ia = orderMap.has(a.id) ? orderMap.get(a.id) : 9999;
        const ib = orderMap.has(b.id) ? orderMap.get(b.id) : 9999;
        if (ia !== ib) return ia - ib;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
    } else {
      lists.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
    this._lists = lists;

    // Neue Liste erkannt? ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Sidebar aktualisieren + auswÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤hlen
    if (this._waitingForNewList) {
      const newEntity = lists.find(l => !this._waitingForNewList.has(l.id));
      if (newEntity) {
        this._waitingForNewList = null;
        // Icon auf der neuen Entity setzen
        if (this._pendingNewListIcon) {
          this._hass.callWS({
            type: 'config/entity_registry/update',
            entity_id: newEntity.id,
            icon: this._pendingNewListIcon,
          }).catch(e => console.warn('icon set failed', e));
          this._pendingNewListIcon = null;
        }
        if (this._domReady) this._renderSidebar();
        this._selectList(newEntity.id);
        return;
      }
    }

    if (!this._selected && lists.length > 0) {
      const saved = localStorage.getItem('todo_selected_list');
      const restoredId = saved && lists.find(l => l.id === saved) ? saved : lists[0].id;
      this._selected = restoredId;
      if (this._domReady) this._subscribeItems();
      return;
    }

    // Sidebar bei Listenumbenennungen o.ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤. aktualisieren (nur wenn sich was geÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndert hat)
    if (this._domReady) {
      const sidebarKey = lists.map(l => `${l.id}|${l.name}|${l.icon}|${hass.states[l.id]?.attributes?.items_not_completed ?? 0}`).join(';');
      if (sidebarKey !== this._lastSidebarKey) {
        this._lastSidebarKey = sidebarKey;
        this._renderSidebar();
      }
    }
  }

  get hass() { return this._hass; }

  connectedCallback() {
    this._render();
    this._bindStaticEvents();
    this._domReady = true;
    if (this._selected) this._subscribeItems();

    // Nach App-Resume (iOS Lockscreen, Tab-Wechsel): Subscription neu aufbauen
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this._selected) {
        // Subscription ist nach dem Sleep wahrscheinlich tot ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ neu starten
        this._subscribeItems();
      }
    });
  }

  // PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ft ob wir online sind. Blockiert Aktionen wenn nicht.
  _isOnline() {
    return !!this._hass?.connection;
  }

  // Wrapper fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Service-Calls mit Timeout (verhindert ewiges HÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ngen bei schlechter Verbindung)
  _callWithTimeout(promise, ms = 5000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ API ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬

  // Baut die WS-Subscription fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r die gewÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤hlte Liste auf.
  // Wird bei Listenwechsel neu gestartet. Liefert Push-Updates auf allen GerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ten.
  _subscribeItems() {
    // Alte Subscription beenden
    if (this._unsubItems) {
      this._unsubItems.then(unsub => unsub()).catch(() => {});
      this._unsubItems = null;
    }
    if (!this._selected || !this._hass) return;
    this._loading = true;
    if (this._todos.length === 0) this._renderList(); // Spinner beim ersten Laden

    this._unsubItems = this._hass.connection.subscribeMessage(
      (update) => {
        const raw       = update.items ?? [];
        const active    = raw.filter(t => t.status !== 'completed');
        const completed = raw.filter(t => t.status === 'completed');

        // Auto-Move: Neue "Handy Scan" Items nach oben verschieben
        if (this._selected && this._selected.includes('notizen')) {
          const oldUidSet = new Set(this._todos.map(t => t.uid));
          const newItems = [...active, ...completed].filter(t => !oldUidSet.has(t.uid));
          for (const item of newItems) {
            if (/^handy scan/i.test(item.summary) && active.indexOf(item) > 0) {
              this._hass.callWS({ type: 'todo/item/move', entity_id: this._selected, uid: item.uid, previous_uid: undefined })
                .catch(() => {});
            }
          }
        }

        // KEYED RECONCILIATION: Wir verarbeiten das Update nur,
        // wenn es sich wirklich von unserem Stand unterscheidet,
        // um Flackern und RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼cksprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼nge zu vermeiden.
        const newUids = [...active, ...completed].map(t => t.uid).join(',');
        const oldUids = this._todos.map(t => t.uid).join(',');

        if (newUids !== oldUids) {
          this._todos   = [...active, ...completed];
          this._loading = false;
          this._renderList();
        } else {
          // Nur Status/Texte aktualisieren, aber Reihenfolge (DOM) lassen
          this._todos = [...active, ...completed];
          this._loading = false;
        }
      },
      { type: 'todo/item/subscribe', entity_id: this._selected }
    );
    // Falls subscribeMessage einen Fehler wirft (z.B. Entity weg)
    this._unsubItems.catch(e => {
      console.warn('todo/item/subscribe error:', e);
      this._loading = false;
    });
  }

  // Einmaliger Fetch ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ weiterhin genutzt von _addTodo (fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r move-to-top nach add)
  async _fetchItems() {
    if (!this._selected || !this._hass) return;
    try {
      const result = await this._hass.callWS({
        type:            'call_service',
        domain:          'todo',
        service:         'get_items',
        service_data:    { entity_id: this._selected },
        return_response: true,
      });
      const raw = result?.response?.[this._selected]?.items ?? [];
      const active    = raw.filter(t => t.status !== 'completed');
      const completed = raw.filter(t => t.status === 'completed');
      this._todos = [...active, ...completed];
    } catch (e) {
      console.error('TodoPanel fetch error:', e);
    }
  }

  async _addTodo() {
    if (!this._isOnline()) return;
    const text = this._newText.trim();
    if (!text || !this._selected) return;
    this._newText = '';
    const inputEl = this.shadowRoot.getElementById('new-input');
    const addBtn  = this.shadowRoot.getElementById('add-btn');
    inputEl.value = '';
    addBtn.disabled = true;

    try {
      // 1. Item anlegen (mit Timeout)
      await this._callWithTimeout(
        this._hass.callService('todo', 'add_item', { entity_id: this._selected, item: text })
      );

      // 2. Einmaliges Verschieben nach oben (fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Google Tasks etc. brauchen wir die UID)
      const result = await this._callWithTimeout(
        this._hass.callWS({
          type: 'call_service',
          domain: 'todo',
          service: 'get_items',
          service_data: { entity_id: this._selected },
          return_response: true,
        })
      );
      const items = result?.response?.[this._selected]?.items ?? [];
      const active = items.filter(t => t.status !== 'completed');
      if (!this._itemCreatedAt) this._itemCreatedAt = {};
      if (active.length >= 1) {
        const newItem = active[active.length - 1];
        this._itemCreatedAt[newItem.uid] = Date.now();
      }
      if (active.length > 1) {
        const newItem = active[active.length - 1];
        await this._callWithTimeout(
          this._hass.callWS({
            type: 'todo/item/move',
            entity_id: this._selected,
            uid: newItem.uid,
            previous_uid: undefined
          })
        );
      }
    } catch(e) {
      console.warn('_addTodo error:', e);
    } finally {
      addBtn.disabled = false;
    }
  }

  async _toggleDone(uid, currentStatus) {
    const status = currentStatus === 'completed' ? 'needs_action' : 'completed';
    try {
      await this._callWithTimeout(
        this._hass.callService('todo', 'update_item', { entity_id: this._selected, item: uid, status })
      );
    } catch (e) {
      console.warn('_toggleDone failed/timeout:', e);
      this._subscribeItems();
    }
  }

  async _deleteTodo(uid) {
    if (!this._isOnline()) return;
    // Item merken falls wir es wiederherstellen mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ssen
    const backup = [...this._todos];
    // Optimistisch: Sofort aus UI entfernen
    this._todos = this._todos.filter(t => t.uid !== uid);
    this._renderList();
    try {
      await this._callWithTimeout(
        this._hass.callService('todo', 'remove_item', { entity_id: this._selected, item: uid })
      );
    } catch (e) {
      console.warn('_deleteTodo failed/timeout:', e);
      // LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen hat nicht geklappt ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ alten Stand wiederherstellen
      this._todos = backup;
      this._renderList();
    }
  }

  async _saveDetail(closeAfter = false) {
    if (!this._isOnline()) return;
    const todo    = this._detailTodo;
    if (!todo) return;
    const titleEl   = this.shadowRoot.getElementById('detail-title');
    const notesEl   = this.shadowRoot.getElementById('detail-notes');
    const dueDateEl = this.shadowRoot.getElementById('detail-due-date');
    const dueTimeEl = this.shadowRoot.getElementById('detail-due-time');
    const saveBtn   = this.shadowRoot.getElementById('detail-save');
    const errEl     = this.shadowRoot.getElementById('detail-error');

    const newTitle = titleEl.value.trim() || todo.summary;
    const newNotes = notesEl.value;
    const dateVal  = dueDateEl.value;  // "YYYY-MM-DD" oder ""
    const timeVal  = dueTimeEl.value;  // "HH:MM" oder ""

    // HA erwartet due_date (nur Datum) oder due_datetime (ISO mit Zeit)
    let duePayload = {};
    if (dateVal && timeVal) {
      duePayload = { due_datetime: `${dateVal}T${timeVal}:00` };
    } else if (dateVal) {
      duePayload = { due_date: dateVal };
    } else {
      // Datum explizit leeren: leeren String senden
      duePayload = { due_date: null };
    }

    // Optimistisch: lokalen State sofort updaten & zurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ck zu Readonly
    const newDue = dateVal
      ? (timeVal ? `${dateVal}T${timeVal}:00` : dateVal)
      : null;
    this._todos = this._todos.map(t =>
      t.uid === todo.uid
        ? { ...t, summary: newTitle, description: newNotes, due: newDue }
        : t
    );
    // Detailtodo aktualisieren fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Readonly-Ansicht
    this._detailTodo = { ...todo, summary: newTitle, description: newNotes, due: newDue };
    this._detailEditMode = false;
    if (closeAfter) { this._closeDetail(); } else { this._renderDetailMode(); }
    this._renderList();

    // Im Hintergrund speichern
    try {
      await this._callWithTimeout(
        this._hass.callService('todo', 'update_item', {
          entity_id:   this._selected,
          item:        todo.uid,
          rename:      newTitle,
          description: newNotes,
          ...duePayload,
        })
      );
    } catch (e) {
      console.warn('Full update failed, retrying without description/due:', e);
      try {
        await this._callWithTimeout(
          this._hass.callService('todo', 'update_item', {
            entity_id: this._selected,
            item:      todo.uid,
            rename:    newTitle,
            ...duePayload,
          })
        );
      } catch (e2) {
        console.error('Save failed completely:', e2);
        this._subscribeItems();
      }
    }
  }

  _animateAndDelete(uid) {
    const el = this.shadowRoot.getElementById('item-' + uid);
    if (!el) { this._deleteTodo(uid); return; }
    el.style.transition = 'transform 0.28s ease, opacity 0.28s ease';
    el.style.transform  = 'translateX(-110%)';
    el.style.opacity    = '0';
    setTimeout(() => this._deleteTodo(uid), 280);
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Detail-Ansicht ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬

  _openDetail(uid) {
    if (!this._isOnline()) return;
    this._detailTodo = this._todos.find(t => t.uid === uid) ?? null;
    if (!this._detailTodo) return;
    const t = this._detailTodo;
    // Edit nur wenn innerhalb der letzten 60s erstellt und keine Notiz/Due
    const hasExtra = t.description || t.due;
    const createdAt = this._itemCreatedAt?.[uid];
    const isRecent = createdAt && (Date.now() - createdAt < 20000);
    this._detailEditMode = !hasExtra && isRecent;
    this._showDetail();
  }

  _enterEditMode() {
    this._detailEditMode = true;
    this._renderDetailMode();
    // Fokus auf Titel
    setTimeout(() => this.shadowRoot.getElementById('detail-title')?.focus(), 50);
  }

  _showDetail() {
    const currentList = this._lists.find(l => l.id === this._selected);
    const titleEl = this.shadowRoot.getElementById('detail-header-title');
    if (titleEl && currentList) {
      titleEl.innerHTML = `<ha-icon icon="${currentList.icon}"></ha-icon><span>${this._esc(currentList.name)}</span>`;
    }
    this.shadowRoot.getElementById('slider').classList.add('show-detail');
    this.shadowRoot.getElementById('detail-panel').scrollTop = 0;
    this._renderDetailMode();
  }

  _renderDetailMode() {
    const todo = this._detailTodo;
    const edit = this._detailEditMode;
    const panel = this.shadowRoot.getElementById('detail-panel');

    // Header-Buttons
    const editBtn  = this.shadowRoot.getElementById('detail-edit-btn');
    const saveBtn  = this.shadowRoot.getElementById('detail-save');
    editBtn.style.display = edit ? 'none' : '';
    saveBtn.style.display = edit ? '' : 'none';

    // Readonly View vs Edit View
    panel.querySelector('.detail-readonly').style.display = edit ? 'none' : '';
    panel.querySelector('.detail-editform').style.display = edit ? '' : 'none';

    if (edit) {
      // Edit-Felder befÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼llen
      this.shadowRoot.getElementById('detail-title').value = todo.summary ?? '';
      this.shadowRoot.getElementById('detail-notes').value = todo.description ?? '';
      const dueDate = this.shadowRoot.getElementById('detail-due-date');
      const dueTime = this.shadowRoot.getElementById('detail-due-time');
      if (todo.due) {
        const hasTime = todo.due.includes('T');
        if (hasTime) {
          const [d, t2] = todo.due.split('T');
          dueDate.value = d;
          dueTime.value = t2.slice(0, 5);
        } else {
          dueDate.value = todo.due;
          dueTime.value = '';
        }
      } else {
        dueDate.value = '';
        dueTime.value = '';
      }
      this.shadowRoot.getElementById('detail-error').style.display = 'none';

      // Erstellt-Datum im Edit-Modus anzeigen
      const editModified = this.shadowRoot.getElementById('edit-modified');
      const editModifiedSection = this.shadowRoot.getElementById('edit-modified-section');
      const uuidCreatedEdit = (() => {
        const m = /^([0-9a-f]{8})-([0-9a-f]{4})-(1)([0-9a-f]{3})-/i.exec(todo.uid ?? '');
        if (!m) return null;
        const hi = parseInt(m[4] + m[2] + m[1], 16);
        const ms = Math.floor((hi - 122192928000000000) / 10000);
        return new Date(ms);
      })();
      if (editModifiedSection) {
        if (uuidCreatedEdit && !isNaN(uuidCreatedEdit)) {
          editModified.textContent = uuidCreatedEdit.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
          editModifiedSection.style.display = '';
        } else {
          editModifiedSection.style.display = 'none';
        }
      }
    } else {
      // Readonly View befÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼llen
      this.shadowRoot.getElementById('view-title').textContent = todo.summary ?? '';

      // Notizen mit klickbaren Links
      const viewNotes = this.shadowRoot.getElementById('view-notes');
      if (todo.description) {
        viewNotes.innerHTML = this._linkify(this._esc(todo.description));
        viewNotes.parentElement.style.display = '';
      } else {
        viewNotes.parentElement.style.display = 'none';
      }

      // FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤lligkeitsdatum
      const viewDue = this.shadowRoot.getElementById('view-due');
      if (todo.due) {
        const hasTime = todo.due.includes('T');
        if (hasTime) {
          const [d, t2] = todo.due.split('T');
          const dt = new Date(`${d}T${t2}`);
          viewDue.textContent = dt.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
        } else {
          const dt = new Date(todo.due + 'T00:00:00');
          viewDue.textContent = dt.toLocaleDateString('de-DE', { dateStyle: 'medium' });
        }
        viewDue.parentElement.style.display = '';
      } else {
        viewDue.parentElement.style.display = 'none';
      }

      // Erstelldatum aus UUID v1
      const viewModified = this.shadowRoot.getElementById('view-modified');
      const uuidCreated = (() => {
        const m = /^([0-9a-f]{8})-([0-9a-f]{4})-(1)([0-9a-f]{3})-/i.exec(todo.uid ?? '');
        if (!m) return null;
        // UUID v1: 100ns-Intervalle seit 15. Okt 1582
        const hi = parseInt(m[4] + m[2] + m[1], 16);
        const ms = Math.floor((hi - 122192928000000000) / 10000);
        return new Date(ms);
      })();
      if (uuidCreated && !isNaN(uuidCreated)) {
        viewModified.textContent = uuidCreated.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
        viewModified.parentElement.style.display = '';
      } else {
        viewModified.parentElement.style.display = 'none';
      }
    }
  }

  // URLs in Text erkennen und als Links rendern
  _linkify(text) {
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
    return text.replace(urlRegex, url =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Suche ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber alle Listen (Mobile: Inline im Mainbereich) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  _showSearch() {
    this._searchActive = true;
    this._searchOriginalList = this._selected;
    this._sidebarSearchQuery = this._searchQuery || '';
    
    const titleEl = this.shadowRoot.getElementById('header-title-text');
    if (titleEl) titleEl.textContent = 'Suche';
    const titleIcon = this.shadowRoot.getElementById('header-title-icon');
    if (titleIcon) titleIcon.setAttribute('icon', 'mdi:magnify');

    // Header-Buttons: Such-Icon + MenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ ausblenden, X-Button zeigen
    const searchBtn = this.shadowRoot.getElementById('search-btn');
    const menuWrap = this.shadowRoot.querySelector('.main-menu-wrap');
    const titleBtn = this.shadowRoot.getElementById('header-title-btn');
    const chevron = this.shadowRoot.getElementById('title-chevron');
    if (searchBtn) searchBtn.style.display = 'none';
    if (menuWrap) menuWrap.style.display = 'none';
    if (titleBtn) titleBtn.style.pointerEvents = 'none';
    if (chevron) chevron.style.display = 'none';

    let closeBtn = this.shadowRoot.getElementById('search-close-btn');
    if (!closeBtn) {
      closeBtn = document.createElement('ha-icon-button');
      closeBtn.id = 'search-close-btn';
      closeBtn.setAttribute('label', 'Suche beenden');
      closeBtn.innerHTML = '<ha-icon icon="mdi:close"></ha-icon>';
      closeBtn.addEventListener('click', () => this._closeSearch());
      menuWrap?.parentNode?.insertBefore(closeBtn, menuWrap.nextSibling);
    }
    closeBtn.style.display = '';

    const mainArea = this.shadowRoot.querySelector('.main-area .content');
    const todoList = this.shadowRoot.getElementById('todo-list');
    const addRow = this.shadowRoot.querySelector('.add-row');
    if (!mainArea) return;

    if (addRow) addRow.style.display = 'none';
    if (todoList) todoList.style.display = 'none';

    let container = this.shadowRoot.getElementById('search-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'search-container';
      container.style.cssText = 'padding:0.75rem;flex:1;display:flex;flex-direction:column;overflow:hidden;';
      mainArea.appendChild(container);
    }
    container.style.display = '';

    container.innerHTML = `
      <div style="position:relative;margin-bottom:0.75rem;">
        <input id="mobile-search-input" type="text" placeholder="Suchen" style="
          width:100%;padding:0.6rem 2.2rem 0.6rem 0.75rem;border:1px solid var(--divider-color,#e0e0e0);
          border-radius:10px;font-size:1rem;box-sizing:border-box;
          background:var(--card-background-color,#fff);
          color:var(--primary-text-color,#333);outline:none;">
        <button id="mobile-search-clear" style="
          position:absolute;right:8px;top:50%;transform:translateY(-50%);
          border:none;background:none;font-size:1.1rem;cursor:pointer;
          color:var(--secondary-text-color,#999);padding:0.2rem;display:none;">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢</button>
      </div>
      <div id="mobile-search-results" style="flex:1;overflow-y:auto;"></div>
    `;

    const input = container.querySelector('#mobile-search-input');
    const clearBtn = container.querySelector('#mobile-search-clear');
    const results = container.querySelector('#mobile-search-results');

    if (this._searchQuery) {
      input.value = this._searchQuery;
      clearBtn.style.display = '';
      this._doSearch(input.value.trim(), results);
    }

    input.addEventListener('input', () => {
      this._searchQuery = input.value;
      clearBtn.style.display = input.value ? '' : 'none';
      this._doSearch(input.value.trim(), results);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._closeSearch();
    });
    clearBtn.addEventListener('click', () => {
      input.value = '';
      this._searchQuery = '';
      clearBtn.style.display = 'none';
      results.innerHTML = '';
      input.focus();
    });

    setTimeout(() => input.focus(), 100);
  }

  async _doSearch(query, resultsEl) {
    if (!query || query.length < 2) {
      resultsEl.innerHTML = '<div style="padding:0.5rem;font-size:0.85rem;color:var(--secondary-text-color,#999);">Mindestens 2 Zeichen eingebenÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</div>';
      return;
    }

    if (!this._searchAllItems || this._searchAllItems.length === 0) {
      resultsEl.innerHTML = '<div style="padding:0.5rem;font-size:0.85rem;color:var(--secondary-text-color,#999);">LadeÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</div>';
      this._searchAllItems = [];
      for (const list of this._lists) {
        const items = await new Promise((resolve) => {
          let done = false;
          this._hass.connection.subscribeMessage(
            (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
            { type: 'todo/item/subscribe', entity_id: list.id }
          ).then(unsub => { setTimeout(() => { if (!done) { done = true; resolve([]); } unsub(); }, 5000); });
        });
        for (const item of items) {
          this._searchAllItems.push({ ...item, listId: list.id, listName: list.name });
        }
      }
    }

    const q = query.toLowerCase();
    const matches = this._searchAllItems.filter(item =>
      item.summary.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      resultsEl.innerHTML = '<div style="padding:0.5rem;font-size:0.85rem;color:var(--secondary-text-color,#999);">Keine Ergebnisse.</div>';
      return;
    }

    resultsEl.innerHTML = `<div style="padding:0.25rem 0;font-size:0.8rem;color:var(--secondary-text-color,#999);">${matches.length} Ergebnis${matches.length > 1 ? 'se' : ''}</div>
      <ul class="todo-list" style="margin:0;padding:0;">` +
      matches.slice(0, 50).map(item => `
        <li class="swipe-wrapper search-result-li" data-uid="${item.uid}" data-list="${item.listId}">
          <div class="todo-item">
            <div class="check-circle ${item.status === 'completed' ? 'done' : ''}"></div>
            <div class="todo-body">
              <div class="todo-text ${item.status === 'completed' ? 'done' : ''}">${this._esc(item.summary)}</div>
              <div class="todo-note-preview">${this._esc(item.listName)}</div>
            </div>
            <span class="chevron">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âº</span>
          </div>
        </li>
      `).join('') + '</ul>';

    resultsEl.querySelectorAll('.search-result-li').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.dataset.uid;
        const listId = el.dataset.list;
        this._searchReturnToResults = true;

        const item = this._searchAllItems.find(i => i.uid === uid && i.listId === listId);
        if (item) {
          this._detailTodo = item;
          this._detailEditMode = false;
          this._selected = listId;
          this._showDetail();
        }
      });
    });
  }

  _closeSearch() {
    this._searchActive = false;
    this._searchQuery = '';
    const container = this.shadowRoot.getElementById('search-container');
    if (container) container.style.display = 'none';
    const addRow = this.shadowRoot.querySelector('.add-row');
    const todoList = this.shadowRoot.getElementById('todo-list');
    if (addRow) addRow.style.display = '';
    if (todoList) todoList.style.display = '';
    // Liste aktualisieren: zurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ck zur ursprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼nglichen Liste
    if (this._searchOriginalList) {
      this._selected = this._searchOriginalList;
      this._searchOriginalList = null;
    }
    localStorage.setItem('todo_selected_list', this._selected);
    this._subscribeItems();
    this._renderSidebar();
    // Header wiederherstellen
    const searchBtn = this.shadowRoot.getElementById('search-btn');
    const menuWrap = this.shadowRoot.querySelector('.main-menu-wrap');
    const closeBtn = this.shadowRoot.getElementById('search-close-btn');
    const titleBtn = this.shadowRoot.getElementById('header-title-btn');
    const chevron = this.shadowRoot.getElementById('title-chevron');
    if (searchBtn) searchBtn.style.display = '';
    if (menuWrap) menuWrap.style.display = '';
    if (closeBtn) closeBtn.style.display = 'none';
    if (titleBtn) titleBtn.style.pointerEvents = '';
    if (chevron) chevron.style.display = '';
    const titleEl = this.shadowRoot.getElementById('header-title-text');
    const titleIcon = this.shadowRoot.getElementById('header-title-icon');
    const currentList = this._lists.find(l => l.id === this._selected);
    if (titleEl) titleEl.textContent = currentList?.name ?? 'To Do';
    if (titleIcon) titleIcon.setAttribute('icon', currentList?.icon ?? 'mdi:clipboard-list');
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Export / Import Dialog ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  async _showExportImportDialog() {
    const overlay = this.shadowRoot.getElementById('dialog-overlay');
    const box = this.shadowRoot.getElementById('dialog-box');
    const originalHTML = box.innerHTML;

    const restore = () => { box.innerHTML = originalHTML; overlay.classList.remove('open'); };

    box.innerHTML = `
      <h3 style="margin:0 0 1rem;font-size:1.1rem;">Export / Import</h3>
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
        <button id="ei-tab-export" class="ei-tab active">Export</button>
        <button id="ei-tab-import" class="ei-tab">Import</button>
      </div>
      <div id="ei-export-view">
        <p style="font-size:0.85rem;color:var(--secondary-text-color,#666);margin:0 0 0.75rem;">
          Exportiert alle Listen mit allen EintrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤gen als JSON.
        </p>
        <button id="ei-export-btn" style="
          width:100%;padding:0.7rem;border:none;border-radius:8px;
          background:var(--primary-color,#1976d2);color:#fff;font-size:0.95rem;cursor:pointer;">
          Exportieren & Herunterladen
        </button>
        <div id="ei-export-status" style="margin-top:0.5rem;font-size:0.85rem;color:var(--secondary-text-color,#666);"></div>
      </div>
      <div id="ei-import-view" style="display:none;">
        <p style="font-size:0.85rem;color:var(--secondary-text-color,#666);margin:0 0 0.75rem;">
          Importiert Listen aus einer JSON-Datei. Fehlende Listen werden erstellt, vorhandene EintrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ge mit gleicher ID ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼berschrieben.
        </p>
        <input type="file" id="ei-import-file" accept=".json" style="margin-bottom:0.75rem;font-size:0.9rem;">
        <button id="ei-import-btn" style="
          width:100%;padding:0.7rem;border:none;border-radius:8px;
          background:var(--primary-color,#1976d2);color:#fff;font-size:0.95rem;cursor:pointer;" disabled>
          Importieren
        </button>
        <div id="ei-import-status" style="margin-top:0.5rem;font-size:0.85rem;color:var(--secondary-text-color,#666);"></div>
      </div>
      <button id="ei-close" style="
        margin-top:1rem;width:100%;padding:0.6rem;border:none;border-radius:8px;
        background:var(--secondary-background-color,#f5f5f5);color:var(--primary-text-color,#333);
        font-size:0.95rem;cursor:pointer;">
        SchlieÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸en
      </button>
    `;
    overlay.classList.add('open');

    // Tabs
    const tabExport = box.querySelector('#ei-tab-export');
    const tabImport = box.querySelector('#ei-tab-import');
    const viewExport = box.querySelector('#ei-export-view');
    const viewImport = box.querySelector('#ei-import-view');
    tabExport.addEventListener('click', () => {
      tabExport.classList.add('active'); tabImport.classList.remove('active');
      viewExport.style.display = ''; viewImport.style.display = 'none';
    });
    tabImport.addEventListener('click', () => {
      tabImport.classList.add('active'); tabExport.classList.remove('active');
      viewImport.style.display = ''; viewExport.style.display = 'none';
    });

    // Close
    box.querySelector('#ei-close').addEventListener('click', restore);

    // Export
    box.querySelector('#ei-export-btn').addEventListener('click', async () => {
      const status = box.querySelector('#ei-export-status');
      status.textContent = 'ExportiereÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦';
      try {
        const exportData = { version: 1, exported: new Date().toISOString(), lists: [] };
        for (const list of this._lists) {
          status.textContent = `Lade "${list.name}"ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦`;
          const items = await new Promise((resolve) => {
            let done = false;
            this._hass.connection.subscribeMessage(
              (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
              { type: 'todo/item/subscribe', entity_id: list.id }
            ).then(unsub => { setTimeout(() => { if (!done) { done = true; resolve([]); } unsub(); }, 5000); });
          });
          exportData.lists.push({
            entity_id: list.id,
            name: list.name,
            icon: list.icon || null,
            items: items.map((item, idx) => ({
              uid: item.uid,
              summary: item.summary,
              status: item.status,
              description: item.description || null,
              due: item.due || null,
              position: idx,
            }))
          });
        }
        // Download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        status.textContent = `ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ${exportData.lists.length} Listen exportiert.`;
      } catch(e) {
        status.textContent = 'Fehler: ' + e.message;
      }
    });

    // Import
    const fileInput = box.querySelector('#ei-import-file');
    const importBtn = box.querySelector('#ei-import-btn');
    fileInput.addEventListener('change', () => { importBtn.disabled = !fileInput.files[0]; });

    importBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const status = box.querySelector('#ei-import-status');
      status.textContent = 'Lese DateiÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦';
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.lists || !Array.isArray(data.lists)) throw new Error('UngÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ltiges Format');

        // Stufe 1: Listen-Auswahl anzeigen
        const importView = box.querySelector('#ei-import-view');
        importView.innerHTML = `
          <p style="font-size:0.85rem;color:var(--secondary-text-color,#666);margin:0 0 0.75rem;">
            ${data.lists.length} Listen gefunden. WÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤hle aus, welche importiert werden sollen:
          </p>
          <div id="ei-list-selection" style="max-height:40vh;overflow-y:auto;margin-bottom:0.75rem;">
            ${data.lists.map((l, i) => `
              <label style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.3rem;cursor:pointer;border-bottom:1px solid var(--divider-color,#eee);">
                <input type="checkbox" checked data-idx="${i}" style="width:18px;height:18px;accent-color:var(--primary-color,#1976d2);">
                <span style="flex:1;">
                  <strong>${this._esc(l.name)}</strong>
                  <span style="font-size:0.8rem;color:var(--secondary-text-color,#999);margin-left:0.4rem;">${l.items?.length ?? 0} EintrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ge</span>
                </span>
              </label>
            `).join('')}
          </div>
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">
            <button id="ei-select-all" style="flex:1;padding:0.4rem;border:1px solid var(--divider-color,#e0e0e0);border-radius:6px;background:none;cursor:pointer;font-size:0.8rem;">Alle</button>
            <button id="ei-select-none" style="flex:1;padding:0.4rem;border:1px solid var(--divider-color,#e0e0e0);border-radius:6px;background:none;cursor:pointer;font-size:0.8rem;">Keine</button>
          </div>
          <button id="ei-start-import" style="
            width:100%;padding:0.7rem;border:none;border-radius:8px;
            background:var(--primary-color,#1976d2);color:#fff;font-size:0.95rem;cursor:pointer;">
            AusgewÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤hlte importieren
          </button>
          <div id="ei-import-status2" style="margin-top:0.5rem;font-size:0.85rem;color:var(--secondary-text-color,#666);"></div>
        `;

        // Alle/Keine Buttons
        box.querySelector('#ei-select-all').addEventListener('click', () => {
          box.querySelectorAll('#ei-list-selection input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        box.querySelector('#ei-select-none').addEventListener('click', () => {
          box.querySelectorAll('#ei-list-selection input[type="checkbox"]').forEach(cb => cb.checked = false);
        });

        // Stufe 2: Import starten
        box.querySelector('#ei-start-import').addEventListener('click', async () => {
          const checks = [...box.querySelectorAll('#ei-list-selection input[type="checkbox"]')];
          const selectedLists = checks.filter(cb => cb.checked).map(cb => data.lists[parseInt(cb.dataset.idx)]);
          if (selectedLists.length === 0) return;

          const status2 = box.querySelector('#ei-import-status2');
          box.querySelector('#ei-start-import').disabled = true;

          for (const listData of selectedLists) {
            status2.textContent = `Verarbeite "${listData.name}"ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦`;

            // PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼fen ob Liste existiert
            let targetEntity = this._lists.find(l => l.id === listData.entity_id)?.id;

            if (!targetEntity) {
              status2.textContent = `Erstelle Liste "${listData.name}"ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦`;
              try {
                const step1 = await this._hass.callApi('POST', 'config/config_entries/flow', {
                  handler: 'local_todo', show_advanced_options: false,
                });
                if (step1?.flow_id) {
                  await this._hass.callApi('POST', `config/config_entries/flow/${step1.flow_id}`, {
                    todo_list_name: listData.name,
                  });
                  await new Promise(r => setTimeout(r, 2000));
                  const states = Object.values(this._hass.states).filter(s => s.entity_id.startsWith('todo.'));
                  const newList = states.find(s => s.attributes.friendly_name === listData.name);
                  if (newList) targetEntity = newList.entity_id;
                }
              } catch(e) {
                status2.textContent = `Konnte "${listData.name}" nicht erstellen: ${e.message}`;
                continue;
              }
            }
            if (!targetEntity) continue;

            // Vorhandene Items laden
            const existingItems = await new Promise((resolve) => {
              let done = false;
              this._hass.connection.subscribeMessage(
                (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
                { type: 'todo/item/subscribe', entity_id: targetEntity }
              ).then(unsub => { setTimeout(() => { if (!done) { done = true; resolve([]); } unsub(); }, 5000); });
            });
            const existingMap = new Map(existingItems.map(i => [i.uid, i]));

            // Items importieren (sortiert nach Position)
            const sorted = [...listData.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            for (const item of sorted) {
              const existing = existingMap.get(item.uid);
              if (existing) {
                if (existing.summary !== item.summary || existing.description !== (item.description || '') ||
                    existing.status !== item.status || existing.due !== (item.due || null)) {
                  await this._hass.callService('todo', 'update_item', {
                    item: item.uid,
                    rename: item.summary,
                    description: item.description || '',
                    due_date: item.due && !item.due.includes('T') ? item.due : undefined,
                    due_datetime: item.due && item.due.includes('T') ? item.due : undefined,
                    status: item.status,
                  }, { entity_id: targetEntity });
                }
              } else {
                await this._hass.callService('todo', 'add_item', {
                  item: item.summary,
                  description: item.description || undefined,
                  due_date: item.due && !item.due.includes('T') ? item.due : undefined,
                  due_datetime: item.due && item.due.includes('T') ? item.due : undefined,
                }, { entity_id: targetEntity });
                // Status setzen wenn erledigt
                if (item.status === 'completed') {
                  // Item finden (gerade erst angelegt, noch kein uid bekannt ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber summary matchen)
                  await new Promise(r => setTimeout(r, 500));
                  const freshItems = await new Promise((resolve) => {
                    let done = false;
                    this._hass.connection.subscribeMessage(
                      (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
                      { type: 'todo/item/subscribe', entity_id: targetEntity }
                    ).then(unsub => { setTimeout(() => { if (!done) { done = true; resolve([]); } unsub(); }, 5000); });
                  });
                  const created = freshItems.find(i => i.summary === item.summary && i.status !== 'completed');
                  if (created) {
                    await this._hass.callService('todo', 'update_item', {
                      item: created.uid,
                      status: 'completed',
                    }, { entity_id: targetEntity });
                  }
                }
              }
            }

            // Reihenfolge wiederherstellen
            status2.textContent = `Sortiere "${listData.name}"ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦`;
            const updatedItems = await new Promise((resolve) => {
              let done = false;
              this._hass.connection.subscribeMessage(
                (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
                { type: 'todo/item/subscribe', entity_id: targetEntity }
              ).then(unsub => { setTimeout(() => { if (!done) { done = true; resolve([]); } unsub(); }, 5000); });
            });
            const uidOrder = sorted.map(i => i.uid);
            for (let i = 0; i < uidOrder.length; i++) {
              const uid = uidOrder[i];
              if (!updatedItems.find(it => it.uid === uid)) continue;
              const prevUid = i === 0 ? undefined : uidOrder[i - 1];
              try {
                await this._hass.callWS({
                  type: 'todo/item/move',
                  entity_id: targetEntity,
                  uid: uid,
                  previous_uid: prevUid,
                });
              } catch(e) { /* best effort */ }
            }

            // Icon setzen
            if (listData.icon && targetEntity) {
              try {
                await this._hass.callWS({
                  type: 'config/entity_registry/update',
                  entity_id: targetEntity,
                  icon: listData.icon,
                });
              } catch(e) { /* best effort */ }
            }
          }

          status2.textContent = `ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ${selectedLists.length} Listen importiert.`;
          this._subscribeItems();
        });

      } catch(e) {
        status.textContent = 'Fehler: ' + e.message;
      }
    });
  }

  _closeDetail() {
    this.shadowRoot.getElementById('slider').classList.remove('show-detail');
    this._detailTodo     = null;
    this._detailEditMode = false;

    // Wenn aus Suche geÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶ffnet (mobile oder sidebar), nichts zurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼cksetzen
    if (this._searchReturnToResults) {
      this._searchReturnToResults = false;
    }
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ iOS-Style Swipe ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
  // Kleiner Swipe  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen-Button einblenden (revealed)
  // GroÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸er Swipe   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ sofort lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen
  // Tap woanders  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Button wieder zuklappen

  _closeAllRevealed(exceptUid) {
    this.shadowRoot.querySelectorAll('.todo-item.revealed').forEach(el => {
      const uid = el.id.replace('item-', '');
      if (uid !== exceptUid) {
        el.classList.remove('revealed');
        el.style.transform = '';
        el.closest('.swipe-wrapper')?.classList.remove('open');
      }
    });
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Drag & Drop ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬

  _dragStart(uid, clientY, clientX) {
    this._dragUid      = uid;
    this._dragStartY   = clientY;
    this._dragStartX   = clientX || 0;
    this._dragCurrentY = clientY;

    const li = this.shadowRoot.querySelector(`li[data-uid="${uid}"]`);
    if (!li) return;

    const ul = this.shadowRoot.getElementById('todo-list');
    const liRect  = li.getBoundingClientRect();

    // Platzhalter VOR dem Abheben einfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼gen (hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤lt den Platz)
    const ph = document.createElement('li');
    ph.className    = 'drag-placeholder';
    ph.style.height = liRect.height + 'px';
    ph.style.transition = 'height 0.2s ease';
    li.before(ph);
    this._dragPlaceholder = ph;

    // Ghost-Klon erstellen statt Original zu fixen (vermeidet CSS-Kontext-Probleme)
    const ghost = li.cloneNode(true);
    ghost.style.position   = 'fixed';
    ghost.style.top        = liRect.top + 'px';
    ghost.style.left       = liRect.left + 'px';
    ghost.style.width      = liRect.width + 'px';
    ghost.style.height     = liRect.height + 'px';
    ghost.style.margin     = '0';
    ghost.style.padding    = '0';
    ghost.style.listStyle  = 'none';
    ghost.style.zIndex     = '9999';
    ghost.style.boxShadow  = '0 6px 20px rgba(0,0,0,0.2)';
    ghost.style.opacity    = '0.95';
    ghost.style.transition = 'none';
    ghost.style.pointerEvents = 'none';
    ghost.style.boxSizing  = 'border-box';
    ghost.classList.add('dragging-source');
    this.shadowRoot.appendChild(ghost);
    this._dragGhost = ghost;

    // Original verstecken
    li.style.display = 'none';
    li.classList.add('drag-hidden');
    this._dragLi = li;

    // Offset zwischen Mausposition und Element-Ecke
    this._dragOffsetY = clientY - liRect.top;
    this._dragOffsetX = clientX - liRect.left;
  }

  _updateDragGhost(clientY, clientX) {
    if (!this._dragGhost) return;
    // Ghost folgt der Maus mit konstantem Offset
    this._dragGhost.style.top = (clientY - this._dragOffsetY) + 'px';
    this._dragGhost.style.left = (clientX - this._dragOffsetX) + 'px';
    this._dragCurrentY = clientY;

    // PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼fen ob ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber einer Sidebar-Liste (Desktop cross-list drop)
    const sidebar = this.shadowRoot.getElementById('sidebar');
    const sidebarItems = sidebar ? [...sidebar.querySelectorAll('.sidebar-item')] : [];
    let overList = null;
    if (sidebar && sidebar.offsetParent !== null) {
      const sidebarRect = sidebar.getBoundingClientRect();
      // Maus ist ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber dem Sidebar-Bereich (oder nah dran)
      if (clientX <= sidebarRect.right + 20) {
        for (const btn of sidebarItems) {
          const r = btn.getBoundingClientRect();
          if (clientY >= r.top && clientY <= r.bottom) {
            const listId = btn.dataset.id;
            if (listId && listId !== this._selected) {
              overList = listId;
            }
            break;
          }
        }
      }
    }

    // Highlight auf Sidebar-Items
    sidebarItems.forEach(btn => {
      btn.classList.toggle('drag-over', btn.dataset.id === overList);
    });
    this._dragOverList = overList;

    // Wenn ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber Sidebar ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ keinen In-List-Move berechnen
    if (overList) return;

    // Ziel-Index anhand der Mitte des gezogenen Elements
    const ul = this.shadowRoot.getElementById('todo-list');
    const ghostRect = this._dragGhost.getBoundingClientRect();
    const ghostMid  = ghostRect.top + ghostRect.height / 2;
    const items  = [...ul.querySelectorAll('li.swipe-wrapper[data-uid]:not(.drag-hidden)')];

    let targetIdx = items.length;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (ghostMid < r.top + r.height / 2) { targetIdx = i; break; }
    }
    this._dragTargetIdx = targetIdx;

    // Platzhalter an Zielposition einsetzen
    const ph = this._dragPlaceholder;
    if (!ph) return;
    if (targetIdx >= items.length) {
      ul.appendChild(ph);
    } else {
      ul.insertBefore(ph, items[targetIdx]);
    }
  }

  async _dragEnd() {
    if (!this._dragUid) return;
    const srcUid    = this._dragUid;
    const targetIdx = this._dragTargetIdx;
    const overList  = this._dragOverList;

    // Sidebar-Highlight entfernen
    const sidebar = this.shadowRoot.getElementById('sidebar');
    if (sidebar) sidebar.querySelectorAll('.sidebar-item').forEach(btn => btn.classList.remove('drag-over'));

    // Platzhalter entfernen
    if (this._dragPlaceholder) { this._dragPlaceholder.remove(); this._dragPlaceholder = null; }

    // Ghost entfernen
    if (this._dragGhost) { this._dragGhost.remove(); this._dragGhost = null; }

    // Original wieder anzeigen
    const li = this._dragLi;
    if (li) {
      li.style.display = '';
      li.classList.remove('drag-hidden');
    }
    this._dragLi        = null;
    this._dragUid       = null;
    this._dragTargetIdx = -1;
    this._dragTopStart  = 0;
    this._dragOverList  = null;
    this._dragJustEnded = true;

    // Cross-List Move: Item auf andere Liste verschieben
    if (overList) {
      const todo = this._todos.find(t => t.uid === srcUid);
      if (!todo) return;
      try {
        // Item auf Zielliste anlegen
        await this._hass.callService('todo', 'add_item', {
          item: todo.summary,
          description: todo.description || undefined,
          due_date: todo.due || undefined,
        }, { entity_id: overList });
        // Neues Item an Position 1 verschieben (oben einsortieren)
        try {
          const items = await new Promise((resolve, reject) => {
            let done = false;
            this._hass.connection.subscribeMessage(
              (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
              { type: 'todo/item/subscribe', entity_id: overList }
            ).then(unsub => { setTimeout(() => { unsub(); if (!done) reject('timeout'); }, 3000); });
          });
          if (items.length > 1) {
            // Das zuletzt angelegte Item ist das letzte in der Liste
            const newItem = items[items.length - 1];
            await this._hass.callWS({
              type: 'todo/item/move',
              entity_id: overList,
              uid: newItem.uid,
              previous_uid: undefined,
            });
          }
        } catch(moveErr) { console.warn('move-to-top failed:', moveErr); }
        // Item von Quellliste lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen
        await this._hass.callService('todo', 'remove_item', {
          item: srcUid,
        }, { entity_id: this._selected });
        // Lokale Liste aktualisieren
        this._todos = this._todos.filter(t => t.uid !== srcUid);
        this._renderList();
      } catch(e) {
        console.warn('cross-list move failed:', e);
        this._renderList();
      }
      return;
    }

    const srcIdx = this._todos.findIndex(t => t.uid === srcUid);
    if (srcIdx === -1) { this._renderList(); return; }

    // items[] enthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤lt bereits alle Elemente auÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸er dem gezogenen ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢
    // targetIdx entspricht direkt der Position in newTodos nach splice
    const newTodos = [...this._todos];
    const [moved] = newTodos.splice(srcIdx, 1);
    newTodos.splice(targetIdx, 0, moved);
    
    // SERVER-UPDATE
    const prevUid = targetIdx > 0 ? newTodos[targetIdx - 1].uid : undefined;
    
    // Wir setzen die lokale Liste ZUERST, damit die Key-Erkennung in der Subscription
    // sofort den neuen Zustand als "Basis" sieht.
    const oldTodos = this._todos;
    this._todos = newTodos;
    this._renderList();

    try {
      await this._hass.callWS({
        type: 'todo/item/move',
        entity_id: this._selected,
        uid: srcUid,
        previous_uid: prevUid,
      });
    } catch (e) {
      console.warn('todo/item/move failed:', e);
      this._todos = oldTodos;
      this._renderList();
    }
  }

  _onTouchStart(e, uid) {
    this._swipeStartX = e.touches[0].clientX;
    this._swipeStartY = e.touches[0].clientY;
    this._swipeId     = uid;
    this._swipeMoved  = false;

    // Long-Press Timer starten
    clearTimeout(this._dragTimer);
    this._dragTimer = setTimeout(() => {
      if (this._swipeMoved || this._dragUid) return;
      this._swipeId = null;
      this._dragTimer = null;
      if (navigator.vibrate) navigator.vibrate(40);
      e.preventDefault(); // Text-Selektion verhindern
      this._dragStart(uid, e.touches[0].clientY, e.touches[0].clientX);
    }, 600);
  }

  _onMouseDown(e, uid) {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let timerFired = false;
    let swipeStarted = false; // horizontaler Maus-Swipe erkannt

    const onMove = ev => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (timerFired) {
        // Drag-Modus: frei bewegen
        this._updateDragGhost(ev.clientY, ev.clientX);
        return;
      }

      // Swipe-Modus: horizontal dominiert
      if (!swipeStarted && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
        swipeStarted = true;
        clearTimeout(this._dragTimer);
        this._dragTimer = null;
      }

      if (swipeStarted) {
        const el = this.shadowRoot.getElementById('item-' + uid);
        if (!el) return;
        if (dx < 0) {
          const base = el.classList.contains('revealed') ? -80 : 0;
          const clamped = Math.max(base + dx, -220);
          el.style.transition = 'none';
          el.style.transform  = `translateX(${clamped}px)`;
        } else {
          const base = el.classList.contains('revealed') ? -80 : 0;
          const clamped = Math.min(base + dx, 0);
          el.style.transition = 'none';
          el.style.transform  = clamped === 0 ? '' : `translateX(${clamped}px)`;
        }
        return;
      }

      // Vertikale Bewegung vor Long-Press ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Drag abbrechen
      if (Math.hypot(dx, dy) > 5) {
        clearTimeout(this._dragTimer);
        this._dragTimer = null;
        cleanup();
      }
    };

    const onUp = () => {
      clearTimeout(this._dragTimer);
      this._dragTimer = null;
      cleanup();

      if (timerFired) {
        document.addEventListener('click', suppressNextClick, true);
        this._dragEnd();
        return;
      }

      if (swipeStarted) {
        document.addEventListener('click', suppressNextClick, true);
        this._dragJustEnded = true; // nachfolgenden click unterdrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼cken
        // Swipe auswerten ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ identische Logik wie _onTouchEnd
        const el = this.shadowRoot.getElementById('item-' + uid);
        if (!el) return;
        el.style.transition = '';
        const tx = parseFloat(el.style.transform?.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)?.[1] ?? '0');
        if (tx < -160) {
          this._animateAndDelete(uid);
        } else if (tx < -40) {
          el.classList.add('revealed');
          el.style.transform = '';
          el.closest('.swipe-wrapper')?.classList.add('open');
          this._closeAllRevealed(uid);
        } else {
          el.classList.remove('revealed');
          el.style.transform = '';
          el.closest('.swipe-wrapper')?.classList.remove('open');
        }
      }
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    // Capture-Phase: nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤chsten click nach Swipe/Drag abfangen bevor er irgendwo ankommt
    const suppressNextClick = ev => {
      ev.stopPropagation();
      ev.preventDefault();
      document.removeEventListener('click', suppressNextClick, true);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    clearTimeout(this._dragTimer);
    this._dragTimer = setTimeout(() => {
      this._dragTimer = null;
      timerFired = true;
      if (navigator.vibrate) navigator.vibrate(40);
      this._dragStart(uid, startY, startX);
    }, 600);
  }

  _onTouchMove(e, uid) {
    // Drag-Modus aktiv ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Ghost bewegen
    if (this._dragUid === uid) {
      e.preventDefault();
      this._updateDragGhost(e.touches[0].clientY, e.touches[0].clientX);
      return;
    }

    if (this._swipeId !== uid) return;
    const dx = e.touches[0].clientX - this._swipeStartX;
    const dy = e.touches[0].clientY - this._swipeStartY;

    // Bewegung erkannt ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Long-Press Timer abbrechen
    if (!this._swipeMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      clearTimeout(this._dragTimer);
      this._dragTimer = null;
    }

    // Wenn vertikaler Scroll dominiert ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ignorieren
    if (!this._swipeMoved && Math.abs(dy) > Math.abs(dx)) {
      this._swipeId = null;
      return;
    }
    this._swipeMoved = true;

    const el = this.shadowRoot.getElementById('item-' + uid);
    if (!el) return;

    if (dx < 0) {
      // Bereits revealed? Dann von -80px weiter nach links
      const base = el.classList.contains('revealed') ? -80 : 0;
      const clamped = Math.max(base + dx, -220);
      el.style.transition = 'none';
      el.style.transform  = `translateX(${clamped}px)`;
    } else if (dx > 0) {
      // ZurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ckschieben, aber nicht ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber 0
      const base = el.classList.contains('revealed') ? -80 : 0;
      const clamped = Math.min(base + dx, 0);
      el.style.transition = 'none';
      el.style.transform  = clamped === 0 ? '' : `translateX(${clamped}px)`;
    }
  }

  _onTouchEnd(e, uid) {
    clearTimeout(this._dragTimer);
    this._dragTimer = null;

    // Drag-Modus beenden
    if (this._dragUid === uid) {
      this._dragEnd();
      return;
    }

    if (this._swipeId !== uid) return;
    this._swipeId = null;
    if (!this._swipeMoved) return;

    const el = this.shadowRoot.getElementById('item-' + uid);
    if (!el) return;

    el.style.transition = ''; // CSS-Transition wieder aktivieren
    const tx = parseFloat(el.style.transform?.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)?.[1] ?? '0');

    if (tx < -160) {
      // GroÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸er Swipe ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ sofort lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen
      this._animateAndDelete(uid);
    } else if (tx < -40) {
      // Kleiner Swipe ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ einrasten, LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen-Button zeigen
      el.classList.add('revealed');
      el.style.transform = '';
      el.closest('.swipe-wrapper')?.classList.add('open');
      this._closeAllRevealed(uid);
    } else {
      // Zu wenig ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ zuklappen
      el.classList.remove('revealed');
      el.style.transform = '';
      el.closest('.swipe-wrapper')?.classList.remove('open');
    }
  }

  // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Rendering ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; }

        :host {
          display: block;
          position: relative;
          background: var(--primary-background-color, #f0f4f8);
          font-family: var(--ha-font-family, Roboto, sans-serif);
          overflow: hidden;
          /* FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼llt den gesamten HA-Panel-Bereich */
          height: 100%;
          min-height: 100vh;
        }

        /* Sliding-Container: beide Views nebeneinander */
        .slider {
          display: flex;
          width: 200%;
          height: 100%;
          min-height: 100vh;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          will-change: transform;
        }

        .slider.show-detail {
          transform: translateX(-50%);
        }

        .view {
          width: 50%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--primary-background-color, #f0f4f8);
          overflow: hidden;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ App-Layout (Desktop: Sidebar + Main) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .app-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        /* Desktop-Sidebar (wie HA-native Todo) */
        .sidebar {
          width: 256px;
          flex-shrink: 0;
          background: var(--card-background-color, #fff);
          border-right: 1px solid var(--divider-color, #e0e0e0);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 0.5rem 0 1rem;
          -webkit-user-select: none;
          user-select: none;
        }

        .sidebar-search {
          position: relative;
          padding: 0.5rem 0.75rem 0.75rem;
        }
        .sidebar-search input {
          width: 100%;
          padding: 0.55rem 2.2rem 0.55rem 0.75rem;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 10px;
          font-size: 0.9rem;
          box-sizing: border-box;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          outline: none;
          transition: border-color 0.15s;
        }
        .sidebar-search input:focus {
          border-color: var(--primary-color, #03a9f4);
        }
        .sidebar-search-icon {
          position: absolute;
          right: 1.1rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.4;
          pointer-events: none;
        }
        .sidebar-search-clear {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          font-size: 1rem;
          cursor: pointer;
          color: var(--secondary-text-color, #999);
          padding: 0.2rem 0.3rem;
          line-height: 1;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          cursor: pointer;
          border-radius: 0;
          margin: 0;
          color: var(--primary-text-color, #333);
          font-size: var(--ha-font-size-m, 0.875rem);
          font-family: var(--ha-font-family, Roboto, sans-serif);
          line-height: 1.5;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background 0.15s, transform 0.2s ease, box-shadow 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .sidebar-item:hover { background: var(--secondary-background-color, #f5f5f5); }
        .sidebar-item.drag-over {
          background: rgba(25, 118, 210, 0.12);
          box-shadow: inset 0 0 0 2px var(--primary-color, #1976d2);
          border-radius: 12px;
          transform: scale(1.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .sidebar-item.active {
          background: rgba(25, 118, 210, 0.12);
          color: var(--primary-color, #1976d2);
          font-weight: 500;
        }

        .sidebar-item-icon { flex-shrink: 0; opacity: 0.55; --mdc-icon-size: 20px; width: 20px; height: 20px; }
        .sidebar-item.active .sidebar-item-icon { opacity: 1; color: var(--primary-color, #1976d2); }

        .sidebar-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sidebar-item-badge {
          background: var(--secondary-background-color, #f0f0f0);
          color: var(--secondary-text-color, #666);
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 2px 8px;
          min-width: 20px;
          text-align: center;
          margin-left: auto;
        }
        .sidebar-drag-placeholder {
          background: var(--primary-color, #03a9f4);
          opacity: 0.15;
          border-radius: 8px;
          margin: 0;
          padding: 0;
        }

        .sidebar-new-list {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          margin-top: auto;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: var(--ha-font-size-m, 0.875rem);
          font-family: var(--ha-font-family, Roboto, sans-serif);
          color: var(--secondary-text-color, #666);
          -webkit-tap-highlight-color: transparent;
          transition: background 0.15s;
        }
        .sidebar-new-list:hover { background: var(--secondary-background-color, #f5f5f5); }
        .sidebar-new-list-icon {
          font-size: 1.2rem;
          font-weight: 300;
          width: 20px;
          text-align: center;
        }

        /* Main-Bereich rechts (Scrollbar nur hier) */
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          min-width: 0;
        }

        /* Mobile: Sidebar ausblenden */
        @media (max-width: 767px) {
          .sidebar { display: none; }
          /* Auf Mobile: Chevron im Titel sichtbar, Badge rechts */
          .title-chevron { display: inline; }
        }

        .header {
          display: flex;
          align-items: center;
          height: var(--header-height);
          background: var(--app-header-background-color);
          color: var(--app-header-text-color);
          border-bottom: var(--app-header-border-bottom);
          padding: 0;
          flex-shrink: 0;
          position: relative;
        }

        .header ha-icon-button {
          color: var(--app-header-text-color);
          --mdc-icon-button-size: var(--header-height);
        }

        .topbar-title {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-width: 0;
          height: var(--header-height);
          font-size: var(--app-header-font-size, var(--ha-font-size-xl));
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--header-height);
        }

        .app-title {
          display: none;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          position: absolute;
          left: calc(var(--ha-space-3) + var(--ha-space-6));
          max-width: 40%;
          font-size: var(--app-header-font-size, var(--ha-font-size-xl));
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--header-height);
        }

        .list-picker-wrap {
          position: relative;
          flex: 0 1 auto;
          display: flex;
          align-items: stretch;
          justify-content: center;
          min-width: 0;
          max-width: 100%;
        }

        .header-title-btn {
          background: none;
          border: none;
          color: var(--app-header-text-color);
          font: inherit;
          font-size: var(--app-header-font-size, var(--ha-font-size-xl));
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--ha-space-1);
          cursor: pointer;
          padding: 0 var(--ha-space-2);
          -webkit-tap-highlight-color: transparent;
          max-width: 100%;
          white-space: nowrap;
        }

        #header-title-text {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title-chevron { font-size: 0.85rem; opacity: 0.75; }

        .list-picker-dropdown {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--card-background-color, #fff);
          border-radius: 0 0 14px 14px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.22);
          z-index: 300;
          overflow: hidden;
        }

        .list-picker-dropdown.open { display: block; }

        .list-picker-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1.25rem;
          font-size: 1rem;
          color: var(--primary-text-color, #333);
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .list-picker-item + .list-picker-item {
          border-top: 1px solid var(--divider-color, #f0f0f0);
        }

        .list-picker-item:active { background: var(--secondary-background-color, #f5f5f5); }
        .list-picker-item.active { font-weight: 600; color: var(--primary-color, #1976d2); }
        .list-picker-check { margin-left: auto; font-size: 1.1rem; color: var(--primary-color, #1976d2); }

        .detail-header-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: var(--app-header-font-size, var(--ha-font-size-xl));
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--ha-space-1);
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          max-width: 50%;
          pointer-events: none;
        }

        .header-actions {
          display: flex;
          align-items: center;
          margin-left: auto;
        }

        .main-menu-wrap,
        .detail-menu-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .main-dropdown,
        .detail-dropdown {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--card-background-color);
          border-radius: var(--ha-border-radius-m);
          box-shadow: var(--ha-box-shadow-m);
          min-width: 220px;
          z-index: 500;
          overflow: hidden;
        }

        .main-dropdown.open,
        .detail-dropdown.open {
          display: block;
        }

        .main-dropdown button,
        .detail-dropdown button {
          display: flex;
          align-items: center;
          width: 100%;
          background: none;
          border: none;
          padding: var(--ha-space-3) var(--ha-space-4);
          font-size: var(--ha-font-size-m);
          cursor: pointer;
          text-align: left;
          color: var(--primary-text-color);
        }

        .main-dropdown button:hover,
        .detail-dropdown button:hover {
          background: var(--secondary-background-color);
        }

        /* Desktop: Chevron verstecken, Sidebar-Suche verstecken, mobilen Titel verstecken */
        @media (min-width: 768px) {
          .title-chevron { display: none; }
          .sidebar-search { display: none; }
          .list-picker-dropdown { display: none !important; }
          #menu-btn { display: none; }
          .app-title { display: block; }
          .header-title-btn { pointer-events: none; cursor: default; }
        }

        .header-title {
          flex: 1;
          font-size: var(--ha-font-size-xl);
          font-weight: var(--ha-font-weight-normal);
        }

        .header-badge {
          background: rgba(255,255,255,0.25);
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 2px 9px;
          margin-right: 16px;
        }

        .menu-danger {
          color: var(--error-color);
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Content ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .content {
          padding: 1.25rem 1rem;
          max-width: 520px;
          width: 100%;
          margin: 0 auto;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ List selector ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .list-select {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .list-select label { font-size: 0.85rem; color: var(--secondary-text-color, #666); white-space: nowrap; }
        .list-select select {
          flex: 1;
          padding: 0.45rem 0.75rem;
          border-radius: 8px;
          border: 1.5px solid var(--divider-color, #ddd);
          font-size: 0.95rem;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          cursor: pointer;
          outline: none;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Add row ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .add-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .add-row input {
          flex: 1;
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid var(--divider-color, #ddd);
          font-size: 1rem;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          outline: none;
          transition: border-color 0.2s;
        }
        .add-row input:focus { border-color: #1976d2; }
        .add-row button {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1.1rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s, transform 0.1s;
        }
        .add-row button:hover  { opacity: 0.88; }
        .add-row button:active { transform: scale(0.96); }
        .add-row button:disabled { opacity: 0.4; cursor: default; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Todo items ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .todo-list {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
          min-width: 0;
          position: relative;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Drag & Drop ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .dragging-source {
          opacity: 0.92;
          box-shadow: 0 8px 24px rgba(0,0,0,0.22);
          border-radius: 12px;
        }
        .drag-placeholder {
          border-radius: 12px;
          background: var(--divider-color, #e0e0e0);
          opacity: 0.5;
          list-style: none;
          transition: height 0.2s ease;
        }
        .todo-item { user-select: none; -webkit-user-select: none; }

        .swipe-wrapper {
          position: relative;
          border-radius: 12px;
          min-width: 0;
          width: 100%;
          transition: transform 0.2s ease;
        }

        /* Roter LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶sch-Button hinter dem Item */
        .delete-action {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 80px;
          background: #e53935;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 3px;
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          /* Initial nicht sichtbar und nicht klickbar */
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
        }

        /* Sichtbar wenn Wrapper die Klasse .open hat */
        .swipe-wrapper.open .delete-action {
          opacity: 1;
          pointer-events: auto;
        }

        .delete-action svg {
          display: block;
        }

        .todo-item {
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 0.9rem;
          touch-action: pan-y;
          user-select: none;
          will-change: transform;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(.4,0,.2,1);
          position: relative;
          z-index: 1;
          min-width: 0;
          overflow: hidden;
        }

        /* Item ist geÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶ffnet (LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen-Button sichtbar) */
        .todo-item.revealed {
          transform: translateX(-80px);
          transition: transform 0.25s cubic-bezier(.4,0,.2,1);
        }

        .check-circle {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 2px solid #90caf9;
          background: var(--card-background-color, #fff);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          z-index: 1;
        }
        .check-circle.done { background: #1976d2; border-color: #1976d2; }
        .check-circle.done::after { content: 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ'; color: #fff; font-size: 0.78rem; font-weight: 700; }

        .todo-body { flex: 1; min-width: 0; }

        .todo-text {
          font-size: 1.1rem;
          color: var(--primary-text-color, #333);
          word-break: break-word;
        }
        .todo-text.done { text-decoration: line-through; color: var(--secondary-text-color, #aaa); }

        .todo-note-preview {
          font-size: 0.875rem;
          color: var(--secondary-text-color, #999);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          display: block;
        }

        @media (min-width: 768px) {
          .todo-text { font-size: 0.95rem; }
          .todo-note-preview { font-size: 0.78rem; }
        }

        .due-date { font-size: 0.73rem; color: var(--secondary-text-color, #888); margin-top: 2px; }

        .chevron {
          color: var(--secondary-text-color, #bbb);
          flex-shrink: 0;
          font-size: 1rem;
        }

        .del-btn {
          background: none;
          border: none;
          color: #e57373;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.3rem 0.4rem;
          border-radius: 6px;
          flex-shrink: 0;
          transition: background 0.15s;
          line-height: 1;
          z-index: 1;
        }
        .del-btn:hover { background: #ffebee; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ States ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .empty { text-align: center; color: var(--secondary-text-color, #aaa); padding: 2rem 0; font-size: 0.95rem; }

        .completed-section-label {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin: 0.5rem 0 0.2rem;
          padding: 0.2rem 0.2rem;
          color: var(--secondary-text-color, #777);
          font-size: var(--ha-font-size-s);
          font-weight: var(--ha-font-weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .completed-section-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .completed-section-delete {
          color: var(--secondary-text-color, #777);
          --mdc-icon-button-size: 32px;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Custom Dialog ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .dialog-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 9999;
          align-items: center;
          justify-content: center;
        }
        .dialog-overlay.open { display: flex; }
        .dialog-box {
          background: var(--card-background-color, #fff);
          border-radius: 16px;
          padding: 1.5rem;
          width: 90%;
          max-width: 400px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .ei-tab {
          flex: 1;
          padding: 0.5rem 1rem;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          background: none;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .ei-tab.active {
          background: var(--primary-color, #1976d2);
          color: #fff;
          border-color: var(--primary-color, #1976d2);
        }
        .dialog-box h3 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--primary-text-color, #333);
        }
        .dialog-box input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid var(--divider-color, #ddd);
          font-size: 1rem;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .dialog-box input:focus { border-color: #1976d2; }

        /* Icon Picker */
        .icon-picker-section {
          margin-top: 1rem;
        }
        .icon-picker-section label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--secondary-text-color, #666);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .icon-picker-section ha-icon-picker {
          display: block;
          width: 100%;
        }

        .dialog-btn-row {
          display: flex;
          gap: 0.6rem;
          margin-top: 1.2rem;
          justify-content: flex-end;
        }
        .dialog-btn-row button {
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .dialog-btn-cancel {
          background: var(--secondary-background-color, #f0f0f0);
          color: var(--primary-text-color, #333);
        }
        .dialog-btn-confirm {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: #fff;
        }
        .dialog-btn-confirm:disabled { opacity: 0.4; cursor: default; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Reorder Dialog ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .reorder-list {
          list-style: none;
          margin: 0.5rem 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 50vh;
          overflow-y: auto;
        }
        .reorder-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.8rem;
          border-radius: 10px;
          background: var(--secondary-background-color, #f5f5f5);
          cursor: default;
          user-select: none;
          -webkit-user-select: none;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .reorder-item:active { cursor: default; }
        .reorder-item.dragging {
          background: var(--card-background-color, #fff);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          z-index: 10;
        }
        .reorder-item ha-icon { --mdc-icon-size: 20px; opacity: 0.6; flex-shrink: 0; }
        .reorder-item-name { flex: 1; font-size: 0.95rem; color: var(--primary-text-color, #333); }
        .reorder-handle {
          color: var(--secondary-text-color, #999);
          flex-shrink: 0;
          cursor: grab;
          touch-action: none;
        }
        .reorder-handle:active { cursor: grabbing; }
        .reorder-placeholder {
          list-style: none;
          border-radius: 10px;
          background: var(--primary-color, #03a9f4);
          opacity: 0.15;
          margin: 0;
          padding: 0;
        }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Detail Panel ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .detail-content {
          padding: 1.25rem 1rem;
          flex: 1;
          overflow-y: auto;
          max-width: 520px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-editform {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--secondary-text-color, #666);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-field input,
        .detail-field textarea {
          width: 100%;
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid var(--divider-color, #ddd);
          font-size: 1rem;
          font-family: inherit;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          outline: none;
          transition: border-color 0.2s;
          resize: none;
          min-height: 3rem;
          box-sizing: border-box;
        }

        .detail-field input:focus,
        .detail-field textarea:focus { border-color: #1976d2; }

        .detail-field textarea {
          min-height: 320px;
          line-height: 1.6;
        }

        /* Datum + Uhrzeit nebeneinander */
        .due-row {
          display: flex;
          gap: 0.6rem;
        }

        .due-row .detail-field { flex: 1; }

        /* Datum/Zeit-Input: Kalender-Icon in HA-Farbe */
        .detail-field input[type="date"],
        .detail-field input[type="time"] {
          -webkit-appearance: none;
          appearance: none;
          color-scheme: light;
          min-height: 3rem;
          /* Sicherstellen dass leere Felder gleich hoch sind wie befÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼llte */
          min-width: 0;
        }

        /* Placeholder-Farbe fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r leere date/time Inputs (iOS zeigt sonst nichts) */
        .detail-field input[type="date"]:not(:valid),
        .detail-field input[type="time"]:not(:valid) {
          color: var(--secondary-text-color, #aaa);
        }

        /* Clear-Button neben Datum */
        .due-clear-btn {
          background: none;
          border: none;
          color: var(--secondary-text-color, #aaa);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.4rem;
          align-self: flex-end;
          margin-bottom: 0.15rem;
          border-radius: 6px;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .due-clear-btn:hover { color: #e53935; }

        #detail-due-hint {
          font-size: 0.78rem;
          color: var(--secondary-text-color, #999);
          margin-top: -0.4rem;
        }

        .detail-btn-row {
          display: flex;
          gap: 0.75rem;
        }
        .detail-save-btn {
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 0.85rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
          transition: opacity 0.2s;
        }
        .detail-save-btn:disabled { opacity: 0.5; cursor: default; }
        .detail-save-btn:active { opacity: 0.85; }
        .detail-cancel-btn {
          background: var(--secondary-background-color, #f0f0f0);
          color: var(--primary-text-color, #333);
          border: none;
          border-radius: 12px;
          padding: 0.85rem 1.2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .detail-cancel-btn:active { opacity: 0.7; }

        /* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Readonly View ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
        .detail-readonly {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .view-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--primary-text-color, #222);
          line-height: 1.3;
          word-break: break-word;
        }

        .view-section-value {
          font-size: 1rem;
          color: var(--primary-text-color, #333);
          line-height: 1.6;
          word-break: break-word;
          white-space: pre-wrap;
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid var(--divider-color, #ddd);
          background: var(--card-background-color, #fff);
          box-sizing: border-box;
        }

        .view-modified-value {
          font-size: 1rem;
          color: var(--secondary-text-color, #888);
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid var(--divider-color, #ddd);
          background: var(--card-background-color, #fff);
          box-sizing: border-box;
        }

        .view-section-value a {
          color: #1976d2;
          text-decoration: underline;
          word-break: break-all;
        }

      </style>

      <!-- Slider-Wrapper: Liste links, Detail rechts -->
      <div class="slider" id="slider">

      <!-- ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Listenansicht ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ -->
      <div class="view" id="list-view">
        <div class="header" id="list-header">
          <ha-icon-button id="menu-btn" label="MenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼">
            <ha-icon icon="mdi:menu"></ha-icon>
          </ha-icon-button>
          <span class="app-title">To-Do (${PANEL_VERSION})</span>
          <div class="topbar-title">
            <div class="list-picker-wrap" id="list-picker-wrap">
              <button class="header-title-btn" id="header-title-btn">
                <ha-icon id="header-title-icon" icon="mdi:clipboard-list"></ha-icon>
                <span id="header-title-text">To Do</span>
                <span class="title-chevron" id="title-chevron">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¾</span>
              </button>
              <div class="list-picker-dropdown" id="list-picker-dropdown"></div>
            </div>
          </div>
          <ha-icon-button id="search-btn" label="Suchen">
            <ha-icon icon="mdi:magnify"></ha-icon>
          </ha-icon-button>
          <div class="main-menu-wrap">
            <ha-icon-button id="main-menu-btn" label="Mehr">
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button>
            <div class="main-dropdown" id="main-dropdown">
              <button id="new-list-btn">Neue Liste erstellen</button>
              <button id="list-detail-btn">Detailansicht</button>
              <button id="rename-list-btn">Liste umbenennen</button>
              <button id="reorder-list-btn">Reihenfolge ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndern</button>
              <button id="delete-list-btn" class="menu-danger">Liste lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen</button>
              <button id="export-import-btn">Export / Import</button>
            </div>
          </div>
        </div>

        <!-- App-Layout: Sidebar (Desktop) + Hauptbereich -->
        <div class="app-layout">
          <div class="sidebar" id="sidebar"></div>

          <div class="main-area">
            <div class="content">
              <div class="add-row">
                <input id="new-input" type="text" placeholder="Aufgabe hinzufÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼genÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦" />
                <button id="add-btn" disabled style="font-size:1.5rem;line-height:1;padding:0.4rem 0.9rem;">ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¼ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹</button>
              </div>

              <ul class="todo-list" id="todo-list"></ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Detailansicht ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ -->
      <div class="view" id="detail-panel">
        <div class="header detail-header-bar">
          <ha-icon-button id="detail-back-btn" label="ZurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ck">
            <ha-icon icon="mdi:arrow-left"></ha-icon>
          </ha-icon-button>
          <span class="detail-header-title" id="detail-header-title"></span>
          <div class="header-actions">
            <ha-icon-button id="detail-edit-btn" label="Bearbeiten" style="display:none">
              <ha-icon icon="mdi:pencil"></ha-icon>
            </ha-icon-button>
            <div class="detail-menu-wrap">
              <ha-icon-button id="detail-menu-btn" label="Mehr">
                <ha-icon icon="mdi:dots-vertical"></ha-icon>
              </ha-icon-button>
              <div class="detail-dropdown" id="detail-dropdown">
                <button id="detail-delete-btn" class="menu-danger">Eintrag lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen</button>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-content">

          <!-- ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Readonly-Ansicht ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ -->
          <div class="detail-readonly">
            <div class="view-title" id="view-title"></div>
            <div class="detail-field" id="view-notes-section" style="display:none">
              <label>Notizen</label>
              <div class="view-section-value" id="view-notes"></div>
            </div>
            <div class="detail-field" id="view-due-section" style="display:none">
              <label>FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤lligkeit</label>
              <div class="view-section-value" id="view-due"></div>
            </div>
            <div class="detail-field" id="view-modified-section" style="display:none">
              <label>Erstellt</label>
              <div class="view-section-value view-modified-value" id="view-modified"></div>
            </div>
          </div>

          <!-- ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Bearbeitungsformular ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ -->
          <div class="detail-editform">
            <div class="detail-field">
              <label>Titel</label>
              <input id="detail-title" type="text" />
            </div>
            <div class="detail-field">
              <label>Notizen</label>
              <textarea id="detail-notes" placeholder="Zusatzinformationen eingebenÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦"></textarea>
            </div>
            <div class="due-row">
              <div class="detail-field">
                <label>FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤lligkeitsdatum</label>
                <input id="detail-due-date" type="date" />
              </div>
              <div class="detail-field">
                <label>Uhrzeit</label>
                <input id="detail-due-time" type="time" />
              </div>
              <button class="due-clear-btn" id="detail-due-clear" title="Datum lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢</button>
            </div>
            <div id="detail-error" style="display:none;color:#c62828;background:#ffebee;border-radius:8px;padding:0.6rem 0.9rem;font-size:0.88rem;margin-bottom:0.5rem;"></div>
            <div class="detail-field" id="edit-modified-section" style="display:none">
              <label>Erstellt</label>
              <div class="view-section-value view-modified-value" id="edit-modified"></div>
            </div>
            <div class="detail-btn-row">
              <button class="detail-save-btn" id="detail-save">Speichern</button>
              <button class="detail-cancel-btn" id="detail-cancel">Abbruch</button>
            </div>
          </div>

        </div>
      </div>

      </div><!-- /slider -->

      <!-- Custom Dialog -->
      <div class="dialog-overlay" id="dialog-overlay">
        <div class="dialog-box" id="dialog-box">
          <h3 id="dialog-title">Neue Liste</h3>
          <input id="dialog-input" type="text" placeholder="Name der ListeÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦" />
          <div class="icon-picker-section" id="icon-picker-section">
            <label>Symbol</label>
            <ha-icon-picker id="dialog-icon-picker"></ha-icon-picker>
          </div>
          <div class="dialog-btn-row">
            <button class="dialog-btn-cancel" id="dialog-cancel">Abbruch</button>
            <button class="dialog-btn-confirm" id="dialog-confirm" disabled>Erstellen</button>
          </div>
        </div>
      </div>
    `;
  }

  _bindStaticEvents() {
    const input  = this.shadowRoot.getElementById('new-input');
    const addBtn = this.shadowRoot.getElementById('add-btn');

    input.addEventListener('input', e => {
      this._newText   = e.target.value;
      addBtn.disabled = !this._newText.trim();
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') this._addTodo(); });
    addBtn.addEventListener('click', () => this._addTodo());

    this.shadowRoot.getElementById('menu-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('hass-toggle-menu', { bubbles: true, composed: true }));
    });

    // Mobile: Listenwechsel ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ber Header-Titel
    const titleBtn   = this.shadowRoot.getElementById('header-title-btn');
    const pickerDrop = this.shadowRoot.getElementById('list-picker-dropdown');
    titleBtn.addEventListener('click', e => {
      e.stopPropagation();
      pickerDrop.classList.toggle('open');
    });

    // Drei-Punkte-MenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ (Listenansicht)
    const mainMenuBtn  = this.shadowRoot.getElementById('main-menu-btn');
    const mainDropdown = this.shadowRoot.getElementById('main-dropdown');
    mainMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      mainDropdown.classList.toggle('open');
    });

    // Such-Button (im MenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼)
    this.shadowRoot.getElementById('search-btn').addEventListener('click', () => {
      mainDropdown.classList.remove('open');
      this._showSearch();
    });
    this.shadowRoot.getElementById('new-list-btn').addEventListener('click', async () => {
      mainDropdown.classList.remove('open');
      const result = await this._showDialog('Neue Liste', 'Name der ListeÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦', 'Erstellen');
      if (!result?.name) return;
      try {
        const step1 = await this._hass.callApi('POST', 'config/config_entries/flow', {
          handler: 'local_todo',
          show_advanced_options: false,
        });
        if (!step1?.flow_id) throw new Error('Kein flow_id erhalten');
        this._waitingForNewList = new Set(this._lists.map(l => l.id));
        this._pendingNewListIcon = result.icon;
        await this._hass.callApi('POST', `config/config_entries/flow/${step1.flow_id}`, {
          todo_list_name: result.name,
        });
      } catch(e) {
        console.error('create list error', e);
        alert('Fehler beim Erstellen: ' + (e?.message ?? JSON.stringify(e)));
      }
    });

    this.shadowRoot.getElementById('list-detail-btn').addEventListener('click', () => {
      mainDropdown.classList.remove('open');
      if (!this._selected) return;
      const event = new Event('hass-more-info', { bubbles: true, composed: true });
      event.detail = { entityId: this._selected };
      this.dispatchEvent(event);
    });

    this.shadowRoot.getElementById('rename-list-btn').addEventListener('click', async () => {
      mainDropdown.classList.remove('open');
      if (!this._selected) return;
      const currentList = this._lists.find(l => l.id === this._selected);
      if (!currentList) return;
      const result = await this._showDialog('Liste umbenennen', 'Neuer NameÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦', 'Speichern', { showIconPicker: true, defaultValue: currentList.name, defaultIcon: currentList.icon });
      if (!result?.name) return;
      try {
        await this._hass.callWS({
          type: 'config/entity_registry/update',
          entity_id: this._selected,
          name: result.name,
          icon: result.icon,
        });
      } catch(e) {
        console.error('rename error', e);
        alert('Fehler beim Umbenennen: ' + (e?.message ?? JSON.stringify(e)));
      }
    });

    this.shadowRoot.getElementById('reorder-list-btn').addEventListener('click', async () => {
      mainDropdown.classList.remove('open');
      await this._showReorderDialog();
    });

    this.shadowRoot.getElementById('delete-list-btn').addEventListener('click', async () => {
      mainDropdown.classList.remove('open');
      if (!this._selected) return;
      const listName = this._lists.find(l => l.id === this._selected)?.name ?? this._selected;
      const confirmed = await this._showConfirm(
        'Liste lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen',
        `ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾${listName}" wirklich lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen?\nDieser Vorgang kann nicht rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ckgÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ngig gemacht werden.`,
        'LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen'
      );
      if (!confirmed) return;
      try {
        // Korrekter WS-Type laut HA-Source: config/entity_registry/get
        const entry = await this._hass.callWS({
          type: 'config/entity_registry/get',
          entity_id: this._selected,
        });
        if (!entry?.config_entry_id) {
          alert('Diese Liste kann nicht gelÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶scht werden (kein Config-Eintrag gefunden).');
          return;
        }
        // Korrekter Aufruf laut HA-Source: callApi DELETE
        await this._hass.callApi('DELETE', `config/config_entries/entry/${entry.config_entry_id}`);
        const remaining = this._lists.filter(l => l.id !== this._selected);
        this._selected = remaining[0]?.id ?? '';
        this._todos = [];
        if (this._selected) this._subscribeItems();
        else this._renderList();
      } catch(e) {
        alert('Fehler beim LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen: ' + (e?.message ?? JSON.stringify(e)));
      }
    });

    this.shadowRoot.getElementById('export-import-btn').addEventListener('click', () => {
      mainDropdown.classList.remove('open');
      this._showExportImportDialog();
    });

    this.shadowRoot.getElementById('detail-back-btn').addEventListener('click', () => {
      if (this._detailEditMode) {
        this._saveDetail(true); // speichern + zurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ck zur ÃƒÆ’Ã†â€™Ãƒâ€¦Ã¢â‚¬Å“bersicht
      } else {
        this._closeDetail();
      }
    });
    this.shadowRoot.getElementById('detail-edit-btn').addEventListener('click', () => this._enterEditMode());
    this.shadowRoot.getElementById('detail-save').addEventListener('click', () => this._saveDetail());
    this.shadowRoot.getElementById('detail-cancel').addEventListener('click', () => {
      if (this._detailTodo?.description || this._detailTodo?.due) {
        // Hat bereits Daten ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ zurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ck zur Readonly-Ansicht
        this._detailEditMode = false;
        this._renderDetailMode();
      } else {
        // Neuer Eintrag ohne Daten ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Detail schlieÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸en
        this._closeDetail();
      }
    });
    this.shadowRoot.getElementById('detail-due-clear').addEventListener('click', () => {
      this.shadowRoot.getElementById('detail-due-date').value = '';
      this.shadowRoot.getElementById('detail-due-time').value = '';
    });

    const menuBtn    = this.shadowRoot.getElementById('detail-menu-btn');
    const dropdown   = this.shadowRoot.getElementById('detail-dropdown');
    const deleteBtn  = this.shadowRoot.getElementById('detail-delete-btn');

    menuBtn.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    deleteBtn.addEventListener('click', () => {
      dropdown.classList.remove('open');
      const uid = this._detailTodo?.uid;
      if (!uid) return;
      this._closeDetail();
      this._animateAndDelete(uid);
    });

    // Klick auÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸erhalb ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ alle Dropdowns schlieÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â¸en + Swipe-Buttons zuklappen
    this.shadowRoot.addEventListener('click', e => {
      pickerDrop.classList.remove('open');
      mainDropdown.classList.remove('open');
      dropdown.classList.remove('open');
      if (!e.target.closest('.delete-action') && !e.target.closest('.todo-item')) {
        this._closeAllRevealed(null);
      }
    });
  }

  _renderSidebar() {
    const sidebar  = this.shadowRoot.getElementById('sidebar');
    const dropdown = this.shadowRoot.getElementById('list-picker-dropdown');
    const chevron  = this.shadowRoot.getElementById('title-chevron');
    if (!sidebar) return;

    // Offene Items pro Liste aus hass.states lesen (best-effort)
    const openPerList = id => {
      const state = this._hass?.states?.[id];
      // Versuche verschiedene Attribute
      const count = state?.attributes?.items_not_completed
        ?? state?.attributes?.pending_items
        ?? parseInt(state?.state, 10);
      return isNaN(count) ? 0 : count;
    };

    // Sidebar-Items (Desktop) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ direkt die Items, kein Heading
    sidebar.innerHTML = `
      <div class="sidebar-search">
        <input type="text" id="sidebar-search-input" placeholder="Suchen" />
        <button class="sidebar-search-clear" id="sidebar-search-clear" style="display:none;">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢</button>
        <svg class="sidebar-search-icon" id="sidebar-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>
    ` + this._lists.map(l => {
      const open = openPerList(l.id);
      return `
        <button class="sidebar-item${l.id === this._selected ? ' active' : ''}" data-id="${l.id}">
          <ha-icon class="sidebar-item-icon" icon="${l.icon}"></ha-icon>
          <span class="sidebar-item-name">${this._esc(l.name)}</span>
          ${open > 0 ? `<span class="sidebar-item-badge">${open}</span>` : ''}
        </button>`;
    }).join('') + `
      <button class="sidebar-new-list" id="sidebar-new-list-btn">
        <span class="sidebar-new-list-icon">+</span>
        <span>Neue Liste</span>
      </button>`;

    // Sidebar-Suche
    const searchInput = this.shadowRoot.getElementById('sidebar-search-input');
    const searchClear = this.shadowRoot.getElementById('sidebar-search-clear');
    const searchIcon = this.shadowRoot.getElementById('sidebar-search-icon');
    if (searchInput) {
      // Vorherigen Wert wiederherstellen
      if (this._sidebarSearchQuery) {
        searchInput.value = this._sidebarSearchQuery;
        searchClear.style.display = '';
        searchIcon.style.display = 'none';
      }
      searchInput.addEventListener('input', () => {
        this._sidebarSearchQuery = searchInput.value;
        const hasText = searchInput.value.length > 0;
        searchClear.style.display = hasText ? '' : 'none';
        searchIcon.style.display = hasText ? 'none' : '';
        this._doSidebarSearch(searchInput.value.trim());
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          this._sidebarSearchQuery = '';
          searchClear.style.display = 'none';
          searchIcon.style.display = '';
          this._doSidebarSearch('');
        }
      });
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this._sidebarSearchQuery = '';
        searchClear.style.display = 'none';
        searchIcon.style.display = '';
        this._doSidebarSearch('');
        searchInput.focus();
      });
    }

    // "+ Neue Liste" Button
    this.shadowRoot.getElementById('sidebar-new-list-btn')?.addEventListener('click', () => {
      this._createNewList();
    });

    // Klick auf Sidebar-Item
    sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._sidebarDragJustEnded) { this._sidebarDragJustEnded = false; return; }
        this._selectList(btn.dataset.id);
      });

      // Long-Press Drag fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Reihenfolge
      const startDrag = (clientY) => {
        if (this._sidebarDragId) return;
        this._sidebarDragId = btn.dataset.id;
        if (navigator.vibrate) navigator.vibrate(40);

        const rect = btn.getBoundingClientRect();
        // Ghost
        const ghost = btn.cloneNode(true);
        ghost.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;margin:0;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0.95;transition:none;pointer-events:none;list-style:none;border-radius:8px;background:var(--card-background-color,#fff);display:flex;align-items:center;gap:0.75rem;padding:0.7rem 1rem;`;
        this.shadowRoot.appendChild(ghost);
        this._sidebarGhost = ghost;

        // Placeholder
        const ph = document.createElement('div');
        ph.className = 'sidebar-drag-placeholder';
        ph.style.height = rect.height + 'px';
        btn.replaceWith(ph);
        this._sidebarPh = ph;
        this._sidebarDragBtn = btn;

        this._sidebarDragOffsetY = clientY - rect.top;
      };

      // Mouse
      let mouseTimer = null;
      btn.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const startY = e.clientY;
        let moved = false;

        const onMove = (ev) => {
          if (!this._sidebarDragId) {
            if (Math.hypot(ev.clientX - e.clientX, ev.clientY - startY) > 5) {
              clearTimeout(mouseTimer);
              cleanup();
            }
            return;
          }
          this._updateSidebarGhost(ev.clientY);
        };
        const onUp = () => {
          clearTimeout(mouseTimer);
          cleanup();
          if (this._sidebarDragId) {
            this._sidebarDragJustEnded = true;
            this._endSidebarDrag();
          }
        };
        const cleanup = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);

        mouseTimer = setTimeout(() => startDrag(startY), 400);
      });

      // Touch
      let touchTimer = null;
      let touchStartY = 0;
      btn.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchTimer = setTimeout(() => {
          e.preventDefault();
          startDrag(touchStartY);
        }, 400);
      }, { passive: false });
      btn.addEventListener('touchmove', (e) => {
        if (this._sidebarDragId) {
          e.preventDefault();
          this._updateSidebarGhost(e.touches[0].clientY);
        } else if (Math.abs(e.touches[0].clientY - touchStartY) > 5) {
          clearTimeout(touchTimer);
        }
      }, { passive: false });
      btn.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
        if (this._sidebarDragId) {
          this._sidebarDragJustEnded = true;
          this._endSidebarDrag();
        }
      });
    });

    // Dropdown (Mobile Header) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ nur relevant wenn mehrere Listen vorhanden
    if (chevron) chevron.style.display = this._lists.length > 1 ? '' : 'none';
    dropdown.innerHTML = this._lists.map(l => `
      <button class="list-picker-item${l.id === this._selected ? ' active' : ''}" data-id="${l.id}">
        <ha-icon icon="${l.icon}" style="opacity:0.5;flex-shrink:0;--mdc-icon-size:20px"></ha-icon>
        <span style="flex:1">${this._esc(l.name)}</span>
        ${l.id === this._selected ? '<span class="list-picker-check">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ</span>' : ''}
      </button>
    `).join('');

    dropdown.querySelectorAll('.list-picker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selectList(btn.dataset.id);
        dropdown.classList.remove('open');
      });
    });
  }

  _updateSidebarGhost(clientY) {
    if (!this._sidebarGhost) return;
    this._sidebarGhost.style.top = (clientY - this._sidebarDragOffsetY) + 'px';

    // Placeholder verschieben
    const sidebar = this.shadowRoot.getElementById('sidebar');
    const items = [...sidebar.querySelectorAll('.sidebar-item')];    const ghostMid = clientY;
    let targetIdx = items.length;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (ghostMid < r.top + r.height / 2) { targetIdx = i; break; }
    }
    const ph = this._sidebarPh;
    if (!ph) return;
    if (targetIdx >= items.length) {
      sidebar.appendChild(ph);
    } else {
      sidebar.insertBefore(ph, items[targetIdx]);
    }
    this._sidebarTargetIdx = targetIdx;
  }

  _endSidebarDrag() {
    if (!this._sidebarDragId) return;
    const dragId = this._sidebarDragId;

    // Cleanup
    if (this._sidebarGhost) { this._sidebarGhost.remove(); this._sidebarGhost = null; }
    if (this._sidebarPh) { this._sidebarPh.remove(); this._sidebarPh = null; }
    this._sidebarDragBtn = null;
    this._sidebarDragId = null;

    // Neue Reihenfolge berechnen
    const sidebar = this.shadowRoot.getElementById('sidebar');
    const buttons = [...sidebar.querySelectorAll('.sidebar-item')];
    const currentOrder = buttons.map(b => b.dataset.id);

    // Drag-Item aus alter Position entfernen und an neuer einfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼gen
    const oldIdx = this._lists.findIndex(l => l.id === dragId);
    let newIdx = this._sidebarTargetIdx ?? oldIdx;
    if (oldIdx === -1) return;

    const newOrder = this._lists.map(l => l.id).filter(id => id !== dragId);
    // targetIdx bezieht sich auf sichtbare Items (ohne das versteckte Original)
    // also ist es bereits die korrekte EinfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼geposition im gefilterten Array
    newOrder.splice(Math.min(newIdx, newOrder.length), 0, dragId);

    // Speichern und Sidebar neu rendern
    localStorage.setItem('todo_list_order', JSON.stringify(newOrder));
    // _lists neu sortieren
    this._lists.sort((a, b) => {
      const ai = newOrder.indexOf(a.id);
      const bi = newOrder.indexOf(b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    this._renderSidebar();
  }

  async _doSidebarSearch(query) {
    const mainArea = this.shadowRoot.querySelector('.main-area .content');
    const todoList = this.shadowRoot.getElementById('todo-list');
    const addRow = this.shadowRoot.querySelector('.add-row');
    if (!mainArea) return;

    if (!query || query.length < 2) {
      // Suche beenden, normale Ansicht wiederherstellen
      if (this._sidebarSearchActive) {
        this._sidebarSearchActive = false;
        if (addRow) addRow.style.display = '';
        if (todoList) todoList.style.display = '';
        const oldResults = this.shadowRoot.getElementById('sidebar-search-results');
        if (oldResults) oldResults.remove();
        // Header-Titel zurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼cksetzen
        const titleEl = this.shadowRoot.getElementById('header-title-text');
        const currentList = this._lists.find(l => l.id === this._selected);
        if (titleEl) titleEl.textContent = currentList?.name ?? 'To Do';
        this._renderList();
      }
      return;
    }

    // Items laden falls nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶tig
    if (!this._searchAllItems || this._searchAllItems.length === 0) {
      this._searchAllItems = [];
      for (const list of this._lists) {
        const items = await new Promise((resolve) => {
          let done = false;
          this._hass.connection.subscribeMessage(
            (msg) => { if (!done && msg.items) { done = true; resolve(msg.items); } },
            { type: 'todo/item/subscribe', entity_id: list.id }
          ).then(unsub => { setTimeout(() => { if (!done) { done = true; resolve([]); } unsub(); }, 5000); });
        });
        for (const item of items) {
          this._searchAllItems.push({ ...item, listId: list.id, listName: list.name });
        }
      }
    }

    const q = query.toLowerCase();
    const matches = this._searchAllItems.filter(item =>
      item.summary.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );

    this._sidebarSearchActive = true;
    if (addRow) addRow.style.display = 'none';
    if (todoList) todoList.style.display = 'none';
    // Header-Titel auf "Suche" setzen
    const titleEl = this.shadowRoot.getElementById('header-title-text');
    if (titleEl) titleEl.textContent = 'Suche';

    let resultsEl = this.shadowRoot.getElementById('sidebar-search-results');
    if (!resultsEl) {
      resultsEl = document.createElement('div');
      resultsEl.id = 'sidebar-search-results';
      resultsEl.style.cssText = 'padding:0 0.5rem;overflow-y:auto;flex:1;';
      mainArea.appendChild(resultsEl);
    }

    if (matches.length === 0) {
      resultsEl.innerHTML = '<div style="padding:1.5rem 0.5rem;color:var(--secondary-text-color,#999);font-size:0.9rem;">Keine Ergebnisse.</div>';
      return;
    }

    resultsEl.innerHTML = `<div style="padding:0.5rem 0.5rem 0.25rem;font-size:0.8rem;color:var(--secondary-text-color,#999);">${matches.length} Ergebnis${matches.length > 1 ? 'se' : ''}</div>
      <ul class="todo-list" style="margin:0;padding:0;">` +
      matches.slice(0, 50).map(item => `
        <li class="swipe-wrapper search-result-li" data-uid="${item.uid}" data-list="${item.listId}">
          <div class="todo-item">
            <div class="check-circle ${item.status === 'completed' ? 'done' : ''}"></div>
            <div class="todo-body">
              <div class="todo-text ${item.status === 'completed' ? 'done' : ''}">${this._esc(item.summary)}</div>
              <div class="todo-note-preview">${this._esc(item.listName)}</div>
            </div>
            <span class="chevron">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âº</span>
          </div>
        </li>
      `).join('') + '</ul>';

    resultsEl.querySelectorAll('.search-result-li').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.dataset.uid;
        const listId = el.dataset.list;
        this._searchReturnToResults = true;

        const item = this._searchAllItems.find(i => i.uid === uid && i.listId === listId);
        if (item) {
          this._detailTodo = item;
          this._detailEditMode = false;
          this._selected = listId;
          this._showDetail();
        }
      });
    });
  }

  async _createNewList() {
    const result = await this._showDialog('Neue Liste', 'Name der ListeÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦', 'Erstellen');
    if (!result?.name) return;
    try {
      const step1 = await this._hass.callApi('POST', 'config/config_entries/flow', {
        handler: 'local_todo',
        show_advanced_options: false,
      });
      if (!step1?.flow_id) throw new Error('Kein flow_id erhalten');
      this._waitingForNewList = new Set(this._lists.map(l => l.id));
      this._pendingNewListIcon = result.icon;
      await this._hass.callApi('POST', `config/config_entries/flow/${step1.flow_id}`, {
        todo_list_name: result.name,
      });
    } catch(e) {
      console.error('create list error', e);
      alert('Fehler beim Erstellen: ' + (e?.message ?? JSON.stringify(e)));
    }
  }

  _selectList(id) {
    if (id === this._selected) return;
    this._selected = id;
    localStorage.setItem('todo_selected_list', id);
    this._todos = [];
    this._pauseSubscription = false;
    this._subscribeItems();
  }

  _renderList() {
    // Header-Titel + Sidebar aktualisieren
    const currentList = this._lists.find(l => l.id === this._selected);
    const titleEl = this.shadowRoot.getElementById('header-title-text');
    if (titleEl && !this._sidebarSearchActive && !this._searchActive) {
      titleEl.textContent = currentList?.name ?? 'To Do';
    }
    const titleIcon = this.shadowRoot.getElementById('header-title-icon');
    if (titleIcon && !this._sidebarSearchActive && !this._searchActive) {
      titleIcon.setAttribute('icon', currentList?.icon ?? 'mdi:clipboard-list');
    }

    this._renderSidebar();

    const ul = this.shadowRoot.getElementById('todo-list');
    if (!ul) return;

    // Spinner nur beim ersten Laden (noch keine Items im DOM)
    if (this._loading && this._todos.length === 0) {
      ul.innerHTML = '';
      return;
    }
    if (!this._loading && this._todos.length === 0) {
      ul.innerHTML = '<li class="empty">Keine To-Dos</li>';
      return;
    }

    // Marker fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r ersten erledigten Block
    const firstCompleted = this._todos.find(t => t.status === 'completed');

    // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Keyed Reconciliation: kein kompletter DOM-Neuaufbau ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
    // Bestehende <li> nach uid indexieren
    const existing = new Map();
    ul.querySelectorAll('li.swipe-wrapper[data-uid]').forEach(li => {
      existing.set(li.dataset.uid, li);
    });

    const newUids = new Set(this._todos.map(t => t.uid));

    // 1) Entfernen was nicht mehr in der Liste ist
    existing.forEach((li, uid) => {
      if (!newUids.has(uid)) li.remove();
    });

    // 2) EinfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼gen/Verschieben/Aktualisieren in richtiger Reihenfolge
    let refNode = null; // Element nach dem eingefÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼gt wird (null = prepend)
    for (const todo of this._todos) {
      const contentKey = `${todo.summary}|${todo.status}|${todo.description ?? ''}|${todo.due ?? ''}`;
      let li = existing.get(todo.uid);

      if (!li) {
        // Neues Element erzeugen
        li = document.createElement('li');
        li.className = 'swipe-wrapper';
        li.dataset.uid = todo.uid;
        li.dataset.contentKey = contentKey;
        li.innerHTML = this._todoItemHtml(todo);
        this._bindItemEvents(li, todo.uid);
      } else {
        // Inhalt aktualisieren wenn sich etwas geÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndert hat
        if (li.dataset.contentKey !== contentKey) {
          li.dataset.contentKey = contentKey;
          const itemDiv = li.querySelector('.todo-item');
          if (itemDiv) itemDiv.outerHTML = this._todoItemInnerHtml(todo);
          this._bindItemEvents(li, todo.uid);
        }
      }

      // An korrekter Position einsetzen
      if (refNode === null) {
        if (ul.firstChild !== li) ul.prepend(li);
      } else {
        if (refNode.nextSibling !== li) refNode.after(li);
      }
      refNode = li;
    }

    // Abschnittslabel "Erledigt" nur einblenden, wenn erledigte To-Dos vorhanden sind
    const oldLabel = ul.querySelector('li.completed-section-label');
    if (oldLabel) oldLabel.remove();

    if (firstCompleted) {
      const firstCompletedLi = ul.querySelector(`li.swipe-wrapper[data-uid="${firstCompleted.uid}"]`);
      if (firstCompletedLi) {
        const label = document.createElement('li');
        label.className = 'completed-section-label';
        const title = document.createElement('span');
        title.className = 'completed-section-title';
        title.textContent = 'Erledigt';

        const deleteBtn = document.createElement('ha-icon-button');
        deleteBtn.className = 'completed-section-delete';
        deleteBtn.setAttribute('label', 'Erledigte To-Dos lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen');
        deleteBtn.innerHTML = '<ha-icon icon="mdi:trash-can-outline"></ha-icon>';
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await this._deleteCompletedTodos();
        });

        label.appendChild(title);
        label.appendChild(deleteBtn);
        ul.insertBefore(label, firstCompletedLi);
      }
    }
  }

  async _deleteCompletedTodos() {
    if (!this._isOnline()) return;

    const completed = this._todos.filter(t => t.status === 'completed');
    if (completed.length === 0) return;

    const confirmed = await this._showConfirm(
      'Erledigte To-Dos lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen',
      `Willst du wirklich ${completed.length} erledigte To-Do${completed.length > 1 ? 's' : ''} lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen?`,
      'LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶schen'
    );
    if (!confirmed) return;

    const backup = [...this._todos];
    this._todos = this._todos.filter(t => t.status !== 'completed');
    this._renderList();

    try {
      for (const todo of completed) {
        await this._callWithTimeout(
          this._hass.callService('todo', 'remove_item', { entity_id: this._selected, item: todo.uid })
        );
      }
    } catch (e) {
      console.warn('_deleteCompletedTodos failed/timeout:', e);
      this._todos = backup;
      this._renderList();
      this._subscribeItems();
    }
  }

  // HTML fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r das gesamte <li> (ohne <li> selbst)
  _todoItemHtml(todo) {
    return `
      <div class="delete-action" data-uid="${todo.uid}">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 3h6M3 6h18M19 6l-1 14H6L5 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 11v5M14 11v5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      ${this._todoItemInnerHtml(todo)}`;
  }

  // HTML nur fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r das innere .todo-item div
  _todoItemInnerHtml(todo) {
    return `<div class="todo-item" id="item-${todo.uid}">
      <div class="check-circle ${todo.status === 'completed' ? 'done' : ''}"
           data-uid="${todo.uid}" data-status="${todo.status}"></div>
      <div class="todo-body">
        <div class="todo-text ${todo.status === 'completed' ? 'done' : ''}">${this._esc(todo.summary)}</div>
        ${todo.description && !todo.due ? `<div class="todo-note-preview">${this._esc(todo.description)}</div>` : ''}
        ${todo.due         ? `<div class="due-date">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ${todo.due}</div>` : ''}
      </div>
      <span class="chevron">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Âº</span>
    </div>`;
  }

  // Event-Listener fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r ein <li.swipe-wrapper> registrieren
  _bindItemEvents(li, uid) {
    const circle = li.querySelector('.check-circle');
    if (circle) {
      circle.onclick = e => {
        e.stopPropagation();
        this._closeAllRevealed(null);
        this._toggleDone(circle.dataset.uid, circle.dataset.status);
      };
    }
    const del = li.querySelector('.delete-action');
    if (del) {
      del.onclick = e => {
        e.stopPropagation();
        this._animateAndDelete(del.dataset.uid);
      };
    }
    const itemDiv = li.querySelector('.todo-item');
    if (itemDiv) {
      itemDiv.onclick = e => {
        if (this._dragJustEnded) { this._dragJustEnded = false; return; }
        if (itemDiv.classList.contains('revealed')) {
          itemDiv.classList.remove('revealed');
          li.classList.remove('open');
          e.stopPropagation();
          return;
        }
        this._openDetail(uid);
      };
      itemDiv.addEventListener('touchstart', e => this._onTouchStart(e, uid), { passive: false });
      itemDiv.addEventListener('touchmove',  e => this._onTouchMove(e, uid),  { passive: false });
      itemDiv.addEventListener('touchend',   e => this._onTouchEnd(e, uid));
      // Desktop: Mouse-Events fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Drag
      itemDiv.addEventListener('mousedown',  e => this._onMouseDown(e, uid));
    }
  }

  _esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  _showDialog(title, placeholder, confirmText, options = {}) {
    return new Promise(resolve => {
      const overlay = this.shadowRoot.getElementById('dialog-overlay');
      const input = this.shadowRoot.getElementById('dialog-input');
      const confirmBtn = this.shadowRoot.getElementById('dialog-confirm');
      const cancelBtn = this.shadowRoot.getElementById('dialog-cancel');
      const titleEl = this.shadowRoot.getElementById('dialog-title');
      const iconSection = this.shadowRoot.getElementById('icon-picker-section');
      const iconPicker = this.shadowRoot.getElementById('dialog-icon-picker');

      titleEl.textContent = title;
      input.placeholder = placeholder;
      confirmBtn.textContent = confirmText;
      input.value = options.defaultValue || '';
      confirmBtn.disabled = !input.value.trim();

      // Icon picker
      const showIcon = options.showIconPicker !== false;
      iconSection.style.display = showIcon ? '' : 'none';
      const defaultIcon = options.defaultIcon || 'mdi:clipboard-list';
      if (showIcon) {
        iconPicker.hass = this._hass;
        iconPicker.value = defaultIcon;
      }

      overlay.classList.add('open');
      setTimeout(() => input.focus(), 50);

      const cleanup = () => {
        overlay.classList.remove('open');
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKey);
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
      };
      const onInput = () => { confirmBtn.disabled = !input.value.trim(); };
      const onConfirm = () => { cleanup(); resolve({ name: input.value.trim(), icon: iconPicker.value || defaultIcon }); };
      const onCancel = () => { cleanup(); resolve(null); };
      const onOverlay = (e) => { if (e.target === overlay) { cleanup(); resolve(null); } };
      const onKey = (e) => { if (e.key === 'Enter' && input.value.trim()) onConfirm(); if (e.key === 'Escape') onCancel(); };

      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKey);
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      overlay.addEventListener('click', onOverlay);
    });
  }

  _showReorderDialog() {
    return new Promise(resolve => {
      const overlay = this.shadowRoot.getElementById('dialog-overlay');
      const input = this.shadowRoot.getElementById('dialog-input');
      const confirmBtn = this.shadowRoot.getElementById('dialog-confirm');
      const cancelBtn = this.shadowRoot.getElementById('dialog-cancel');
      const titleEl = this.shadowRoot.getElementById('dialog-title');
      const iconSection = this.shadowRoot.getElementById('icon-picker-section');

      titleEl.textContent = 'Reihenfolge ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndern';
      iconSection.style.display = 'none';
      input.style.display = 'none';
      confirmBtn.textContent = 'Speichern';
      confirmBtn.disabled = false;
      confirmBtn.style.background = '';

      // Build reorder list
      let orderedLists = [...this._lists];
      let reorderEl = this.shadowRoot.getElementById('dialog-reorder-list');
      if (!reorderEl) {
        reorderEl = document.createElement('ul');
        reorderEl.id = 'dialog-reorder-list';
        reorderEl.className = 'reorder-list';
        input.parentNode.insertBefore(reorderEl, input.nextSibling);
      }
      reorderEl.style.display = '';

      // Ghost-basiertes Drag & Drop
      let ghost = null, ph = null, dragLi = null, dragIdx = null, offsetY = 0;

      const bindDragHandlers = () => {
        reorderEl.querySelectorAll('.reorder-item').forEach(li => {
          const handle = li.querySelector('.reorder-handle');

          const startDrag = (clientY) => {
            dragIdx = parseInt(li.dataset.idx);
            if (navigator.vibrate) navigator.vibrate(40);
            const rect = li.getBoundingClientRect();

            ghost = li.cloneNode(true);
            ghost.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;margin:0;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0.95;transition:none;pointer-events:none;list-style:none;border-radius:10px;background:var(--card-background-color,#fff);display:flex;align-items:center;padding:0.7rem 0.8rem;gap:0.75rem;`;
            overlay.appendChild(ghost);

            ph = document.createElement('li');
            ph.className = 'reorder-placeholder';
            ph.style.height = rect.height + 'px';
            li.replaceWith(ph);
            dragLi = li;
            offsetY = clientY - rect.top;
          };

          const moveGhost = (clientY) => {
            if (!ghost) return;
            ghost.style.top = (clientY - offsetY) + 'px';

            // Alle sichtbaren Items (ohne Placeholder) fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Positionsbestimmung
            const siblings = [...reorderEl.children].filter(el => el !== ph);
            let inserted = false;
            for (const sib of siblings) {
              const r = sib.getBoundingClientRect();
              if (clientY < r.top + r.height / 2) {
                reorderEl.insertBefore(ph, sib);
                inserted = true;
                break;
              }
            }
            if (!inserted) {
              reorderEl.appendChild(ph);
            }
          };

          const endDrag = () => {
            if (!ghost) return;
            ghost.remove(); ghost = null;
            dragLi = null;

            // Neue Reihenfolge aus DOM-Position ableiten
            const children = [...reorderEl.children];
            const phIdx = children.indexOf(ph);
            if (ph) { ph.remove(); ph = null; }

            if (dragIdx !== null && phIdx !== -1) {
              const [moved] = orderedLists.splice(dragIdx, 1);
              orderedLists.splice(phIdx, 0, moved);
              renderList();
            }
            dragIdx = null;
          };

          // Touch events
          let touchTimer = null;
          handle.addEventListener('touchstart', (e) => {
            const startY = e.touches[0].clientY;
            touchTimer = setTimeout(() => {
              e.preventDefault();
              startDrag(startY);
            }, 300);
          }, { passive: false });
          li.addEventListener('touchmove', (e) => {
            if (ghost) {
              e.preventDefault();
              moveGhost(e.touches[0].clientY);
            } else {
              clearTimeout(touchTimer);
            }
          }, { passive: false });
          li.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
            endDrag();
          });

          // Mouse events
          handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            startDrag(e.clientY);
            const onMove = (ev) => moveGhost(ev.clientY);
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
              endDrag();
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          });
        });
      };

      const renderList = () => {
        reorderEl.innerHTML = orderedLists.map((l, i) => `
          <li class="reorder-item" data-idx="${i}" data-id="${l.id}">
            <ha-icon icon="${l.icon}" style="--mdc-icon-size:20px"></ha-icon>
            <span class="reorder-item-name">${this._esc(l.name)}</span>
            <span class="reorder-handle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </span>
          </li>
        `).join('');
        bindDragHandlers();
      };
      renderList();

      overlay.classList.add('open');

      const cleanup = () => {
        overlay.classList.remove('open');
        input.style.display = '';
        reorderEl.style.display = 'none';
      };
      const onConfirm = () => {
        const newOrder = orderedLists.map(l => l.id);
        localStorage.setItem('todo_list_order', JSON.stringify(newOrder));
        this._lists = orderedLists;
        this._renderSidebar();
        this._renderList();
        cleanup();
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
        resolve(false);
      };
      const onOverlay = (e) => { if (e.target === overlay) onCancel(); };

      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      overlay.addEventListener('click', onOverlay);
    });
  }

  _showConfirm(title, message, confirmText) {
    return new Promise(resolve => {
      const overlay = this.shadowRoot.getElementById('dialog-overlay');
      const input = this.shadowRoot.getElementById('dialog-input');
      const confirmBtn = this.shadowRoot.getElementById('dialog-confirm');
      const cancelBtn = this.shadowRoot.getElementById('dialog-cancel');
      const titleEl = this.shadowRoot.getElementById('dialog-title');
      const iconSection = this.shadowRoot.getElementById('icon-picker-section');

      titleEl.textContent = title;
      iconSection.style.display = 'none';
      input.style.display = 'none';

      // Message als Paragraph einfÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼gen
      let msgEl = this.shadowRoot.getElementById('dialog-message');
      if (!msgEl) {
        msgEl = document.createElement('p');
        msgEl.id = 'dialog-message';
        msgEl.style.cssText = 'margin: 0 0 0.5rem; font-size: 0.95rem; color: var(--primary-text-color, #333); line-height: 1.5; white-space: pre-wrap;';
        input.parentNode.insertBefore(msgEl, input);
      }
      msgEl.textContent = message;
      msgEl.style.display = '';

      confirmBtn.textContent = confirmText;
      confirmBtn.disabled = false;
      confirmBtn.style.background = '#e53935';
      overlay.classList.add('open');

      const cleanup = () => {
        overlay.classList.remove('open');
        input.style.display = '';
        msgEl.style.display = 'none';
        confirmBtn.style.background = '';
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
      };
      const onConfirm = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const onOverlay = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };

      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      overlay.addEventListener('click', onOverlay);
    });
  }
}

customElements.define('todo-list-panel', TodoListPanel);
