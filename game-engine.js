'use strict';

const { BUSINESSES, UPGRADES, MILESTONES, ACHIEVEMENTS } = require('./game-data');

const COST_SCALE = 1.15;
const TICK_MS    = 100;  // server tick interval
const SAVE_MS    = 5000;

function defaultState() {
  return {
    cash: 5,
    totalEarned: 0,
    prestigeLevel: 0,
    achievements: {},
    businesses: Object.fromEntries(
      BUSINESSES.map(b => [b.id, { owned: 0, progress: 0, running: false, hasManager: false }])
    ),
    upgrades: {},
  };
}

// ── Pure calculations ──────────────────────────────────────────────────────────

function prestigeMult(state) {
  return Math.pow(1.5, state.prestigeLevel);
}

function upgradeMult(bizId, state) {
  let m = 1;
  for (const u of UPGRADES) {
    if (u.bizId === bizId && state.upgrades[u.id]) m *= u.incMult;
  }
  return m;
}

function milestoneMult(bizId, state) {
  const owned = state.businesses[bizId].owned;
  let m = 1;
  for (const ms of MILESTONES) { if (owned >= ms.count) m = ms.mult; }
  return m;
}

function businessIncome(bizId, state) {
  const def = BUSINESSES.find(b => b.id === bizId);
  return def.baseIncome * upgradeMult(bizId, state) * milestoneMult(bizId, state) * prestigeMult(state);
}

function businessDuration(bizId) {
  return BUSINESSES.find(b => b.id === bizId).baseDuration;
}

function buyCost(bizId, qty, state) {
  const def = BUSINESSES.find(b => b.id === bizId);
  const owned = state.businesses[bizId].owned;
  if (qty === 1) return def.baseCost * Math.pow(COST_SCALE, owned);
  return def.baseCost * Math.pow(COST_SCALE, owned) * (Math.pow(COST_SCALE, qty) - 1) / (COST_SCALE - 1);
}

function totalIncomePerSec(state) {
  let total = 0;
  for (const b of BUSINESSES) {
    const bs = state.businesses[b.id];
    if (bs.owned > 0 && bs.hasManager) {
      total += (businessIncome(b.id, state) * bs.owned) / businessDuration(b.id);
    }
  }
  return total;
}

function offlineEarnings(state, elapsedSec) {
  const secs = Math.min(elapsedSec, 3600);
  let total = 0;
  for (const b of BUSINESSES) {
    const bs = state.businesses[b.id];
    if (bs.owned > 0 && bs.hasManager) {
      const dur = businessDuration(b.id);
      const cycles = Math.floor(secs / dur);
      total += businessIncome(b.id, state) * bs.owned * cycles;
    }
  }
  return total;
}

// ── GameSession class ──────────────────────────────────────────────────────────

class GameSession {
  constructor(savedState, onEvent) {
    this.state = savedState ? this._migrate(savedState) : defaultState();
    this.emit  = onEvent; // fn(eventName, data)
    this._lastTick = Date.now();
    this._tickTimer = null;
    this._saveTimer = null;
  }

  _migrate(saved) {
    const fresh = defaultState();
    const s = Object.assign(fresh, saved);
    // Ensure every business entry exists
    BUSINESSES.forEach(b => {
      if (!s.businesses[b.id]) {
        s.businesses[b.id] = { owned: 0, progress: 0, running: false, hasManager: false };
      }
    });
    if (!s.achievements) s.achievements = {};
    return s;
  }

  start() {
    this._tickTimer = setInterval(() => this._tick(), TICK_MS);
    this._saveTimer = setInterval(() => this._requestSave(), SAVE_MS);
  }

  stop() {
    clearInterval(this._tickTimer);
    clearInterval(this._saveTimer);
  }

  applyOffline(lastSaveTs) {
    const elapsed = (Date.now() - lastSaveTs) / 1000;
    if (elapsed < 5) return;
    const earned = offlineEarnings(this.state, elapsed);
    if (earned > 0) {
      this.state.cash += earned;
      this.state.totalEarned += earned;
      this.emit('toast', { msg: `Welcome back! Earned ${formatMoney(earned)} offline.`, type: 'gold' });
    }
  }

  // ── Tick ────────────────────────────────────────────────────────────────────

  _tick() {
    const now = Date.now();
    const dt  = Math.min((now - this._lastTick) / 1000, 0.5);
    this._lastTick = now;

    const earned = {}; // bizId → amount auto-collected this tick

    for (const b of BUSINESSES) {
      const bs = this.state.businesses[b.id];
      if (!bs.running || bs.owned === 0) continue;

      bs.progress = Math.min(1, (bs.progress || 0) + dt / businessDuration(b.id));

      if (bs.progress >= 1 && bs.hasManager) {
        const amount = businessIncome(b.id, this.state) * bs.owned;
        this.state.cash       += amount;
        this.state.totalEarned += amount;
        bs.progress = 0;
        earned[b.id] = amount;
      }
    }

    this._checkAchievements();

    const progMap = {};
    for (const b of BUSINESSES) progMap[b.id] = this.state.businesses[b.id].progress || 0;

    this.emit('tick', {
      cash:       this.state.cash,
      totalEarned:this.state.totalEarned,
      ips:        totalIncomePerSec(this.state),
      progress:   progMap,
      earned,
    });
  }

  _checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      if (this.state.achievements[ach.id]) continue;
      if (ach.check(this.state)) {
        this.state.achievements[ach.id] = true;
        this.emit('achievement', { id: ach.id, name: ach.name, icon: ach.icon, desc: ach.desc });
      }
    }
  }

  _requestSave() {
    this.emit('save', this.state);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  action(type, payload) {
    let changed = false;
    switch (type) {
      case 'buy_business':  changed = this._buyBusiness(payload.bizId, payload.qty || 1);  break;
      case 'buy_manager':   changed = this._buyManager(payload.bizId);                      break;
      case 'start':         changed = this._startBusiness(payload.bizId);                   break;
      case 'collect':       changed = this._collect(payload.bizId);                         break;
      case 'buy_upgrade':   changed = this._buyUpgrade(payload.upgradeId);                  break;
      case 'prestige':      changed = this._prestige();                                     break;
      case 'reset':         changed = this._reset();                                        break;
    }
    if (changed) {
      this._checkAchievements();
      this.emit('state', this._clientState());
    }
  }

  _buyBusiness(bizId, qty) {
    const cost = buyCost(bizId, qty, this.state);
    if (this.state.cash < cost) return false;
    this.state.cash -= cost;
    this.state.businesses[bizId].owned += qty;
    const bs = this.state.businesses[bizId];
    if (bs.hasManager && !bs.running) { bs.running = true; bs.progress = 0; }
    return true;
  }

  _buyManager(bizId) {
    const def = BUSINESSES.find(b => b.id === bizId);
    const bs  = this.state.businesses[bizId];
    if (bs.hasManager || this.state.cash < def.managerCost) return false;
    this.state.cash -= def.managerCost;
    bs.hasManager = true;
    if (bs.owned > 0 && !bs.running) { bs.running = true; bs.progress = 0; }
    this.emit('toast', { msg: `Manager hired for ${def.name}!`, type: 'success' });
    return true;
  }

  _startBusiness(bizId) {
    const bs = this.state.businesses[bizId];
    if (bs.running || bs.owned === 0) return false;
    bs.running = true; bs.progress = 0;
    return true;
  }

  _collect(bizId) {
    const bs = this.state.businesses[bizId];
    if (!bs.running || bs.progress < 1) return false;
    const amount = businessIncome(bizId, this.state) * bs.owned;
    this.state.cash       += amount;
    this.state.totalEarned += amount;
    bs.progress = 0; bs.running = false;
    this.emit('collect', { bizId, amount });
    return true;
  }

  _buyUpgrade(upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId);
    if (!upg || this.state.upgrades[upgradeId] || this.state.cash < upg.cost) return false;
    this.state.cash -= upg.cost;
    this.state.upgrades[upgradeId] = true;
    this.emit('toast', { msg: `Upgrade: ${upg.name} — ${upg.desc}`, type: 'success' });
    return true;
  }

  _prestige() {
    if (this.state.totalEarned < 1e9) return false;
    this.state.prestigeLevel += 1;
    const mult = prestigeMult(this.state);
    this.state.cash = 5;
    this.state.totalEarned = 0;
    this.state.businesses = Object.fromEntries(
      BUSINESSES.map(b => [b.id, { owned: 0, progress: 0, running: false, hasManager: false }])
    );
    this.state.upgrades = {};
    this.emit('toast', { msg: `Prestige ${this.state.prestigeLevel}! All income ×${mult.toFixed(2)} forever.`, type: 'prestige' });
    return true;
  }

  _reset() {
    this.state = defaultState();
    return true;
  }

  // ── Public helpers ───────────────────────────────────────────────────────────

  /** Full state snapshot sent to client for re-render */
  _clientState() {
    const s = this.state;
    return {
      cash:          s.cash,
      totalEarned:   s.totalEarned,
      ips:           totalIncomePerSec(s),
      prestigeLevel: s.prestigeLevel,
      prestigeMult:  prestigeMult(s),
      canPrestige:   s.totalEarned >= 1e9,
      achievements:  s.achievements,
      businesses: Object.fromEntries(BUSINESSES.map(b => {
        const bs = s.businesses[b.id];
        return [b.id, {
          owned:      bs.owned,
          progress:   bs.progress || 0,
          running:    bs.running,
          hasManager: bs.hasManager,
          income:     businessIncome(b.id, s),
          buyCost1:   buyCost(b.id, 1, s),
          buyCost10:  buyCost(b.id, 10, s),
          buyCost100: buyCost(b.id, 100, s),
          nextMilestoneAt: (() => { for (const m of MILESTONES) if (bs.owned < m.count) return m.count; return null; })(),
          milestoneMult: milestoneMult(b.id, s),
        }];
      })),
      upgrades: s.upgrades,
    };
  }

  initialState() {
    return this._clientState();
  }
}

function formatMoney(n) {
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
  let i = 0;
  while (n >= 1000 && i < suffixes.length - 1) { n /= 1000; i++; }
  return '$' + (i === 0 ? n.toFixed(n < 10 ? 2 : 0) : n.toFixed(2)) + suffixes[i];
}

module.exports = { GameSession };
