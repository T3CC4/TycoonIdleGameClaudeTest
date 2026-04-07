'use strict';

// ── Constants from server ─────────────────────────────────────────────────────
const { BUSINESSES, UPGRADES, MILESTONES, ACHIEVEMENTS } = window.GAME_CONSTANTS;

// ── Client state ──────────────────────────────────────────────────────────────
let qty     = 1;
let state   = null;   // latest full state from server
let socket  = null;
let bizProgress = {}; // latest progress percentages from tick

// ── Socket setup ──────────────────────────────────────────────────────────────

function connect() {
  socket = io({ transports: ['websocket'] });

  socket.on('connect', () => {
    setConn(true);
    const saved      = tryLoad('it_state');
    const lastSaveTs = parseInt(tryLoad('it_last_save') || '0', 10);
    socket.emit('restore', { savedState: saved, lastSaveTs });
  });

  socket.on('disconnect', () => setConn(false));

  // Full state re-render (after any action or every ~5s)
  socket.on('state', newState => {
    state = newState;
    renderFull();
  });

  // Lightweight tick: progress bars + HUD
  socket.on('tick', data => {
    bizProgress = data.progress;
    updateHUD(data.cash, data.totalEarned, data.ips);
    updateProgressBars(data.progress, data.earned || {});
    updateCollectButtons(data.progress);
  });

  // Manual collect confirmation from server
  socket.on('collect', ({ bizId, amount }) => {
    floatMoney(amount, `biz-${bizId}`);
  });

  socket.on('toast', ({ msg, type }) => showToast(msg, type));

  socket.on('achievement', ach => {
    unlockAchievement(ach);
    showAchievementPopup(ach);
  });

  socket.on('save', newState => {
    state = newState;
    trySave('it_state', newState);
    trySave('it_last_save', Date.now().toString());
  });
}

// ── Actions ───────────────────────────────────────────────────────────────────

function sendAction(type, payload) {
  if (!socket || !socket.connected) return;
  socket.emit('action', { type, payload: { ...payload, qty } });
}

// Unified handler for the start/collect button
function handleActionBtn(bizId) {
  if (!state) return;
  const bs = state.businesses[bizId];
  if (!bs) return;
  if (bs.progress >= 1 && bs.running) {
    sendAction('collect', { bizId });
    floatMoney(bs.income * bs.owned, `biz-${bizId}`);
  } else if (!bs.running) {
    sendAction('start', { bizId });
  }
}

function doPrestige() {
  if (!state || !state.canPrestige) return;
  if (!confirm(`Prestige resets your progress but grants a permanent income bonus (×${(state.prestigeMult * 1.5).toFixed(2)} total). Continue?`)) return;
  sendAction('prestige', {});
}

function doReset() {
  if (!confirm('Reset ALL progress including prestige? This cannot be undone.')) return;
  trySave('it_state', null);
  trySave('it_last_save', null);
  sendAction('reset', {});
}

// ── Render: full ──────────────────────────────────────────────────────────────

function renderFull() {
  if (!state) return;
  renderHUD();
  renderBusinesses();
  renderUpgrades();
  renderStats();
  renderAchievements();
}

function renderHUD() {
  updateHUD(state.cash, state.totalEarned, state.ips);
}

function updateHUD(cash, total, ips) {
  setText('hud-cash',  fmt(cash));
  setText('hud-ips',   fmt(ips) + '/s');
  setText('hud-total', fmt(total));
}

function renderBusinesses() {
  BUSINESSES.forEach((bDef, idx) => {
    const bs = state.businesses[bDef.id];
    if (!bs) return;

    const isUnlocked = idx === 0 || (state.businesses[BUSINESSES[idx - 1].id]?.owned > 0);
    const card       = document.getElementById(`biz-${bDef.id}`);
    if (!card) return;

    card.classList.toggle('locked', !isUnlocked);

    // Owned badge
    setText(`badge-${bDef.id}`, `×${bs.owned}`);

    // Sub-label
    const subEl = document.getElementById(`sub-${bDef.id}`);
    if (subEl) {
      if (!isUnlocked) {
        subEl.textContent = 'Locked — buy the previous business first';
      } else if (bs.owned > 0) {
        const milestoneTxt = (() => {
          for (const m of MILESTONES) if (bs.owned < m.count) return ` · next ×${m.mult} @ ${m.count}`;
          return '';
        })();
        subEl.textContent = `${fmt(bs.income * bs.owned)} / ${bDef.baseDuration}s${milestoneTxt}`;
        if (bs.hasManager) subEl.textContent += ' · auto ✓';
      } else {
        subEl.textContent = `Base: ${fmt(bDef.baseIncome)} / ${bDef.baseDuration}s`;
      }
    }

    // Buy button
    const costKey  = qty === 1 ? 'buyCost1' : qty === 10 ? 'buyCost10' : 'buyCost100';
    const cost     = bs[costKey];
    const buyBtn   = document.getElementById(`buy-${bDef.id}`);
    if (buyBtn) {
      const canAfford = state.cash >= cost;
      buyBtn.disabled = !isUnlocked || !canAfford;
      setText(`cost-${bDef.id}`, fmt(cost));
      buyBtn.querySelector('.btn-label').textContent = `Buy ×${qty}`;
      buyBtn.setAttribute('onclick', `sendAction('buy_business',{bizId:'${bDef.id}'})`);
    }

    // Manager button
    const mgrBtn = document.getElementById(`mgr-${bDef.id}`);
    if (mgrBtn) {
      if (bs.owned === 0 || bs.hasManager) {
        mgrBtn.style.display = 'none';
      } else {
        mgrBtn.style.display = '';
        mgrBtn.disabled      = state.cash < bDef.managerCost;
        mgrBtn.classList.toggle('hired', bs.hasManager);
        setText(`mgr-cost-${bDef.id}`, fmt(bDef.managerCost));
      }
    }

    // Action button (start / collect)
    const actBtn = document.getElementById(`act-${bDef.id}`);
    if (actBtn) {
      if (bs.owned === 0 || bs.hasManager) {
        actBtn.style.display = 'none';
      } else {
        actBtn.style.display = '';
        const prog = bizProgress[bDef.id] ?? bs.progress;
        actBtn.disabled = bs.running && prog < 1;
        actBtn.textContent = prog >= 1 ? '💰 Collect!' : bs.running ? '⏳ Running…' : '▶ Start';
        actBtn.classList.toggle('ready', prog >= 1);
      }
    }
  });
}

function renderUpgrades() {
  const el = document.getElementById('upg-list');
  if (!el || !state) return;

  const visible = UPGRADES.filter(u => (state.businesses[u.bizId]?.owned ?? 0) >= u.reqOwned || state.upgrades[u.id]);
  if (visible.length === 0) {
    el.innerHTML = '<p class="empty-hint">Buy businesses to unlock upgrades.</p>';
    return;
  }

  el.innerHTML = '';
  visible.forEach(u => {
    const purchased = !!state.upgrades[u.id];
    const canAfford = state.cash >= u.cost;
    const div = document.createElement('div');
    div.className = 'upg-card' + (purchased ? ' purchased' : canAfford ? ' affordable' : '');
    div.innerHTML = `
      <span class="upg-icon">${u.icon}</span>
      <div class="upg-body">
        <div class="upg-name">${u.name}</div>
        <div class="upg-desc">${u.desc}</div>
      </div>
      <span class="upg-cost">${purchased ? '✓' : fmt(u.cost)}</span>`;
    if (!purchased) div.addEventListener('click', () => sendAction('buy_upgrade', { upgradeId: u.id }));
    el.appendChild(div);
  });
}

function renderAchievements() {
  if (!state) return;
  const unlocked = Object.keys(state.achievements).length;
  setText('ach-count', `${unlocked}/${ACHIEVEMENTS.length}`);
  setText('stat-ach',  `${unlocked}/${ACHIEVEMENTS.length}`);
  ACHIEVEMENTS.forEach(a => {
    const tile = document.getElementById(`ach-${a.id}`);
    if (tile) tile.classList.toggle('locked', !state.achievements[a.id]);
  });
}

function renderStats() {
  if (!state) return;
  setText('stat-ips', fmt(state.ips) + '/s');
  setText('stat-pl',  state.prestigeLevel);
  setText('stat-pm',  `×${state.prestigeMult?.toFixed(2) ?? '1.00'}`);
  setText('stat-upg', Object.keys(state.upgrades || {}).length);

  // Prestige progress bar (0 → $1B)
  const infoEl = document.getElementById('prestige-info');
  const barEl  = document.getElementById('prestige-bar');
  const hintEl = document.getElementById('prestige-hint');
  if (infoEl && barEl) {
    const pct = Math.min(1, (state.totalEarned || 0) / 1e9);
    infoEl.style.display = '';
    barEl.style.width = (pct * 100).toFixed(2) + '%';
    if (hintEl) hintEl.textContent = state.canPrestige ? 'Ready to prestige!' : `${(pct * 100).toFixed(1)}% to prestige`;
  }

  const prestigeBtn = document.getElementById('btn-prestige');
  if (prestigeBtn) {
    prestigeBtn.style.display = state.canPrestige ? '' : 'none';
    const nextMult = (state.prestigeMult * 1.5).toFixed(2);
    const nmEl = document.getElementById('prestige-next-mult');
    if (nmEl) nmEl.textContent = nextMult;
  }
}

// ── Tick-driven updates ───────────────────────────────────────────────────────

function updateProgressBars(progress, earned) {
  for (const [bizId, pct] of Object.entries(progress)) {
    const bar = document.getElementById(`bar-${bizId}`);
    if (bar) bar.style.width = (pct * 100).toFixed(2) + '%';
    if (earned[bizId]) floatMoney(earned[bizId], `biz-${bizId}`);
  }
}

function updateCollectButtons(progress) {
  if (!state) return;
  for (const [bizId, pct] of Object.entries(progress)) {
    const bs    = state.businesses[bizId];
    if (!bs || bs.hasManager) continue;
    const actBtn = document.getElementById(`act-${bizId}`);
    if (!actBtn || actBtn.style.display === 'none') continue;
    const ready = pct >= 1;
    actBtn.disabled   = bs.running && !ready;
    actBtn.textContent = ready ? '💰 Collect!' : bs.running ? '⏳ Running…' : '▶ Start';
    actBtn.classList.toggle('ready', ready);
    // Keep bizProgress in sync
    bizProgress[bizId] = pct;
    if (bs) bs.progress = pct;
  }
}

// ── Unlock achievement tile (no popup — popup comes via socket event) ─────────

function unlockAchievement({ id }) {
  const tile = document.getElementById(`ach-${id}`);
  if (tile) tile.classList.remove('locked');
  if (state) {
    const unlocked = Object.keys(state.achievements).length;
    setText('ach-count', `${unlocked}/${ACHIEVEMENTS.length}`);
    setText('stat-ach',  `${unlocked}/${ACHIEVEMENTS.length}`);
  }
}

function showAchievementPopup({ icon, name, desc }) {
  const popup = document.getElementById('ach-popup');
  document.getElementById('ach-popup-icon').textContent  = icon;
  document.getElementById('ach-popup-title').textContent = name;
  document.getElementById('ach-popup-desc').textContent  = desc;
  popup.style.display = 'flex';
  popup.classList.remove('hide');
  clearTimeout(popup._timer);
  popup._timer = setTimeout(() => {
    popup.classList.add('hide');
    setTimeout(() => { popup.style.display = 'none'; }, 500);
  }, 3500);
}

// ── Quantity switcher ─────────────────────────────────────────────────────────

document.querySelectorAll('.qty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    qty = parseInt(btn.dataset.qty, 10);
    if (state) renderBusinesses();
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setConn(online) {
  const dot = document.getElementById('conn-dot');
  if (!dot) return;
  dot.className = 'conn-dot ' + (online ? 'connected' : 'disconnected');
  dot.title = online ? 'Connected' : 'Disconnected';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function fmt(n) {
  if (n == null || isNaN(n)) return '$0';
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
  let i = 0;
  while (n >= 1000 && i < suffixes.length - 1) { n /= 1000; i++; }
  return '$' + (i === 0 ? n.toFixed(n < 10 ? 2 : 0) : n.toFixed(2)) + suffixes[i];
}

function showToast(msg, type = '') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3200);
}

function floatMoney(amount, anchorId) {
  const anchor = document.getElementById(anchorId);
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-money';
  el.textContent = '+' + fmt(amount);
  el.style.left = (rect.left + rect.width / 2 - 24) + 'px';
  el.style.top  = (rect.top + window.scrollY + 10) + 'px';
  document.getElementById('floats').appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function tryLoad(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function trySave(key, val) {
  try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Boot ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', connect);

// Expose for EJS inline handlers
window.sendAction    = sendAction;
window.handleActionBtn = handleActionBtn;
window.doPrestige    = doPrestige;
window.doReset       = doReset;
