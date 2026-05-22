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
    this._waitingForNewList = null; // entity_id-Set der bekannten Listen beim Erstellen
  }

  // ── HASS ─────────────────────────────────────────────────

  set hass(hass) {
    const prev = this._hass;
    this._hass = hass;

    const lists = Object.values(hass.states)
      .filter(e => e.entity_id.startsWith('todo.'))
      .map(e => ({ id: e.entity_id, name: e.attributes.friendly_name || e.entity_id }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    this._lists = lists;

    // Neue Liste erkannt? → Sidebar aktualisieren + auswählen
    if (this._waitingForNewList) {
      const newEntity = lists.find(l => !this._waitingForNewList.has(l.id));
      if (newEntity) {
        this._waitingForNewList = null;
        if (this._domReady) this._renderSidebar();
        this._selectList(newEntity.id);
        return;
      }
    }

    if (!this._selected && lists.length > 0) {
      const saved = localStorage.getItem('todo_selected_list');
      const restoredId = saved && lists.find(l => l.id === saved) ? saved : lists[0].id;
      this._selected = restoredId;
      if (this._domReady) this._fetchItems();
      return;
    }

    const prevTs = prev?.states?.[this._selected]?.last_changed;
    const newTs  = hass.states?.[this._selected]?.last_changed;
    if (this._selected && prevTs !== newTs && this._domReady) {
      clearTimeout(this._fetchTimer);
      this._fetchTimer = setTimeout(() => this._fetchItems(), 150);
    }
  }

  get hass() { return this._hass; }

  connectedCallback() {
    this._render();
    this._bindStaticEvents();
    this._domReady = true;
    if (this._selected) this._fetchItems();
  }

  // ── API ──────────────────────────────────────────────────

  async _fetchItems() {
    if (!this._selected || !this._hass) return;
    this._loading = true;
    if (this._todos.length === 0) this._renderList(); // Spinner nur beim ersten Laden
    try {
      const result = await this._hass.callWS({
        type:            'call_service',
        domain:          'todo',
        service:         'get_items',
        service_data:    { entity_id: this._selected },
        return_response: true,
      });
      const raw = result?.response?.[this._selected]?.items ?? [];
      // Sortierung nach Erstelldatum: local_todo nutzt UUID v1 (Timestamp in Bits 0-59).
      // Fallback: Originalreihenfolge (Index) wenn keine UUID v1.
      const uuidV1Time = uid => {
        const m = /^([0-9a-f]{8})-([0-9a-f]{4})-(1)([0-9a-f]{3})-/.exec(uid ?? '');
        if (!m) return 0;
        // UUID v1 Timestamp: time_low + time_mid + time_hi (ohne Version-Bit)
        return parseInt(m[4] + m[2] + m[1], 16);
      };
      const withIndex = raw.map((t, i) => ({ t, i, ts: uuidV1Time(t.uid) }));
      const active    = withIndex.filter(x => x.t.status !== 'completed');
      const completed = withIndex.filter(x => x.t.status === 'completed');
      const sortFn    = (a, b) => (a.ts && b.ts) ? b.ts - a.ts : b.i - a.i;  // neueste zuerst
      this._todos = [...active.sort(sortFn), ...completed.sort(sortFn)].map(x => x.t);
    } catch (e) {
      console.error('TodoPanel fetch error:', e);
    } finally {
      this._loading = false;
      this._renderList();
    }
  }

  async _addTodo() {
    const text = this._newText.trim();
    if (!text || !this._selected) return;
    this._newText = '';
    this.shadowRoot.getElementById('new-input').value = '';
    this.shadowRoot.getElementById('add-btn').disabled = true;
    await this._hass.callService('todo', 'add_item', { entity_id: this._selected, item: text });
    await this._fetchItems();
  }

  async _toggleDone(uid, currentStatus) {
    const status = currentStatus === 'completed' ? 'needs_action' : 'completed';
    await this._hass.callService('todo', 'update_item', { entity_id: this._selected, item: uid, status });
    await this._fetchItems();
  }

  async _deleteTodo(uid) {
    await this._hass.callService('todo', 'remove_item', { entity_id: this._selected, item: uid });
    await this._fetchItems();
  }

  async _saveDetail(closeAfter = false) {
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

    // Optimistisch: lokalen State sofort updaten & zurück zu Readonly
    const newDue = dateVal
      ? (timeVal ? `${dateVal}T${timeVal}:00` : dateVal)
      : null;
    this._todos = this._todos.map(t =>
      t.uid === todo.uid
        ? { ...t, summary: newTitle, description: newNotes, due: newDue }
        : t
    );
    // Detailtodo aktualisieren für Readonly-Ansicht
    this._detailTodo = { ...todo, summary: newTitle, description: newNotes, due: newDue };
    this._detailEditMode = false;
    if (closeAfter) { this._closeDetail(); } else { this._renderDetailMode(); }
    this._renderList();

    // Im Hintergrund speichern
    try {
      await this._hass.callService('todo', 'update_item', {
        entity_id:   this._selected,
        item:        todo.uid,
        rename:      newTitle,
        description: newNotes,
        ...duePayload,
      });
    } catch (e) {
      console.warn('Full update failed, retrying without description/due:', e);
      try {
        await this._hass.callService('todo', 'update_item', {
          entity_id: this._selected,
          item:      todo.uid,
          rename:    newTitle,
          ...duePayload,
        });
      } catch (e2) {
        console.error('Save failed completely:', e2);
        await this._fetchItems();
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

  // ── Detail-Ansicht ───────────────────────────────────────

  _openDetail(uid) {
    this._detailTodo = this._todos.find(t => t.uid === uid) ?? null;
    if (!this._detailTodo) return;
    const t = this._detailTodo;
    // Readonly wenn mehr als nur Titel vorhanden, sonst direkt Edit
    const hasExtra = t.description || t.due;
    this._detailEditMode = !hasExtra;
    this._showDetail();
  }

  _enterEditMode() {
    this._detailEditMode = true;
    this._renderDetailMode();
    // Fokus auf Titel
    setTimeout(() => this.shadowRoot.getElementById('detail-title')?.focus(), 50);
  }

  _showDetail() {
    const listName = this._lists.find(l => l.id === this._selected)?.name ?? '';
    const label = this.shadowRoot.getElementById('detail-back-label');
    if (label) label.textContent = listName;
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
      // Edit-Felder befüllen
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
    } else {
      // Readonly View befüllen
      this.shadowRoot.getElementById('view-title').textContent = todo.summary ?? '';

      // Notizen mit klickbaren Links
      const viewNotes = this.shadowRoot.getElementById('view-notes');
      if (todo.description) {
        viewNotes.innerHTML = this._linkify(this._esc(todo.description));
        viewNotes.parentElement.style.display = '';
      } else {
        viewNotes.parentElement.style.display = 'none';
      }

      // Fälligkeitsdatum
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

  _closeDetail() {
    this.shadowRoot.getElementById('slider').classList.remove('show-detail');
    this._detailTodo     = null;
    this._detailEditMode = false;
  }

  // ── iOS-Style Swipe ──────────────────────────────────────
  // Kleiner Swipe  → Löschen-Button einblenden (revealed)
  // Großer Swipe   → sofort löschen
  // Tap woanders  → Button wieder zuklappen

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

  _onTouchStart(e, uid) {
    this._swipeStartX = e.touches[0].clientX;
    this._swipeStartY = e.touches[0].clientY;
    this._swipeId     = uid;
    this._swipeMoved  = false;
  }

  _onTouchMove(e, uid) {
    if (this._swipeId !== uid) return;
    const dx = e.touches[0].clientX - this._swipeStartX;
    const dy = e.touches[0].clientY - this._swipeStartY;

    // Wenn vertikaler Scroll dominiert → ignorieren
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
      // Zurückschieben, aber nicht über 0
      const base = el.classList.contains('revealed') ? -80 : 0;
      const clamped = Math.min(base + dx, 0);
      el.style.transition = 'none';
      el.style.transform  = clamped === 0 ? '' : `translateX(${clamped}px)`;
    }
  }

  _onTouchEnd(e, uid) {
    if (this._swipeId !== uid) return;
    this._swipeId = null;
    if (!this._swipeMoved) return;

    const el = this.shadowRoot.getElementById('item-' + uid);
    if (!el) return;

    el.style.transition = ''; // CSS-Transition wieder aktivieren
    const tx = parseFloat(el.style.transform?.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)?.[1] ?? '0');

    if (tx < -160) {
      // Großer Swipe → sofort löschen
      this._animateAndDelete(uid);
    } else if (tx < -40) {
      // Kleiner Swipe → einrasten, Löschen-Button zeigen
      el.classList.add('revealed');
      el.style.transform = '';
      el.closest('.swipe-wrapper')?.classList.add('open');
      this._closeAllRevealed(uid);
    } else {
      // Zu wenig → zuklappen
      el.classList.remove('revealed');
      el.style.transform = '';
      el.closest('.swipe-wrapper')?.classList.remove('open');
    }
  }

  // ── Rendering ────────────────────────────────────────────

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; }

        :host {
          display: block;
          background: var(--primary-background-color, #f0f4f8);
          font-family: var(--paper-font-body1_-_font-family, 'Segoe UI', Arial, sans-serif);
          overflow: hidden;
          /* Füllt den gesamten HA-Panel-Bereich */
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

        /* ── App-Layout (Desktop: Sidebar + Main) ── */
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
          font-size: 0.95rem;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .sidebar-item:hover { background: var(--secondary-background-color, #f5f5f5); }

        .sidebar-item.active {
          background: rgba(25, 118, 210, 0.12);
          color: var(--primary-color, #1976d2);
          font-weight: 600;
        }

        .sidebar-item-icon { flex-shrink: 0; opacity: 0.55; --mdc-icon-size: 20px; width: 20px; height: 20px; }
        .sidebar-item.active .sidebar-item-icon { opacity: 1; color: var(--primary-color, #1976d2); }

        .sidebar-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sidebar-item-badge {
          background: var(--primary-color, #1976d2);
          color: #fff;
          border-radius: 10px;
          font-size: 0.73rem;
          font-weight: 700;
          padding: 1px 7px;
          min-width: 22px;
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

        /* Desktop: Chevron verstecken, Picker-Dropdown nicht nötig */
        @media (min-width: 768px) {
          .title-chevron { display: none; }
          .list-picker-dropdown { display: none !important; }
          /* Titel auf Desktop static, kein Pointer */
          .header-title-btn { cursor: default; pointer-events: none; }
          /* Hamburger auf Desktop ausblenden */
          #menu-btn { display: none; }
        }

        /* ── Klickbarer Titel im Header (Mobile: Liste wechseln) ── */
        .list-picker-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .header-title-btn {
          background: none;
          border: none;
          color: var(--app-header-text-color, #fff);
          font-size: 1.3rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          cursor: pointer;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
          width: 100%;
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

        .list-picker-item.active { color: var(--primary-color, #1976d2); font-weight: 600; }

        .list-picker-check { margin-left: auto; font-size: 1.1rem; color: var(--primary-color, #1976d2); }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: center;
          height: 56px;
          background: var(--app-header-background-color, #1976d2);
          color: var(--app-header-text-color, #fff);
          padding: 0 4px 0 0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--app-header-text-color, #fff);
          cursor: pointer;
          padding: 0 14px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }
        .icon-btn:active { background: rgba(255,255,255,0.15); }

        /* Zurück-Button mit Label (Detail-Header) */
        .detail-back-wide {
          padding: 0 16px 0 8px;
          gap: 4px;
          font-size: 1.3rem;
          font-weight: 600;
          max-width: 50%;
        }
        .back-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-title {
          flex: 1;
          font-size: 1.3rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .header-badge {
          background: rgba(255,255,255,0.25);
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 2px 9px;
          margin-right: 16px;
        }

        /* ── Drei-Punkte-Menü (Listenansicht Header) ── */
        .main-menu-wrap { position: relative; }

        .main-dropdown {
          display: none;
          position: absolute;
          top: 44px;
          right: 8px;
          background: var(--card-background-color, #fff);
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          min-width: 200px;
          z-index: 500;
          overflow: hidden;
        }

        .main-dropdown.open { display: block; }

        .main-dropdown button {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          background: none;
          border: none;
          padding: 0.85rem 1.1rem;
          font-size: 0.97rem;
          cursor: pointer;
          text-align: left;
          color: var(--primary-text-color, #333);
          transition: background 0.15s;
        }

        .main-dropdown button:hover { background: var(--secondary-background-color, #f5f5f5); }
        .main-dropdown button.danger { color: #e53935; }
        .main-dropdown button.danger:hover { background: #ffebee; }

        /* ── Content ── */
        .content {
          padding: 1.25rem 1rem;
          max-width: 520px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── List selector ── */
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

        /* ── Add row ── */
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

        /* ── Todo items ── */
        .todo-list {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
          min-width: 0;
        }

        .swipe-wrapper {
          position: relative;
          border-radius: 12px;
          min-width: 0;
          width: 100%;
        }

        /* Roter Lösch-Button hinter dem Item */
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

        /* Item ist geöffnet (Löschen-Button sichtbar) */
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
        .check-circle.done::after { content: '✓'; color: #fff; font-size: 0.78rem; font-weight: 700; }

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

        /* ── States ── */
        .empty { text-align: center; color: var(--secondary-text-color, #aaa); padding: 2rem 0; font-size: 0.95rem; }

        /* ── Detail Panel ── */
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
          /* Sicherstellen dass leere Felder gleich hoch sind wie befüllte */
          min-width: 0;
        }

        /* Placeholder-Farbe für leere date/time Inputs (iOS zeigt sonst nichts) */
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

        /* ── Readonly View ── */
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

        /* Edit-Button im Header */
        #detail-edit-btn {
          /* erbt .icon-btn */
        }

        /* ── Drei-Punkt-Menü ── */
        .detail-menu-wrap {
          position: relative;
        }

        #detail-menu-btn {
          /* erbt .icon-btn */
        }

        .detail-dropdown {
          display: none;
          position: absolute;
          top: 44px;
          right: 8px;
          background: var(--card-background-color, #fff);
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          min-width: 180px;
          z-index: 500;
          overflow: hidden;
        }

        .detail-dropdown.open { display: block; }

        .detail-dropdown button {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          background: none;
          border: none;
          padding: 0.85rem 1.1rem;
          font-size: 0.97rem;
          cursor: pointer;
          text-align: left;
          color: var(--primary-text-color, #333);
          transition: background 0.15s;
        }

        .detail-dropdown button:hover { background: var(--secondary-background-color, #f5f5f5); }

        .detail-dropdown button.danger { color: #e53935; }
        .detail-dropdown button.danger:hover { background: #ffebee; }
      </style>

      <!-- Slider-Wrapper: Liste links, Detail rechts -->
      <div class="slider" id="slider">

      <!-- ── Listenansicht ── -->
      <div class="view" id="list-view">
        <div class="header">
          <button class="icon-btn" id="menu-btn" title="Menü">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>
            </svg>
          </button>
          <!-- Klickbarer Titel (Mobile: Listenwechsel-Dropdown) -->
          <div class="list-picker-wrap" id="list-picker-wrap">
            <button class="header-title-btn" id="header-title-btn">
              <span id="header-title-text">To Do</span>
              <span class="title-chevron" id="title-chevron">▾</span>
            </button>
            <div class="list-picker-dropdown" id="list-picker-dropdown"></div>
          </div>
          <!-- Drei-Punkte-Menü -->
          <div class="main-menu-wrap">
            <button class="icon-btn" id="main-menu-btn" title="Mehr">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            <div class="main-dropdown" id="main-dropdown">
              <button id="new-list-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.6">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Neue Liste erstellen
              </button>
              <button id="delete-list-btn" class="danger">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 3h6M3 6h18M19 6l-1 14H6L5 6" stroke="#e53935" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 11v5M14 11v5" stroke="#e53935" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                Liste löschen
              </button>
            </div>
          </div>
        </div>

        <!-- App-Layout: Sidebar (Desktop) + Hauptbereich -->
        <div class="app-layout">
          <div class="sidebar" id="sidebar"></div>

          <div class="main-area">
            <div class="content">
              <div class="add-row">
                <input id="new-input" type="text" placeholder="Neuen Eintrag anlegen…" />
                <button id="add-btn" disabled>＋ Hinzufügen</button>
              </div>

              <ul class="todo-list" id="todo-list"></ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Detailansicht ── -->
      <div class="view" id="detail-panel">
        <div class="header">
          <button class="icon-btn detail-back-wide" id="detail-back-btn" title="Zurück">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span class="back-label" id="detail-back-label"></span>
          </button>
          <span style="flex:1"></span>
          <button class="icon-btn" id="detail-edit-btn" title="Bearbeiten" style="display:none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <div class="detail-menu-wrap">
            <button class="icon-btn" id="detail-menu-btn" title="Mehr">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            <div class="detail-dropdown" id="detail-dropdown">
              <button class="danger" id="detail-delete-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 3h6M3 6h18M19 6l-1 14H6L5 6" stroke="#e53935" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 11v5M14 11v5" stroke="#e53935" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                Eintrag löschen
              </button>
            </div>
          </div>
        </div>

        <div class="detail-content">

          <!-- ── Readonly-Ansicht ── -->
          <div class="detail-readonly">
            <div class="view-title" id="view-title"></div>
            <div class="detail-field" id="view-notes-section" style="display:none">
              <label>Notizen</label>
              <div class="view-section-value" id="view-notes"></div>
            </div>
            <div class="detail-field" id="view-due-section" style="display:none">
              <label>Fälligkeit</label>
              <div class="view-section-value" id="view-due"></div>
            </div>
            <div class="detail-field" id="view-modified-section" style="display:none">
              <label>Erstellt</label>
              <div class="view-section-value view-modified-value" id="view-modified"></div>
            </div>
          </div>

          <!-- ── Bearbeitungsformular ── -->
          <div class="detail-editform">
            <div class="detail-field">
              <label>Titel</label>
              <input id="detail-title" type="text" />
            </div>
            <div class="detail-field">
              <label>Notizen</label>
              <textarea id="detail-notes" placeholder="Zusatzinformationen eingeben…"></textarea>
            </div>
            <div class="due-row">
              <div class="detail-field">
                <label>Fälligkeitsdatum</label>
                <input id="detail-due-date" type="date" />
              </div>
              <div class="detail-field">
                <label>Uhrzeit</label>
                <input id="detail-due-time" type="time" />
              </div>
              <button class="due-clear-btn" id="detail-due-clear" title="Datum löschen">✕</button>
            </div>
            <div id="detail-error" style="display:none;color:#c62828;background:#ffebee;border-radius:8px;padding:0.6rem 0.9rem;font-size:0.88rem;margin-bottom:0.5rem;"></div>
            <div class="detail-btn-row">
              <button class="detail-save-btn" id="detail-save">Speichern</button>
              <button class="detail-cancel-btn" id="detail-cancel">Abbruch</button>
            </div>
          </div>

        </div>
      </div>

      </div><!-- /slider -->
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

    // Mobile: Listenwechsel über Header-Titel
    const titleBtn   = this.shadowRoot.getElementById('header-title-btn');
    const pickerDrop = this.shadowRoot.getElementById('list-picker-dropdown');
    titleBtn.addEventListener('click', e => {
      e.stopPropagation();
      pickerDrop.classList.toggle('open');
    });

    // Drei-Punkte-Menü (Listenansicht)
    const mainMenuBtn  = this.shadowRoot.getElementById('main-menu-btn');
    const mainDropdown = this.shadowRoot.getElementById('main-dropdown');
    mainMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      mainDropdown.classList.toggle('open');
    });
    this.shadowRoot.getElementById('new-list-btn').addEventListener('click', async () => {
      mainDropdown.classList.remove('open');
      const name = prompt('Name der neuen Liste:');
      if (!name?.trim()) return;
      try {
        const step1 = await this._hass.callApi('POST', 'config/config_entries/flow', {
          handler: 'local_todo',
          show_advanced_options: false,
        });
        if (!step1?.flow_id) throw new Error('Kein flow_id erhalten');
        // Flag setzen bevor die API aufgerufen wird → set hass() erkennt neue Entity
        this._waitingForNewList = new Set(this._lists.map(l => l.id));
        await this._hass.callApi('POST', `config/config_entries/flow/${step1.flow_id}`, {
          todo_list_name: name.trim(),
        });
        // set hass() übernimmt das Auswählen der neuen Liste sobald HA sie meldet
      } catch(e) {
        console.error('create list error', e);
        alert('Fehler beim Erstellen: ' + (e?.message ?? JSON.stringify(e)));
      }
    });

    this.shadowRoot.getElementById('delete-list-btn').addEventListener('click', async () => {
      mainDropdown.classList.remove('open');
      if (!this._selected) return;
      const listName = this._lists.find(l => l.id === this._selected)?.name ?? this._selected;
      if (!confirm(`Liste "${listName}" wirklich löschen?\nDieser Vorgang kann nicht rückgängig gemacht werden.`)) return;
      try {
        // Korrekter WS-Type laut HA-Source: config/entity_registry/get
        const entry = await this._hass.callWS({
          type: 'config/entity_registry/get',
          entity_id: this._selected,
        });
        if (!entry?.config_entry_id) {
          alert('Diese Liste kann nicht gelöscht werden (kein Config-Eintrag gefunden).');
          return;
        }
        // Korrekter Aufruf laut HA-Source: callApi DELETE
        await this._hass.callApi('DELETE', `config/config_entries/entry/${entry.config_entry_id}`);
        const remaining = this._lists.filter(l => l.id !== this._selected);
        this._selected = remaining[0]?.id ?? '';
        this._todos = [];
        if (this._selected) this._fetchItems();
        else this._renderList();
      } catch(e) {
        alert('Fehler beim Löschen: ' + (e?.message ?? JSON.stringify(e)));
      }
    });

    this.shadowRoot.getElementById('detail-back-btn').addEventListener('click', () => {
      if (this._detailEditMode) {
        this._saveDetail(true); // speichern + zurück zur Übersicht
      } else {
        this._closeDetail();
      }
    });
    this.shadowRoot.getElementById('detail-edit-btn').addEventListener('click', () => this._enterEditMode());
    this.shadowRoot.getElementById('detail-save').addEventListener('click', () => this._saveDetail());
    this.shadowRoot.getElementById('detail-cancel').addEventListener('click', () => {
      if (this._detailTodo?.description || this._detailTodo?.due) {
        // Hat bereits Daten → zurück zur Readonly-Ansicht
        this._detailEditMode = false;
        this._renderDetailMode();
      } else {
        // Neuer Eintrag ohne Daten → Detail schließen
        this._closeDetail();
      }
    });
    this.shadowRoot.getElementById('detail-due-clear').addEventListener('click', () => {
      this.shadowRoot.getElementById('detail-due-date').value = '';
      this.shadowRoot.getElementById('detail-due-time').value = '';
    });

    // Drei-Punkt-Menü
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

    // Klick außerhalb → alle Dropdowns schließen + Swipe-Buttons zuklappen
    this.shadowRoot.addEventListener('click', e => {
      dropdown.classList.remove('open');
      pickerDrop.classList.remove('open');
      mainDropdown.classList.remove('open');
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
      return parseInt(state?.attributes?.items_not_completed ?? 0, 10) || 0;
    };

    // Sidebar-Items (Desktop) – direkt die Items, kein Heading
    sidebar.innerHTML = this._lists.map(l => {
      const open = openPerList(l.id);
      return `
        <button class="sidebar-item${l.id === this._selected ? ' active' : ''}" data-id="${l.id}">
          <ha-icon class="sidebar-item-icon" icon="mdi:format-list-bulleted"></ha-icon>
          <span class="sidebar-item-name">${this._esc(l.name)}</span>
          ${open > 0 ? `<span class="sidebar-item-badge">${open}</span>` : ''}
        </button>`;
    }).join('');

    // Klick auf Sidebar-Item
    sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
      btn.addEventListener('click', () => this._selectList(btn.dataset.id));
    });

    // Dropdown (Mobile Header) – nur relevant wenn mehrere Listen vorhanden
    if (chevron) chevron.style.display = this._lists.length > 1 ? '' : 'none';
    dropdown.innerHTML = this._lists.map(l => `
      <button class="list-picker-item${l.id === this._selected ? ' active' : ''}" data-id="${l.id}">
        <ha-icon icon="mdi:format-list-bulleted" style="opacity:0.5;flex-shrink:0;--mdc-icon-size:20px"></ha-icon>
        <span style="flex:1">${this._esc(l.name)}</span>
        ${l.id === this._selected ? '<span class="list-picker-check">✓</span>' : ''}
      </button>
    `).join('');

    dropdown.querySelectorAll('.list-picker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selectList(btn.dataset.id);
        dropdown.classList.remove('open');
      });
    });
  }

  _selectList(id) {
    if (id === this._selected) return;
    this._selected = id;
    localStorage.setItem('todo_selected_list', id);
    this._todos = [];
    this._fetchItems();
  }

  _renderList() {
    // Header-Titel + Sidebar aktualisieren
    const currentList = this._lists.find(l => l.id === this._selected);
    const titleEl = this.shadowRoot.getElementById('header-title-text');
    if (titleEl) titleEl.textContent = currentList?.name ?? 'To Do';

    this._renderSidebar();

    const ul = this.shadowRoot.getElementById('todo-list');

    // Spinner nur beim ersten Laden (noch keine Items im DOM)
    if (this._loading && this._todos.length === 0) {
      ul.innerHTML = '';
      return;
    }
    if (!this._loading && this._todos.length === 0) {
      ul.innerHTML = '<li class="empty">Keine To-Dos</li>';
      return;
    }

    // ── Keyed Reconciliation: kein kompletter DOM-Neuaufbau ──────────────
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

    // 2) Einfügen/Verschieben/Aktualisieren in richtiger Reihenfolge
    let refNode = null; // Element nach dem eingefügt wird (null = prepend)
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
        // Inhalt aktualisieren wenn sich etwas geändert hat
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
  }

  // HTML für das gesamte <li> (ohne <li> selbst)
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

  // HTML nur für das innere .todo-item div
  _todoItemInnerHtml(todo) {
    return `<div class="todo-item" id="item-${todo.uid}">
      <div class="check-circle ${todo.status === 'completed' ? 'done' : ''}"
           data-uid="${todo.uid}" data-status="${todo.status}"></div>
      <div class="todo-body">
        <div class="todo-text ${todo.status === 'completed' ? 'done' : ''}">${this._esc(todo.summary)}</div>
        ${todo.description && !todo.due ? `<div class="todo-note-preview">${this._esc(todo.description)}</div>` : ''}
        ${todo.due         ? `<div class="due-date">📅 ${todo.due}</div>` : ''}
      </div>
      <span class="chevron">›</span>
    </div>`;
  }

  // Event-Listener für ein <li.swipe-wrapper> registrieren
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
        if (itemDiv.classList.contains('revealed')) {
          itemDiv.classList.remove('revealed');
          li.classList.remove('open');
          e.stopPropagation();
          return;
        }
        this._openDetail(uid);
      };
      itemDiv.addEventListener('touchstart', e => this._onTouchStart(e, uid), { passive: true });
      itemDiv.addEventListener('touchmove',  e => this._onTouchMove(e, uid),  { passive: false });
      itemDiv.addEventListener('touchend',   e => this._onTouchEnd(e, uid));
    }
  }

  _esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}

customElements.define('todo-list-panel', TodoListPanel);
