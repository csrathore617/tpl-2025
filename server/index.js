require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const excel = require('./excel.service');
const auction = require('./auction.engine');
const driveService = require('./drive.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const JWT_SECRET = process.env.JWT_SECRET || 'tpl2026-secret-key';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync(process.env.ADMIN_PASS || 'tpl2026admin', 10);
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const ALLOWED_IMG = ['.jpg','.jpeg','.png','.webp'];
const galleryUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED_IMG.includes(ext));
  }
});

const seasonUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED_IMG.includes(ext));
  }
});

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:4200'], credentials: true }));
app.use(express.json());

// ---- Shared image upload helper ----
async function uploadImageIfDrive(file) {
  if (!file) return '';
  if (!driveService.DRIVE_ENABLED) throw new Error('Google Drive is not configured; local image storage is disabled');
  const filename = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
  const driveFile = await driveService.uploadImageToDrive(file.buffer, filename, file.mimetype);
  if (!driveFile || !driveFile.id) throw new Error('Google Drive did not return an image ID');
  return driveService.getDriveImageUrl(driveFile.id);
}

// ---- Auth middleware ----
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function authTeamOwner(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ---- Auth routes ----
app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USER || !bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: 'admin', username });
});

app.post('/api/auth/team/login', async (req, res) => {
  const { teamId, password } = req.body;
  try {
    const team = await excel.getTeamById(teamId);
    if (!team) return res.status(401).json({ error: 'Team not found' });
    if (team.owner_contact !== password) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ teamId, teamName: team.team_name, role: 'team_owner' }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: 'team_owner', teamId, teamName: team.team_name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Player routes ----
app.get('/api/players', async (req, res) => {
  try {
    const players = await excel.getPlayers();
    const safe = players.map(p => {
      const { mobile, email, address, emergency_contact, ...pub } = p;
      return pub;
    });
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    const p = await excel.getPlayerById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Player not found' });
    const { mobile, email, address, emergency_contact, ...pub } = p;
    res.json(pub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/players/register', upload.single('photo'), async (req, res) => {
  try {
    const players = await excel.getPlayers();
    const { name, dob, mobile, email, city, address, role, batting_style, bowling_style,
      experience, preferred_position, jersey_number, emergency_contact } = req.body;

    if (!name || !mobile || !email || !role) return res.status(400).json({ error: 'Name, mobile, email and role are required' });
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ error: 'Invalid mobile number' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (players.find(p => p.mobile === mobile)) return res.status(400).json({ error: 'Player with this mobile already registered' });

    const count = players.length + 1;
    const player_id = `TPL26-P${String(count).padStart(3, '0')}`;
    const photo = await uploadImageIfDrive(req.file);
    const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 3600 * 1000)) : '';

    const player = {
      player_id, name, photo, dob: dob || '', age, mobile, email,
      city: city || '', address: address || '', role,
      batting_style: batting_style || '', bowling_style: bowling_style || '',
      experience: experience || '', preferred_position: preferred_position || '',
      jersey_number: jersey_number || '', emergency_contact: emergency_contact || '',
      registration_date: new Date().toISOString(), status: 'REGISTERED',
      team_id: '', final_bid: ''
    };
    await excel.savePlayer(player);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'PLAYER_REGISTERED', entity: 'Player', entity_id: player_id, prev_value: '', new_value: 'REGISTERED', created_at: new Date().toISOString(), admin: 'public' });
    res.status(201).json({ message: 'Registration successful', player_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/players/:id', authAdmin, upload.single('photo'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.photo = await uploadImageIfDrive(req.file);
    const prev = await excel.getPlayerById(req.params.id);
    const updated = await excel.updatePlayer(req.params.id, updates);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'PLAYER_UPDATED', entity: 'Player', entity_id: req.params.id, prev_value: JSON.stringify(prev), new_value: JSON.stringify(updates), created_at: new Date().toISOString(), admin: req.user.username });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/players/:id', authAdmin, async (req, res) => {
  try {
    await excel.deletePlayer(req.params.id);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'PLAYER_DELETED', entity: 'Player', entity_id: req.params.id, prev_value: '', new_value: 'DELETED', created_at: new Date().toISOString(), admin: req.user.username });
    res.json({ message: 'Player deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Team routes ----
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await excel.getTeams();
    const safe = teams.map(t => { const { owner_contact, ...pub } = t; return pub; });
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/teams/:id', async (req, res) => {
  try {
    const t = await excel.getTeamById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Team not found' });
    const { owner_contact, ...pub } = t;
    res.json(pub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/teams', authAdmin, upload.single('logo'), async (req, res) => {
  try {
    const teams = await excel.getTeams();
    const settings = await excel.getSettings();
    const maxTeams = parseInt(settings.maxTeams) || 5;
    const active = teams.filter(t => t.status !== 'INACTIVE');
    if (active.length >= maxTeams) return res.status(400).json({ error: `Maximum ${maxTeams} teams allowed` });

    const { team_name, short_name, owner_name, owner_contact, city, team_color } = req.body;
    if (!team_name || !owner_name) return res.status(400).json({ error: 'Team name and owner name required' });
    if (teams.find(t => t.team_name.toLowerCase() === team_name.toLowerCase())) return res.status(400).json({ error: 'Team name already exists' });

    const count = teams.length + 1;
    const team_id = `TPL26-T${String(count).padStart(2, '0')}`;
    const logo = await uploadImageIfDrive(req.file);
    const initialPurse = parseInt(settings.initialPurse) || 21000;

    const team = {
      team_id, team_name, short_name: short_name || team_name.substring(0, 3).toUpperCase(),
      logo, owner_name, owner_contact: owner_contact || '', city: city || '',
      team_color: team_color || '#1a73e8', status: 'REGISTERED',
      initial_purse: initialPurse, remaining_purse: initialPurse,
      players_count: 0, registration_date: new Date().toISOString()
    };
    await excel.saveTeam(team);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'TEAM_ADDED', entity: 'Team', entity_id: team_id, prev_value: '', new_value: team_name, created_at: new Date().toISOString(), admin: req.user.username });
    res.status(201).json(team);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/teams/:id', authAdmin, upload.single('logo'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.logo = await uploadImageIfDrive(req.file);
    const updated = await excel.updateTeam(req.params.id, updates);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'TEAM_UPDATED', entity: 'Team', entity_id: req.params.id, prev_value: '', new_value: JSON.stringify(updates), created_at: new Date().toISOString(), admin: req.user.username });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Auction routes ----
app.get('/api/auction/current', async (req, res) => {
  try {
    const state = auction.getState();
    const settings = await excel.getSettings();
    const bidIncrement = parseInt(settings.bidIncrement) || 100;
    const baseBid = parseInt(settings.baseBid) || 100;
    const minNextBid = state.currentBid === 0 ? baseBid : state.currentBid + bidIncrement;
    res.json({ ...state, minNextBid, baseBid, bidIncrement });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auction/history', async (req, res) => {
  try {
    const auctions = await excel.getAuctions();
    res.json(auctions.filter(a => ['SOLD', 'UNSOLD'].includes(a.status)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auction/bids/:auctionId', async (req, res) => {
  try {
    const bids = await excel.getBids(req.params.auctionId);
    res.json(bids.sort((a, b) => new Date(b.bid_time) - new Date(a.bid_time)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/auction/select-player/:playerId', authAdmin, async (req, res) => {
  try {
    const player = await auction.selectPlayer(req.params.playerId);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'PLAYER_SELECTED', entity: 'Player', entity_id: req.params.playerId, prev_value: '', new_value: 'SELECTED', created_at: new Date().toISOString(), admin: req.user.username });
    res.json(player);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/random-player', authAdmin, async (req, res) => {
  try {
    const result = await auction.randomPlayer();
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/start', authAdmin, async (req, res) => {
  try {
    const result = await auction.startAuction();
    await excel.saveAudit({ audit_id: uuidv4(), action: 'AUCTION_STARTED', entity: 'Auction', entity_id: result.auction_id, prev_value: 'READY', new_value: 'LIVE', created_at: new Date().toISOString(), admin: req.user.username });
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/pause', authAdmin, async (req, res) => {
  try { await auction.pauseAuction(); res.json({ message: 'Paused' }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/resume', authAdmin, async (req, res) => {
  try { await auction.resumeAuction(); res.json({ message: 'Resumed' }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/sold', authAdmin, async (req, res) => {
  try { await auction.markSold(); res.json({ message: 'Player marked sold' }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/unsold', authAdmin, async (req, res) => {
  try { await auction.markUnsold(); res.json({ message: 'Player marked unsold' }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/undo', authAdmin, async (req, res) => {
  try {
    const result = await auction.undoLastAuction();
    await excel.saveAudit({ audit_id: uuidv4(), action: 'AUCTION_UNDONE', entity: 'Auction', entity_id: result.auction_id, prev_value: 'SOLD', new_value: 'UNDONE', created_at: new Date().toISOString(), admin: req.user.username });
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/admin/auction/reset', authAdmin, async (req, res) => {
  try {
    await auction.resetAuction();
    await excel.saveAudit({ audit_id: uuidv4(), action: 'AUCTION_RESET', entity: 'Auction', entity_id: '', prev_value: '', new_value: 'RESET', created_at: new Date().toISOString(), admin: req.user.username });
    res.json({ message: 'Auction reset' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auction/bid', authTeamOwner, async (req, res) => {
  try {
    const { bidAmount } = req.body;
    const teamId = req.user.teamId;
    if (!teamId) return res.status(403).json({ error: 'Only team owners can bid' });
    const bid = await auction.placeBid(teamId, Number(bidAmount));
    await excel.saveAudit({ audit_id: uuidv4(), action: 'BID_PLACED', entity: 'Bid', entity_id: bid.bid_id, prev_value: '', new_value: String(bidAmount), created_at: new Date().toISOString(), admin: req.user.teamId });
    res.json(bid);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ---- Announcements ----
app.get('/api/announcements', async (req, res) => {
  try {
    const anns = await excel.getAnnouncements();
    res.json(anns.filter(a => a.active === 'true' || a.active === true));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/announcements', authAdmin, async (req, res) => {
  try { res.json(await excel.getAnnouncements()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/announcements', authAdmin, async (req, res) => {
  try {
    const { message, priority, active } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const ann = { announcement_id: uuidv4(), message, priority: priority || '1', active: active !== false ? 'true' : 'false', created_at: new Date().toISOString() };
    await excel.saveAnnouncement(ann);
    io.emit('ANNOUNCEMENT_UPDATED', ann);
    res.status(201).json(ann);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/announcements/:id', authAdmin, async (req, res) => {
  try {
    const anns = await excel.getAnnouncements();
    const existing = anns.find(a => a.announcement_id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = { ...existing, ...req.body };
    await excel.saveAnnouncement(updated);
    io.emit('ANNOUNCEMENT_UPDATED', updated);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/announcements/:id', authAdmin, async (req, res) => {
  try { await excel.deleteAnnouncement(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Settings ----
app.get('/api/settings', async (req, res) => {
  try {
    const s = await excel.getSettings();
    const { auctionState, currentPlayerId, currentBid, currentBidTeamId, currentBidTeamName, currentAuctionId, ...pub } = s;
    res.json(pub);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/settings', authAdmin, async (req, res) => {
  try {
    await excel.updateSettings(req.body);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'SETTINGS_UPDATED', entity: 'Settings', entity_id: '', prev_value: '', new_value: JSON.stringify(req.body), created_at: new Date().toISOString(), admin: req.user.username });
    res.json({ message: 'Settings updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Stats ----
app.get('/api/stats', async (req, res) => {
  try {
    const [players, teams, auctions] = await Promise.all([excel.getPlayers(), excel.getTeams(), excel.getAuctions()]);
    const sold = players.filter(p => p.status === 'SOLD');
    const totalAuctionValue = sold.reduce((sum, p) => sum + Number(p.final_bid || 0), 0);
    res.json({
      totalPlayers: players.length,
      verifiedPlayers: players.filter(p => p.status === 'VERIFIED').length,
      availablePlayers: players.filter(p => ['AVAILABLE', 'VERIFIED'].includes(p.status)).length,
      soldPlayers: sold.length,
      unsoldPlayers: players.filter(p => p.status === 'UNSOLD').length,
      totalTeams: teams.length,
      totalAuctionValue,
      auctionState: auction.getState().state
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Audit ----
app.get('/api/admin/audit', authAdmin, async (req, res) => {
  try {
    const logs = await excel.getAuditLogs();
    res.json(logs.reverse());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Previous Seasons ----
app.get('/api/seasons', async (req, res) => {
  try {
    const seasons = await excel.getSeasons();
    res.json(seasons.filter(s => s.status === 'ACTIVE').sort((a,b) => Number(a.display_order)-Number(b.display_order)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/seasons/:id', async (req, res) => {
  try {
    const s = await excel.getSeasonById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Season not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/seasons', authAdmin, async (req, res) => {
  try { res.json(await excel.getSeasons()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/seasons', authAdmin, seasonUpload.fields([{name:'champion_logo',maxCount:1},{name:'champion_image',maxCount:1}]), async (req, res) => {
  try {
    const seasons = await excel.getSeasons();
    const { season_number, season_name, year, champion_team, captain, man_of_series, runner_up, final_description, final_score, venue, status, display_order } = req.body;
    if (!season_name || !champion_team) return res.status(400).json({ error: 'Season name and champion team required' });
    const season_id = `S${String(seasons.length + 1).padStart(2,'0')}`;
    const champion_logo = await uploadImageIfDrive(req.files?.champion_logo?.[0]);
    const champion_image = await uploadImageIfDrive(req.files?.champion_image?.[0]);
    const season = { season_id, season_number: season_number||String(seasons.length+1), season_name, year: year||'', champion_team, champion_logo, champion_image, captain: captain||'', man_of_series: man_of_series||'', runner_up: runner_up||'', final_description: final_description||'', final_score: final_score||'', venue: venue||'', status: status||'ACTIVE', display_order: display_order||String(seasons.length+1), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await excel.saveSeason(season);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'SEASON_ADDED', entity: 'Season', entity_id: season_id, prev_value: '', new_value: season_name, created_at: new Date().toISOString(), admin: req.user.username });
    res.status(201).json(season);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/seasons/:id', authAdmin, seasonUpload.fields([{name:'champion_logo',maxCount:1},{name:'champion_image',maxCount:1}]), async (req, res) => {
  try {
    const existing = await excel.getSeasonById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Season not found' });
    const updates = { ...existing, ...req.body, updated_at: new Date().toISOString() };
    if (req.files?.champion_logo?.[0]) updates.champion_logo = await uploadImageIfDrive(req.files.champion_logo[0]);
    if (req.files?.champion_image?.[0]) updates.champion_image = await uploadImageIfDrive(req.files.champion_image[0]);
    const updated = await excel.saveSeason(updates);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/seasons/:id', authAdmin, async (req, res) => {
  try {
    await excel.deleteSeason(req.params.id);
    await excel.saveAudit({ audit_id: uuidv4(), action: 'SEASON_DELETED', entity: 'Season', entity_id: req.params.id, prev_value: '', new_value: 'DELETED', created_at: new Date().toISOString(), admin: req.user.username });
    res.json({ message: 'Season deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Gallery ----
app.get('/api/gallery', async (req, res) => {
  try {
    const { season } = req.query;
    const items = await excel.getGallery(season || null);
    res.json(items.filter(g => g.active === 'true' || g.active === true).sort((a,b) => Number(a.display_order)-Number(b.display_order)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/gallery', authAdmin, async (req, res) => {
  try {
    const { season } = req.query;
    const items = await excel.getGallery(season || null);
    res.json(items.sort((a,b) => Number(a.display_order)-Number(b.display_order)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/gallery', authAdmin, galleryUpload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });
    const allItems = await excel.getGallery(null);
    const results = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const seasonId = req.body.season_id || 'GENERAL';
      const imagePath = await uploadImageIfDrive(file);
      const gallery_id = `G${String(allItems.length + results.length + 1).padStart(3,'0')}_${Date.now()}`;
      const titles = Array.isArray(req.body.titles) ? req.body.titles : [req.body.titles || file.originalname];
      const descs = Array.isArray(req.body.descriptions) ? req.body.descriptions : [req.body.descriptions || ''];
      const item = {
        gallery_id, season_id: seasonId,
        title: titles[i] || file.originalname,
        description: descs[i] || '',
        category: req.body.category || 'GENERAL',
        image_path: imagePath,
        featured: req.body.featured || 'false',
        display_order: String(allItems.length + results.length + 1),
        active: 'true',
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await excel.saveGalleryItem(item);
      results.push(item);
    }
    res.status(201).json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/gallery/:id', authAdmin, async (req, res) => {
  try {
    const items = await excel.getGallery(null);
    const existing = items.find(g => g.gallery_id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Gallery item not found' });
    const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
    await excel.saveGalleryItem(updated);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/gallery/:id', authAdmin, async (req, res) => {
  try {
    const item = await excel.deleteGalleryItem(req.params.id);
    if (item?.image_path) {
      const filePath = path.join(__dirname, item.image_path);
      if (fs.existsSync(filePath)) fs.unlink(filePath, err => { if (err) console.error('File delete error:', err.message); });
    }
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Tournament Settings (Contact/Venue) ----
app.get('/api/tournament-settings', async (req, res) => {
  try { res.json(await excel.getTournamentSettings()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/tournament-settings', authAdmin, async (req, res) => {
  try {
    await excel.updateTournamentSettings(req.body);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Sessions ----
app.get('/api/sessions', async (req, res) => {
  try {
    const settings = await excel.getTournamentSettings();
    // Sessions are stored as TournamentSettings keys prefixed with 'session_'
    // Also check for a dedicated Sessions sheet via getSettings
    const allSettings = await excel.getSettings();
    // Return structured session info from settings
    const sessions = [];
    // Parse session entries from settings (session_1_name, session_1_date, etc.)
    const sessionKeys = Object.keys(allSettings).filter(k => k.match(/^session_\d+_name$/));
    sessionKeys.forEach(k => {
      const num = k.match(/^session_(\d+)_name$/)[1];
      sessions.push({
        id: `session_${num}`,
        name: allSettings[`session_${num}_name`] || '',
        date: allSettings[`session_${num}_date`] || '',
        time: allSettings[`session_${num}_time`] || '',
        description: allSettings[`session_${num}_description`] || '',
        status: allSettings[`session_${num}_status`] || 'UPCOMING',
        notes: allSettings[`session_${num}_notes`] || '',
        order: Number(num)
      });
    });
    sessions.sort((a, b) => a.order - b.order);
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/sessions', authAdmin, async (req, res) => {
  try {
    const allSettings = await excel.getSettings();
    const existing = Object.keys(allSettings).filter(k => k.match(/^session_\d+_name$/));
    const num = existing.length + 1;
    const { name, date, time, description, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Session name required' });
    await excel.updateSettings({
      [`session_${num}_name`]: name || '',
      [`session_${num}_date`]: date || '',
      [`session_${num}_time`]: time || '',
      [`session_${num}_description`]: description || '',
      [`session_${num}_status`]: status || 'UPCOMING',
      [`session_${num}_notes`]: notes || ''
    });
    res.status(201).json({ id: `session_${num}`, name, date, time, description, status, notes, order: num });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/sessions/:id', authAdmin, async (req, res) => {
  try {
    const num = req.params.id.replace('session_', '');
    const { name, date, time, description, status, notes } = req.body;
    await excel.updateSettings({
      [`session_${num}_name`]: name || '',
      [`session_${num}_date`]: date || '',
      [`session_${num}_time`]: time || '',
      [`session_${num}_description`]: description || '',
      [`session_${num}_status`]: status || 'UPCOMING',
      [`session_${num}_notes`]: notes || ''
    });
    res.json({ id: req.params.id, name, date, time, description, status, notes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/sessions/:id', authAdmin, async (req, res) => {
  try {
    const num = req.params.id.replace('session_', '');
    await excel.updateSettings({
      [`session_${num}_name`]: '__DELETED__',
      [`session_${num}_status`]: 'DELETED'
    });
    res.json({ message: 'Session deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Drive status ----
app.get('/api/admin/drive-status', authAdmin, (req, res) => {
  res.json({
    driveEnabled: driveService.DRIVE_ENABLED,
    driveFileId: process.env.DRIVE_FILE_ID || null,
    driveFolderId: process.env.DRIVE_FOLDER_ID || null
  });
});

// ---- Backup & Data ----
app.get('/api/admin/backup/excel', authAdmin, async (req, res) => {
  let tmpPath;
  try {
    if (!driveService.DRIVE_ENABLED) return res.status(503).json({ error: 'Google Drive is not configured' });
    tmpPath = await driveService.downloadExcelToTemp();
    res.download(tmpPath, 'tpl2026.xlsx', () => {
      if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/backup/images', authAdmin, async (req, res) => {
  try {
    if (!driveService.DRIVE_ENABLED) return res.status(503).json({ error: 'Google Drive is not configured' });
    const files = await driveService.listDriveImages();
    res.json(files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size, createdTime: f.createdTime, url: driveService.getDriveImageUrl(f.id) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/backup/download', authAdmin, async (req, res) => {
  let excelPath;
  try {
    if (!driveService.DRIVE_ENABLED) return res.status(503).json({ error: 'Google Drive is not configured' });
    excelPath = await driveService.downloadExcelToTemp();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="TPL2026-Backup-${new Date().toISOString().slice(0,10)}.zip"`);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', e => { console.error('Archive error:', e); });
    archive.pipe(res);
    if (excelPath && fs.existsSync(excelPath)) archive.file(excelPath, { name: 'tpl2026.xlsx' });
    await archive.finalize();
    if (excelPath && fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- WebSocket ----
io.on('connection', (socket) => {
  socket.emit('AUCTION_STATE', auction.getState());
  socket.on('disconnect', () => {});
});

auction.setIO(io);

// ---- Start ----
async function startServer() {
  // 1. Pull latest Excel from Drive (blocks until done or falls back to local)
  await excel.syncFromDrive();
  // 2. Ensure local Excel exists and all sheets are migrated
  const { loadWorkbookForInit } = require('./excel.service');
  if (loadWorkbookForInit) loadWorkbookForInit();
  // 3. Restore auction state from Excel
  await auction.restoreStateFromExcel();
  // 4. Start listening
  server.listen(PORT, () => {
    console.log(`TPL2026 server running on port ${PORT}${driveService.DRIVE_ENABLED ? ' [Google Drive ENABLED]' : ' [Local Excel mode]'}${driveService.DRIVE_ENABLED ? (driveService.OAUTH_ENABLED ? ' [Image uploads: your account (OAuth)]' : ' [Image uploads: Service Account - WILL FAIL, quota error - see OAUTH_CLIENT_ID setup]') : ''}`);
  });
}

startServer().catch(e => { console.error('Server startup failed:', e); process.exit(1); });