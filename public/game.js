'use strict';

// ─── GAME DATA ────────────────────────────────────────────────────────────────

const BUSINESSES = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    icon: '🍋',
    baseCost: 5,
    baseIncome: 1,
    baseDuration: 3,      // seconds per cycle
    managerCost: 50,
  },
  {
    id: 'newspaper',
    name: 'Newspaper Route',
    icon: '📰',
    baseCost: 60,
    baseIncome: 10,
    baseDuration: 6,
    managerCost: 600,
  },
  {
    id: 'carwash',
    name: 'Car Wash',
    icon: '🚗',
    baseCost: 720,
    baseIncome: 80,
    baseDuration: 12,
    managerCost: 7200,
  },
  {
    id: 'pizzashop',
    name: 'Pizza Shop',
    icon: '🍕',
    baseCost: 8640,
    baseIncome: 500,
    baseDuration: 20,
    managerCost: 86400,
  },
  {
    id: 'theater',
    name: 'Movie Theater',
    icon: '🎬',
    baseCost: 103680,
    baseIncome: 4000,
    baseDuration: 30,
    managerCost: 1036800,
  },
  {
    id: 'bank',
    name: 'Bank',
    icon: '🏦',
    baseCost: 1244160,
    baseIncome: 25000,
    baseDuration: 45,
    managerCost: 12441600,
  },
  {
    id: 'oilco',
    name: 'Oil Company',
    icon: '🛢️',
    baseCost: 14929920,
    baseIncome: 200000,
    baseDuration: 60,
    managerCost: 149299200,
  },
  {
    id: 'techcorp',
    name: 'Tech Corp',
    icon: '💻',
    baseCost: 179159040,
    baseIncome: 1500000,
    baseDuration: 90,
    managerCost: 1791590400,
  },
  {
    id: 'spaceco',
    name: 'Space Agency',
    icon: '🚀',
    baseCost: 2149908480,
    baseIncome: 10000000,
    baseDuration: 120,
    managerCost: 21499084800,
  },
];

// Upgrade definitions
const UPGRADES = [
  // Lemonade Stand
  { id: 'u1', name: 'Better Lemons', icon: '🍋', bizId: 'lemonade', reqOwned: 1, cost: 25, mult: 2, desc: 'Double Lemonade Stand income' },
  { id: 'u2', name: 'Secret Recipe', icon: '📜', bizId: 'lemonade', reqOwned: 10, cost: 500, mult: 5, desc: '5x Lemonade Stand income' },
  { id: 'u3', name: 'Franchise Deal', icon: '🤝', bizId: 'lemonade', reqOwned: 25, cost: 10000, mult: 10, desc: '10x Lemonade Stand income' },
  // Newspaper
  { id: 'u4', name: 'Faster Bike', icon: '🚲', bizId: 'newspaper', reqOwned: 1, cost: 300, mult: 2, desc: 'Double Newspaper income' },
  { id: 'u5', name: 'Digital Edition', icon: '📱', bizId: 'newspaper', reqOwned: 10, cost: 6000, mult: 5, desc: '5x Newspaper income' },
  // Car Wash
  { id: 'u6', name: 'Premium Soap', icon: '🧼', bizId: 'carwash', reqOwned: 1, cost: 3600, mult: 2, desc: 'Double Car Wash income' },
  { id: 'u7', name: 'Auto Dryers', icon: '💨', bizId: 'carwash', reqOwned: 10, cost: 72000, mult: 5, desc: '5x Car Wash income' },
  { id: 'u8', name: 'Express Lane', icon: '⚡', bizId: 'carwash', reqOwned: 25, cost: 1440000, mult: 10, desc: '10x Car Wash income' },
  // Pizza
  { id: 'u9', name: 'Wood Oven', icon: '🔥', bizId: 'pizzashop', reqOwned: 1, cost: 43200, mult: 2, desc: 'Double Pizza Shop income' },
  { id: 'u10', name: 'Online Orders', icon: '📲', bizId: 'pizzashop', reqOwned: 10, cost: 864000, mult: 5, desc: '5x Pizza Shop income' },
  // Theater
  { id: 'u11', name: '4K Projector', icon: '📽️', bizId: 'theater', reqOwned: 1, cost: 518400, mult: 2, desc: 'Double Theater income' },
  { id: 'u12', name: 'IMAX Screen', icon: '🎞️', bizId: 'theater', reqOwned: 10, cost: 10368000, mult: 5, desc: '5x Theater income' },
  // Bank
  { id: 'u13', name: 'ATM Network', icon: '🏧', bizId: 'bank', reqOwned: 1, cost: 6220800, mult: 2, desc: 'Double Bank income' },
  { id: 'u14', name: 'Crypto Division', icon: '₿', bizId: 'bank', reqOwned: 10, cost: 124416000, mult: 5, desc: '5x Bank income' },
  // Oil Co
  { id: 'u15', name: 'Deep Drill', icon: '⛏️', bizId: 'oilco', reqOwned: 1, cost: 74649600, mult: 2, desc: 'Double Oil income' },
  { id: 'u16', name: 'Refinery Upgrade', icon: '🏭', bizId: 'oilco', reqOwned: 10, cost: 1492992000, mult: 5, desc: '5x Oil income' },
  // Tech Corp
  { id: 'u17', name: 'AI Division', icon: '🤖', bizId: 'techcorp', reqOwned: 1, cost: 895795200, mult: 2, desc: 'Double Tech Corp income' },
  // Space Agency
  { id: 'u18', name: 'Reusable Rockets', icon: '♻️', bizId: 'spaceco', reqOwned: 1, cost: 10749542400, mult: 2, desc: 'Double Space Agency income' },
];

// Milestone bonuses per business (at these owned counts, get extra multiplier)
const MILESTONES = [
  { count: 10, mult: 2 },
  { count: 25, mult: 4 },
  { count: 50, mult: 10 },
  { count: 100, mult: 25 },
  { count: 200, mult: 50 },
];

// ─── STATE ────────────────────────────────────────────────────────────────────

const DEFAULT_STATE = () => ({
  cash: 5,
  totalEarned: 0,
  prestigeLevel: 0,
  buyMultiplier: 1,
  businesses: Object.fromEntries(BUSINESSES.map(b => [b.id, { owned: 0, progress: 0, running: false, hasManager: false }])),
  upgrades: {},
});

let state = DEFAULT_STATE();
let lastTick = Date.now();

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────

function saveGame() {
  try {
    localStorage.setItem('idleTycoon_v2', JSON.stringify(state));
  } catch (e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem('idleTycoon_v2');
    if (!raw) return;
    const saved = JSON.parse(raw);
    // Merge to handle new fields
    state = Object.assign(DEFAULT_STATE(), saved);
    // Ensure businesses object is complete
    BUSINESSES.forEach(b => {
      if (!state.businesses[b.id]) {
        state.businesses[b.id] = { owned: 0, progress: 0, running: false, hasManager: false };
      }
    });
  } catch (e) {
    state = DEFAULT_STATE();
  }
}

// Offline earnings calculation
function applyOfflineEarnings() {
  const savedTime = parseInt(localStorage.getItem('idleTycoon_lastSave') || '0', 10);
  if (!savedTime) return;
  const elapsed = Math.min((Date.now() - savedTime) / 1000, 3600); // cap at 1 hour
  if (elapsed < 5) return;

  let offlineEarned = 0;
  BUSINESSES.forEach(b => {
    const bState = state.businesses[b.id];
    if (bState.owned > 0 && bState.hasManager) {
      const income = getBusinessIncome(b.id);
      const duration = getBusinessDuration(b.id);
      const cycles = Math.floor(elapsed / duration);
      offlineEarned += income * bState.owned * cycles;
    }
  });

  if (offlineEarned > 0) {
    state.cash += offlineEarned;
    state.totalEarned += offlineEarned;
    showToast(`Welcome back! Earned ${fmt(offlineEarned)} while away.`, 'gold');
  }
}

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────

function prestigeMultiplier() {
  return Math.pow(1.5, state.prestigeLevel);
}

function getUpgradeMultiplier(bizId) {
  let mult = 1;
  UPGRADES.forEach(u => {
    if (u.bizId === bizId && state.upgrades[u.id]) {
      mult *= u.mult;
    }
  });
  return mult;
}

function getMilestoneMultiplier(bizId) {
  const owned = state.businesses[bizId].owned;
  let mult = 1;
  MILESTONES.forEach(m => { if (owned >= m.count) mult = m.mult; });
  return mult;
}

function getBusinessIncome(bizId) {
  const bDef = BUSINESSES.find(b => b.id === bizId);
  return bDef.baseIncome * getUpgradeMultiplier(bizId) * getMilestoneMultiplier(bizId) * prestigeMultiplier();
}

function getBusinessDuration(bizId) {
  return BUSINESSES.find(b => b.id === bizId).baseDuration;
}

function getTotalIncomePerSec() {
  let total = 0;
  BUSINESSES.forEach(b => {
    const bState = state.businesses[b.id];
    if (bState.owned > 0 && bState.hasManager) {
      total += (getBusinessIncome(b.id) * bState.owned) / getBusinessDuration(b.id);
    }
  });
  return total;
}

function getBuyCost(bizId) {
  const bDef = BUSINESSES.find(b => b.id === bizId);
  const owned = state.businesses[bizId].owned;
  const n = state.buyMultiplier;
  // Cost scales geometrically: baseCost * 1.15^owned * (1.15^n - 1) / (1.15 - 1) for n > 1
  if (n === 1) {
    return bDef.baseCost * Math.pow(1.15, owned);
  }
  return bDef.baseCost * Math.pow(1.15, owned) * (Math.pow(1.15, n) - 1) / (1.15 - 1);
}

function getNextMilestone(bizId) {
  const owned = state.businesses[bizId].owned;
  for (const m of MILESTONES) {
    if (owned < m.count) return m.count;
  }
  return null;
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

function buyBusiness(bizId) {
  const cost = getBuyCost(bizId);
  if (state.cash < cost) return;
  state.cash -= cost;
  state.businesses[bizId].owned += state.buyMultiplier;
  // Auto-start if manager is present
  if (state.businesses[bizId].hasManager && !state.businesses[bizId].running) {
    state.businesses[bizId].running = true;
    state.businesses[bizId].progress = 0;
  }
  saveGame();
  renderAll();
}

function buyManager(bizId) {
  const bDef = BUSINESSES.find(b => b.id === bizId);
  const bState = state.businesses[bizId];
  if (bState.hasManager) return;
  if (state.cash < bDef.managerCost) return;
  state.cash -= bDef.managerCost;
  bState.hasManager = true;
  if (bState.owned > 0 && !bState.running) {
    bState.running = true;
    bState.progress = 0;
  }
  saveGame();
  renderAll();
  showToast(`Manager hired for ${bDef.name}!`, 'success');
}

function collectRevenue(bizId) {
  const bState = state.businesses[bizId];
  if (!bState.running || bState.progress < 1) return;
  const earned = getBusinessIncome(bizId) * bState.owned;
  state.cash += earned;
  state.totalEarned += earned;
  bState.progress = 0;
  bState.running = false;
  saveGame();
  showFloatingMoney(earned, `biz-${bizId}`);
}

function startBusiness(bizId) {
  const bState = state.businesses[bizId];
  if (bState.running || bState.owned === 0) return;
  bState.running = true;
  bState.progress = 0;
}

function buyUpgrade(upgradeId) {
  const upg = UPGRADES.find(u => u.id === upgradeId);
  if (!upg || state.upgrades[upgradeId]) return;
  if (state.cash < upg.cost) return;
  state.cash -= upg.cost;
  state.upgrades[upgradeId] = true;
  saveGame();
  renderAll();
  showToast(`Upgrade purchased: ${upg.name}!`, 'success');
}

function prestige() {
  if (!canPrestige()) return;
  if (!confirm(`Prestige resets your progress but gives a permanent ${Math.round(((Math.pow(1.5, state.prestigeLevel + 1) / Math.pow(1.5, state.prestigeLevel)) - 1) * 100)}% income boost. Continue?`)) return;
  state.prestigeLevel += 1;
  const pl = state.prestigeLevel;
  state.cash = 5;
  state.totalEarned = 0;
  state.businesses = Object.fromEntries(BUSINESSES.map(b => [b.id, { owned: 0, progress: 0, running: false, hasManager: false }]));
  state.upgrades = {};
  saveGame();
  renderAll();
  showToast(`Prestige level ${pl}! All income is now x${prestigeMultiplier().toFixed(2)}.`, 'prestige');
}

function canPrestige() {
  return state.totalEarned >= 1e9;
}

function resetGame() {
  if (!confirm('Are you sure you want to reset ALL progress, including prestige? This cannot be undone.')) return;
  localStorage.removeItem('idleTycoon_v2');
  localStorage.removeItem('idleTycoon_lastSave');
  state = DEFAULT_STATE();
  renderAll();
  showToast('Game reset. Good luck!', 'gold');
}

// ─── FORMATTING ──────────────────────────────────────────────────────────────

function fmt(n) {
  if (n < 1000) return '$' + n.toFixed(n < 10 ? 2 : 0);
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let idx = 0;
  while (n >= 1000 && idx < suffixes.length - 1) { n /= 1000; idx++; }
  return '$' + n.toFixed(2) + suffixes[idx];
}

// ─── RENDERING ───────────────────────────────────────────────────────────────

function renderAll() {
  renderHeader();
  renderBusinesses();
  renderUpgrades();
  renderStats();
}

function renderHeader() {
  document.getElementById('cash-display').textContent = fmt(state.cash);
  document.getElementById('income-display').textContent = fmt(getTotalIncomePerSec()) + '/s';
  document.getElementById('total-display').textContent = fmt(state.totalEarned);
}

function renderBusinesses() {
  const container = document.getElementById('businesses-list');
  container.innerHTML = '';

  BUSINESSES.forEach((bDef, idx) => {
    const bState = state.businesses[bDef.id];
    const isUnlocked = idx === 0 || state.businesses[BUSINESSES[idx - 1].id].owned > 0;
    const cost = getBuyCost(bDef.id);
    const canAfford = state.cash >= cost;
    const progress = bState.progress || 0;
    const isComplete = bState.running && progress >= 1;
    const income = getBusinessIncome(bDef.id);
    const duration = getBusinessDuration(bDef.id);
    const managerCost = bDef.managerCost;
    const nextMile = getNextMilestone(bDef.id);

    const card = document.createElement('div');
    card.className = 'business-card' + (isUnlocked ? '' : ' locked');
    card.id = `biz-${bDef.id}`;

    const ownedLabel = bState.owned > 0
      ? `Owned: <strong>${bState.owned}</strong>${nextMile ? ` <span class="milestone-badge">next: x${MILESTONES.find(m=>m.count===nextMile).mult} at ${nextMile}</span>` : ''}`
      : 'Not owned';

    const incomeLabel = bState.owned > 0
      ? `${fmt(income * bState.owned)} / ${duration}s${bState.hasManager ? ' ✅ auto' : ''}`
      : `Base: ${fmt(bDef.baseIncome)} / ${duration}s`;

    const progressBarClass = 'biz-progress-bar' + (bState.hasManager ? ' auto' : '');

    card.innerHTML = `
      <div class="biz-icon">${bDef.icon}</div>
      <div class="biz-info">
        <div class="biz-name">${bDef.name}</div>
        <div class="biz-owned">${ownedLabel}</div>
        <div class="biz-income">${incomeLabel}</div>
        <div class="biz-progress-wrap">
          <div class="${progressBarClass}" id="prog-${bDef.id}" style="width:${(progress * 100).toFixed(1)}%"></div>
        </div>
      </div>
      <div class="biz-actions">
        <button class="btn-buy" id="buy-${bDef.id}" ${!isUnlocked || !canAfford ? 'disabled' : ''}
          onclick="buyBusiness('${bDef.id}')">
          Buy x${state.buyMultiplier}<br><small>${fmt(cost)}</small>
        </button>
        ${bState.owned > 0 && !bState.hasManager ? `
          <button class="btn-manager" id="mgr-${bDef.id}" ${state.cash < managerCost ? 'disabled' : ''}
            onclick="buyManager('${bDef.id}')">
            Manager<br><small>${fmt(managerCost)}</small>
          </button>` : ''}
        ${bState.hasManager ? `<button class="btn-manager hired" disabled>✅ Manager</button>` : ''}
        ${bState.owned > 0 && !bState.hasManager ? `
          <button class="btn-collect" id="col-${bDef.id}" ${!isComplete ? 'disabled' : ''}
            onclick="${isComplete ? `collectRevenue('${bDef.id}')` : `startBusiness('${bDef.id}')`}">
            ${isComplete ? '💰 Collect!' : bState.running ? 'Working...' : '▶ Start'}
          </button>` : ''}
        ${bState.hasManager && isComplete ? `
          <button class="btn-collect" onclick="collectRevenue('${bDef.id}')">💰 Auto collect</button>` : ''}
      </div>
    `;

    // Override start/collect button logic more clearly
    if (bState.owned > 0 && !bState.hasManager) {
      const colBtn = card.querySelector(`#col-${bDef.id}`);
      if (colBtn) {
        if (isComplete) {
          colBtn.textContent = '💰 Collect!';
          colBtn.disabled = false;
          colBtn.onclick = () => collectRevenue(bDef.id);
        } else if (bState.running) {
          colBtn.textContent = '⏳ Working...';
          colBtn.disabled = true;
        } else {
          colBtn.textContent = '▶ Start';
          colBtn.disabled = false;
          colBtn.onclick = () => startBusiness(bDef.id);
        }
      }
    }

    container.appendChild(card);
  });

  // Multiplier buttons
  const multRow = document.createElement('div');
  multRow.className = 'buy-multiplier';
  multRow.style.marginTop = '8px';
  [1, 10, 100].forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'mult-btn' + (state.buyMultiplier === n ? ' active' : '');
    btn.textContent = `x${n}`;
    btn.onclick = () => { state.buyMultiplier = n; renderAll(); };
    multRow.appendChild(btn);
  });
  container.prepend(multRow);
}

function renderUpgrades() {
  const container = document.getElementById('upgrades-list');
  container.innerHTML = '';

  const visible = UPGRADES.filter(u => {
    const owned = state.businesses[u.bizId].owned;
    return owned >= u.reqOwned || state.upgrades[u.id];
  });

  if (visible.length === 0) {
    container.innerHTML = '<p class="empty-msg">Buy businesses to unlock upgrades.</p>';
    return;
  }

  visible.forEach(u => {
    const purchased = !!state.upgrades[u.id];
    const canAfford = state.cash >= u.cost;
    const card = document.createElement('div');
    card.className = 'upgrade-card' + (purchased ? ' purchased' : (canAfford ? '' : ' cant-afford'));
    card.innerHTML = `
      <div class="upg-icon">${u.icon}</div>
      <div class="upg-info">
        <div class="upg-name">${u.name}</div>
        <div class="upg-desc">${u.desc}</div>
      </div>
      <div class="upg-cost">${purchased ? '✅' : fmt(u.cost)}</div>
    `;
    if (!purchased) {
      card.onclick = () => buyUpgrade(u.id);
    }
    container.appendChild(card);
  });
}

function renderStats() {
  const totalOwned = Object.values(state.businesses).reduce((s, b) => s + b.owned, 0);
  const totalManagers = Object.values(state.businesses).filter(b => b.hasManager).length;
  const totalUpgrades = Object.keys(state.upgrades).length;

  document.getElementById('stat-biz').textContent = totalOwned;
  document.getElementById('stat-mgr').textContent = totalManagers;
  document.getElementById('stat-upg').textContent = totalUpgrades;
  document.getElementById('stat-prestige').textContent = state.prestigeLevel;
  document.getElementById('stat-prestige-bonus').textContent = `x${prestigeMultiplier().toFixed(2)}`;

  const prestigeBtn = document.getElementById('prestige-btn');
  prestigeBtn.style.display = canPrestige() ? 'block' : 'none';
  document.getElementById('prestige-mult').textContent = Math.pow(1.5, state.prestigeLevel + 1).toFixed(2);
}

// ─── GAME LOOP ────────────────────────────────────────────────────────────────

let frameCount = 0;

function gameLoop() {
  const now = Date.now();
  const dt = Math.min((now - lastTick) / 1000, 0.5); // seconds, capped
  lastTick = now;

  let anyChanged = false;

  BUSINESSES.forEach(bDef => {
    const bState = state.businesses[bDef.id];
    if (!bState.running || bState.owned === 0) return;

    const duration = getBusinessDuration(bDef.id);
    bState.progress = Math.min(1, (bState.progress || 0) + dt / duration);

    // Update just the progress bar element directly (fast path)
    const bar = document.getElementById(`prog-${bDef.id}`);
    if (bar) bar.style.width = (bState.progress * 100).toFixed(2) + '%';

    if (bState.progress >= 1) {
      if (bState.hasManager) {
        // Auto collect
        const earned = getBusinessIncome(bDef.id) * bState.owned;
        state.cash += earned;
        state.totalEarned += earned;
        bState.progress = 0;
        anyChanged = true;
        showFloatingMoney(earned, `biz-${bDef.id}`);
      } else {
        // Wait for manual collect — update button
        anyChanged = true;
      }
    }
  });

  frameCount++;

  // Every 10 frames (~166ms at 60fps) update header
  if (frameCount % 10 === 0) {
    renderHeader();
  }

  // Every 60 frames (~1s) do full re-render and save
  if (frameCount % 60 === 0) {
    renderAll();
    saveGame();
    localStorage.setItem('idleTycoon_lastSave', Date.now().toString());
  }

  requestAnimationFrame(gameLoop);
}

// ─── TOAST & FLOATING MONEY ──────────────────────────────────────────────────

function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function showFloatingMoney(amount, anchorId) {
  const anchor = document.getElementById(anchorId);
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-money';
  el.textContent = '+' + fmt(amount);
  el.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  el.style.top = (rect.top + window.scrollY - 10) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  loadGame();
  applyOfflineEarnings();

  // Wire up prestige and reset buttons
  document.getElementById('prestige-btn').addEventListener('click', prestige);
  document.getElementById('reset-btn').addEventListener('click', resetGame);

  renderAll();
  lastTick = Date.now();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);

// Expose to global for inline handlers
window.buyBusiness = buyBusiness;
window.buyManager = buyManager;
window.collectRevenue = collectRevenue;
window.startBusiness = startBusiness;
window.buyUpgrade = buyUpgrade;
