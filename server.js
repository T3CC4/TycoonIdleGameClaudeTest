'use strict';

const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const path      = require('path');

const { BUSINESSES, UPGRADES, MILESTONES, ACHIEVEMENTS } = require('./game-data');
const { GameSession } = require('./game-engine');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

// ── View engine ──────────────────────────────────────────────────────────────

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Inject game constants into template once at startup
const GAME_CONSTANTS = JSON.stringify({ BUSINESSES, UPGRADES, MILESTONES, ACHIEVEMENTS });

app.get('/', (_req, res) => {
  res.render('index', {
    businesses:    BUSINESSES,
    upgrades:      UPGRADES,
    milestones:    MILESTONES,
    achievements:  ACHIEVEMENTS,
    gameConstants: GAME_CONSTANTS,
  });
});

// ── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', socket => {
  let session = null;

  // Client sends saved state (from localStorage) immediately after connect
  socket.on('restore', ({ savedState, lastSaveTs } = {}) => {
    if (session) { session.stop(); }

    session = new GameSession(savedState || null, (event, data) => {
      socket.emit(event, data);
    });

    if (lastSaveTs) session.applyOffline(lastSaveTs);

    socket.emit('state', session.initialState());
    session.start();
  });

  socket.on('action', ({ type, payload } = {}) => {
    if (!session) return;
    session.action(type, payload || {});
  });

  socket.on('disconnect', () => {
    if (session) { session.stop(); session = null; }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`Idle Tycoon running → http://localhost:${PORT}`);
});
