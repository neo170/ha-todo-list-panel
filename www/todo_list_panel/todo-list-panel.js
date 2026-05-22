import { html, css, LitElement } from 'https://unpkg.com/lit-element/lit-element.js?module';

class TodoListPanel extends LitElement {
  static get properties() {
    return {
      hass:          { type: Object },
      _todos:        { type: Array,   state: true },
      _lists:        { type: Array,   state: true },
      _selectedList: { type: String,  state: true },
      _newText:      { type: String,  state: true },
      _loading:      { type: Boolean, state: true },
      _error:        { type: String,  state: true },
    };
  }

  static get styles() {
    return css`
      *, *::before, *::after { box-sizing: border-box; }

      :host {
        display: flex;
        justify-content: center;
        padding: 2rem 1rem;
        min-height: 100vh;
        background: linear-gradient(135deg, #e3f2fd 0%, #fce4ec 100%);
        font-family: 'Segoe UI', Arial, sans-serif;
      }

      .card {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        padding: 2rem 1.75rem 1.75rem;
        width: 100%;
        max-width: 460px;
        align-self: flex-start;
      }

      h2 {
        margin: 0 0 1.5rem;
        text-align: center;
        color: #1565c0;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .list-select {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
      }

      .list-select label { font-size: 0.85rem; color: #666; white-space: nowrap; }

      .list-select select {
        flex: 1;
        padding: 0.45rem 0.75rem;
        border-radius: 8px;
        border: 1.5px solid #90caf9;
        font-size: 0.95rem;
        background: #f5f7fa;
        color: #333;
        cursor: pointer;
        outline: none;
      }

      .add-row { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }

      .add-row input {
        flex: 1;
        padding: 0.6rem 0.9rem;
        border-radius: 10px;
        border: 1.5px solid #90caf9;
        font-size: 1rem;
        outline: none;
        transition: border-color 0.2s;
      }

      .add-row input:focus { border-color: #1976d2; }

      .add-row button {
        background: linear-gradient(135deg, #1976d2, #42a5f5);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 0.6rem 1.1rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity 0.2s, transform 0.1s;
      }

      .add-row button:hover  { opacity: 0.88; }
      .add-row button:active { transform: scale(0.96); }
      .add-row button:disabled { opacity: 0.45; cursor: default; }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .swipe-wrapper { position: relative; border-radius: 12px; overflow: hidden; }

      .delete-bg {
        position: absolute;
        right: 0; top: 0; bottom: 0;
        width: 80px;
        background: #e53935;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 1.4rem;
        border-radius: 12px;
        pointer-events: none;
      }

      .todo-item {
        background: #f5f7fa;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.8rem 1rem;
        position: relative;
        transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s;
        touch-action: pan-y;
        user-select: none;
        will-change: transform;
      }

      .todo-item.removing { transform: translateX(-110%) !important; opacity: 0; }

      .check-circle {
        width: 22px; height: 22px;
        border-radius: 50%;
        border: 2px solid #90caf9;
        background: #fff;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
      }

      .check-circle.done { background: #1976d2; border-color: #1976d2; }

      .check-circle.done::after {
        content: '✓';
        color: #fff;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .todo-text { flex: 1; font-size: 1rem; color: #333; word-break: break-word; }
      .todo-text.done { text-decoration: line-through; color: #aaa; }
      .due-date { font-size: 0.75rem; color: #888; margin-top: 2px; }

      .del-btn {
        background: none;
        border: none;
        color: #e53935;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem 0.4rem;
        border-radius: 6px;
        flex-shrink: 0;
        transition: background 0.15s;
      }

      .del-btn:hover { background: #ffebee; }

      .empty { text-align: center; color: #aaa; padding: 1.5rem 0; font-size: 0.95rem; }

      .error-msg {
        background: #ffebee;
        border-radius: 8px;
        padding: 0.6rem 1rem;
        color: #c62828;
        font-size: 0.88rem;
        margin-bottom: 1rem;
      }

      .hint { text-align: center; font-size: 0.75rem; color: #ccc; margin-top: 1rem; }

      .spinner { display: flex; justify-content: center; padding: 1.5rem 0; }

      .spinner::after {
        content: '';
        width: 28px; height: 28px;
        border: 3px solid #90caf9;
        border-top-color: #1976d2;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin { to { transform: rotate(360deg); } }

      .badge {
        background: #e3f2fd;
        color: #1565c0;
        border-radius: 10px;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 2px 7px;
        margin-left: 6px;
        vertical-align: middle;
      }
    `;
  }

  constructor() {
    super();
    this._todos        = [];
    this._lists        = [];
    this._selectedList = '';
    this._newText      = '';
    this._loading      = false;
    this._error        = '';
    this._swipeStartX  = null;
    this._swipeId      = null;
  }

  // HA ruft diesen Setter bei jedem State-Update auf
  set hass(hass) {
    const prev = this._hass;
    this._hass = hass;

    // Todo-Listen aus hass.states ermitteln
    const lists = Object.values(hass.states)
      .filter(e => e.entity_id.startsWith('todo.'))
      .map(e => ({
        id:   e.entity_id,
        name: e.attributes.friendly_name || e.entity_id,
      }));

    this._lists = lists;

    // Beim ersten Aufruf: erste Liste vorauswählen & Daten laden
    if (!this._selectedList && lists.length > 0) {
      this._selectedList = lists[0].id;
      this._fetchItems();
      return;
    }

    // Bei State-Änderung der aktiven Liste: neu laden
    const prevTs = prev?.states?.[this._selectedList]?.last_changed;
    const newTs  = hass.states?.[this._selectedList]?.last_changed;
    if (this._selectedList && prevTs !== newTs) {
      this._fetchItems();
    }
  }

  get hass() { return this._hass; }

  // Items per WebSocket laden – todo.get_items gibt Response-Objekt zurück
  async _fetchItems() {
    if (!this._selectedList || !this._hass) return;
    this._loading = true;
    this._error   = '';
    try {
      const result = await this._hass.callWS({
        type:            'call_service',
        domain:          'todo',
        service:         'get_items',
        service_data:    { entity_id: this._selectedList },
        return_response: true,
      });
      this._todos = result?.response?.[this._selectedList]?.items ?? [];
    } catch (e) {
      this._error = `Fehler beim Laden: ${e.message ?? e}`;
    } finally {
      this._loading = false;
    }
  }

  async _addTodo() {
    const text = this._newText.trim();
    if (!text || !this._selectedList) return;
    this._newText = '';
    try {
      await this._hass.callService('todo', 'add_item', {
        entity_id: this._selectedList,
        item:      text,
      });
      await this._fetchItems();
    } catch (e) {
      this._error = `Fehler beim Hinzufügen: ${e.message ?? e}`;
    }
  }

  async _toggleDone(todo) {
    const newStatus = todo.status === 'completed' ? 'needs_action' : 'completed';
    try {
      await this._hass.callService('todo', 'update_item', {
        entity_id: this._selectedList,
        item:      todo.uid,
        status:    newStatus,
      });
      await this._fetchItems();
    } catch (e) {
      this._error = `Fehler beim Aktualisieren: ${e.message ?? e}`;
    }
  }

  _animateAndDelete(uid) {
    const el = this.shadowRoot?.getElementById('todo-' + uid);
    if (!el) { this._deleteTodo(uid); return; }
    el.classList.add('removing');
    el.addEventListener('transitionend', () => this._deleteTodo(uid), { once: true });
  }

  async _deleteTodo(uid) {
    try {
      await this._hass.callService('todo', 'remove_item', {
        entity_id: this._selectedList,
        item:      uid,
      });
      await this._fetchItems();
    } catch (e) {
      this._error = `Fehler beim Löschen: ${e.message ?? e}`;
    }
  }

  // ── Touch-Swipe ──
  _onTouchStart(e, uid) {
    this._swipeStartX = e.touches[0].clientX;
    this._swipeId     = uid;
  }

  _onTouchMove(e, uid) {
    if (this._swipeId !== uid || this._swipeStartX === null) return;
    const dx = e.touches[0].clientX - this._swipeStartX;
    const el = this.shadowRoot?.getElementById('todo-' + uid);
    if (!el) return;
    if (dx < 0) el.style.transform = `translateX(${Math.max(dx, -90)}px)`;
    else        el.style.transform = '';
  }

  _onTouchEnd(e, uid) {
    const el = this.shadowRoot?.getElementById('todo-' + uid);
    if (!el) return;
    const tx = parseFloat(el.style.transform?.match(/-?\d+(\.\d+)?/)?.[0] ?? '0');
    if (tx < -60) this._animateAndDelete(uid);
    else          el.style.transform = '';
    this._swipeId = null;
  }

  render() {
    const openCount = this._todos.filter(t => t.status !== 'completed').length;

    return html`
      <div class="card">
        <h2>
          📝 To-Do Liste
          ${openCount > 0 ? html`<span class="badge">${openCount}</span>` : ''}
        </h2>

        ${this._lists.length > 1 ? html`
          <div class="list-select">
            <label>Liste:</label>
            <select @change="${e => { this._selectedList = e.target.value; this._fetchItems(); }}">
              ${this._lists.map(l => html`
                <option value="${l.id}" ?selected="${l.id === this._selectedList}">${l.name}</option>
              `)}
            </select>
          </div>
        ` : ''}

        ${this._error ? html`<div class="error-msg">⚠️ ${this._error}</div>` : ''}

        <div class="add-row">
          <input
            type="text"
            placeholder="Neues To-Do eingeben…"
            .value="${this._newText}"
            @input="${e => this._newText = e.target.value}"
            @keydown="${e => e.key === 'Enter' && this._addTodo()}"
          />
          <button @click="${this._addTodo}" ?disabled="${!this._newText.trim()}">
            ＋ Hinzufügen
          </button>
        </div>

        ${this._loading
          ? html`<div class="spinner"></div>`
          : html`
            <ul>
              ${this._todos.length === 0
                ? html`<li class="empty">Keine To-Dos 🎉</li>`
                : this._todos.map(todo => html`
                  <li class="swipe-wrapper">
                    <div class="delete-bg">🗑️</div>
                    <div
                      class="todo-item"
                      id="todo-${todo.uid}"
                      @touchstart="${e => this._onTouchStart(e, todo.uid)}"
                      @touchmove="${e => this._onTouchMove(e, todo.uid)}"
                      @touchend="${e => this._onTouchEnd(e, todo.uid)}"
                    >
                      <div
                        class="check-circle ${todo.status === 'completed' ? 'done' : ''}"
                        @click="${() => this._toggleDone(todo)}"
                      ></div>
                      <div style="flex:1;min-width:0">
                        <div class="todo-text ${todo.status === 'completed' ? 'done' : ''}">
                          ${todo.summary}
                        </div>
                        ${todo.due ? html`<div class="due-date">📅 ${todo.due}</div>` : ''}
                      </div>
                      <button class="del-btn" @click="${() => this._animateAndDelete(todo.uid)}">✕</button>
                    </div>
                  </li>
                `)
              }
            </ul>
          `
        }
        <p class="hint">← Swipe nach links zum Löschen</p>
      </div>
    `;
  }
}

customElements.define('todo-list-panel', TodoListPanel);
