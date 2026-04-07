'use strict';

const BUSINESSES = [
  { id: 'lemonade',  name: 'Lemonade Stand',   icon: '🍋', baseCost: 5,           baseIncome: 0.5,      baseDuration: 2,   managerCost: 75,          color: '#f5c842' },
  { id: 'newspaper', name: 'Newspaper Route',   icon: '📰', baseCost: 60,          baseIncome: 6,        baseDuration: 5,   managerCost: 900,         color: '#a8c5f0' },
  { id: 'carwash',   name: 'Car Wash',          icon: '🚗', baseCost: 720,         baseIncome: 55,       baseDuration: 10,  managerCost: 10800,       color: '#6fcf97' },
  { id: 'pizzashop', name: 'Pizza Shop',        icon: '🍕', baseCost: 8640,        baseIncome: 400,      baseDuration: 18,  managerCost: 129600,      color: '#f2994a' },
  { id: 'theater',   name: 'Movie Theater',     icon: '🎬', baseCost: 103680,      baseIncome: 3500,     baseDuration: 28,  managerCost: 1555200,     color: '#bb6bd9' },
  { id: 'bank',      name: 'Bank',              icon: '🏦', baseCost: 1244160,     baseIncome: 28000,    baseDuration: 42,  managerCost: 18662400,    color: '#2d9cdb' },
  { id: 'oilco',     name: 'Oil Company',       icon: '🛢️', baseCost: 14929920,    baseIncome: 200000,   baseDuration: 58,  managerCost: 223948800,   color: '#f2c94c' },
  { id: 'techcorp',  name: 'Tech Corp',         icon: '💻', baseCost: 179159040,   baseIncome: 1800000,  baseDuration: 80,  managerCost: 2687385600,  color: '#56ccf2' },
  { id: 'spaceco',   name: 'Space Agency',      icon: '🚀', baseCost: 2149908480,  baseIncome: 15000000, baseDuration: 110, managerCost: 32248627200, color: '#9b51e0' },
];

const UPGRADES = [
  { id: 'u_lem_1', name: 'Better Lemons',      icon: '🍋', bizId: 'lemonade',  reqOwned: 1,   cost: 30,          incMult: 2,  desc: 'Double Lemonade Stand income' },
  { id: 'u_lem_2', name: 'Secret Recipe',      icon: '📜', bizId: 'lemonade',  reqOwned: 10,  cost: 750,         incMult: 5,  desc: '5× Lemonade Stand income' },
  { id: 'u_lem_3', name: 'Franchise Deal',     icon: '🤝', bizId: 'lemonade',  reqOwned: 25,  cost: 15000,       incMult: 10, desc: '10× Lemonade Stand income' },
  { id: 'u_new_1', name: 'Carbon Bike',        icon: '🚲', bizId: 'newspaper', reqOwned: 1,   cost: 400,         incMult: 2,  desc: 'Double Newspaper income' },
  { id: 'u_new_2', name: 'Digital Edition',    icon: '📱', bizId: 'newspaper', reqOwned: 10,  cost: 9000,        incMult: 5,  desc: '5× Newspaper income' },
  { id: 'u_car_1', name: 'Premium Soap',       icon: '🧼', bizId: 'carwash',   reqOwned: 1,   cost: 5000,        incMult: 2,  desc: 'Double Car Wash income' },
  { id: 'u_car_2', name: 'Auto Dryers',        icon: '💨', bizId: 'carwash',   reqOwned: 10,  cost: 108000,      incMult: 5,  desc: '5× Car Wash income' },
  { id: 'u_car_3', name: 'Express Lane',       icon: '⚡', bizId: 'carwash',   reqOwned: 25,  cost: 2160000,     incMult: 10, desc: '10× Car Wash income' },
  { id: 'u_piz_1', name: 'Wood-Fired Oven',   icon: '🔥', bizId: 'pizzashop', reqOwned: 1,   cost: 65000,       incMult: 2,  desc: 'Double Pizza Shop income' },
  { id: 'u_piz_2', name: 'Online Delivery',   icon: '📲', bizId: 'pizzashop', reqOwned: 10,  cost: 1296000,     incMult: 5,  desc: '5× Pizza Shop income' },
  { id: 'u_the_1', name: '4K Projector',      icon: '📽️', bizId: 'theater',   reqOwned: 1,   cost: 777600,      incMult: 2,  desc: 'Double Theater income' },
  { id: 'u_the_2', name: 'IMAX Screen',       icon: '🎞️', bizId: 'theater',   reqOwned: 10,  cost: 15552000,    incMult: 5,  desc: '5× Theater income' },
  { id: 'u_ban_1', name: 'ATM Network',       icon: '🏧', bizId: 'bank',      reqOwned: 1,   cost: 9331200,     incMult: 2,  desc: 'Double Bank income' },
  { id: 'u_ban_2', name: 'Crypto Division',   icon: '₿',  bizId: 'bank',      reqOwned: 10,  cost: 186624000,   incMult: 5,  desc: '5× Bank income' },
  { id: 'u_oil_1', name: 'Deep Drill',        icon: '⛏️', bizId: 'oilco',     reqOwned: 1,   cost: 111974400,   incMult: 2,  desc: 'Double Oil income' },
  { id: 'u_oil_2', name: 'Offshore Platform', icon: '🛳️', bizId: 'oilco',     reqOwned: 10,  cost: 2238940000,  incMult: 5,  desc: '5× Oil income' },
  { id: 'u_tec_1', name: 'AI Division',       icon: '🤖', bizId: 'techcorp',  reqOwned: 1,   cost: 1343692800,  incMult: 2,  desc: 'Double Tech Corp income' },
  { id: 'u_spc_1', name: 'Reusable Rockets',  icon: '♻️', bizId: 'spaceco',   reqOwned: 1,   cost: 16124313600, incMult: 2,  desc: 'Double Space Agency income' },
];

const MILESTONES = [
  { count: 10,  mult: 2  },
  { count: 25,  mult: 4  },
  { count: 50,  mult: 10 },
  { count: 100, mult: 25 },
  { count: 200, mult: 50 },
];

const ACHIEVEMENTS = [
  { id: 'ach_first_buy',     name: 'Getting Started',     icon: '🏁', desc: 'Buy your first business',        check: s => Object.values(s.businesses).some(b => b.owned >= 1) },
  { id: 'ach_first_manager', name: 'Hands-Free',          icon: '🤵', desc: 'Hire your first manager',        check: s => Object.values(s.businesses).some(b => b.hasManager) },
  { id: 'ach_first_upgrade', name: 'Optimiser',           icon: '⚙️', desc: 'Purchase your first upgrade',    check: s => Object.keys(s.upgrades).length >= 1 },
  { id: 'ach_own_10',        name: 'Scaling Up',          icon: '📈', desc: 'Own 10 of any business',         check: s => Object.values(s.businesses).some(b => b.owned >= 10) },
  { id: 'ach_own_25',        name: 'Franchise Empire',    icon: '🏙️', desc: 'Own 25 of any business',         check: s => Object.values(s.businesses).some(b => b.owned >= 25) },
  { id: 'ach_own_100',       name: 'Monopoly',            icon: '🎩', desc: 'Own 100 of any business',        check: s => Object.values(s.businesses).some(b => b.owned >= 100) },
  { id: 'ach_all_managers',  name: 'Full Delegation',     icon: '👔', desc: 'Hire all 9 managers',            check: s => Object.values(s.businesses).filter(b => b.hasManager).length >= 9 },
  { id: 'ach_earn_1k',       name: 'Thousandaire',        icon: '💵', desc: 'Earn $1,000 total',              check: s => s.totalEarned >= 1000 },
  { id: 'ach_earn_1m',       name: 'Millionaire',         icon: '💰', desc: 'Earn $1,000,000 total',          check: s => s.totalEarned >= 1e6 },
  { id: 'ach_earn_1b',       name: 'Billionaire',         icon: '💎', desc: 'Earn $1,000,000,000 total',      check: s => s.totalEarned >= 1e9 },
  { id: 'ach_prestige_1',    name: 'Rebirth',             icon: '⭐', desc: 'Reach prestige level 1',         check: s => s.prestigeLevel >= 1 },
  { id: 'ach_prestige_5',    name: 'Transcendent',        icon: '🌟', desc: 'Reach prestige level 5',         check: s => s.prestigeLevel >= 5 },
];

module.exports = { BUSINESSES, UPGRADES, MILESTONES, ACHIEVEMENTS };
