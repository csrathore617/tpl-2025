const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const drive = require('./drive.service');

const DATA_FILE = path.join(__dirname, 'data', 'tpl2026.xlsx');

const SHEETS = {
  PLAYERS: 'Players',
  TEAMS: 'Teams',
  AUCTION: 'Auction',
  BIDS: 'Bids',
  ANNOUNCEMENTS: 'Announcements',
  SETTINGS: 'Settings',
  AUDIT: 'AuditLog',
  SEASONS: 'PreviousSeasons',
  GALLERY: 'Gallery',
  TSETTINGS: 'TournamentSettings'
};

const DEFAULT_SETTINGS = [
  { key: 'maxTeams', value: '5' },
  { key: 'initialPurse', value: '21000' },
  { key: 'baseBid', value: '100' },
  { key: 'bidIncrement', value: '100' },
  { key: 'auctionTimer', value: '20' },
  { key: 'tournamentDate', value: 'To Be Announced' },
  { key: 'tournamentVenue', value: 'To Be Announced' },
  { key: 'auctionState', value: 'NOT_STARTED' },
  { key: 'currentPlayerId', value: '' },
  { key: 'currentBid', value: '0' },
  { key: 'currentBidTeamId', value: '' },
  { key: 'currentBidTeamName', value: '' },
  { key: 'currentAuctionId', value: '' }
];

let _lock = false;
const _queue = [];

function acquireLock() {
  return new Promise(resolve => {
    if (!_lock) { _lock = true; resolve(); }
    else _queue.push(resolve);
  });
}

function releaseLock() {
  if (_queue.length > 0) {
    const next = _queue.shift();
    next();
  } else {
    _lock = false;
  }
}

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadWorkbook() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return createWorkbook();
  const wb = XLSX.readFile(DATA_FILE);
  return migrateWorkbook(wb);
}

function migrateWorkbook(wb) {
  let changed = false;

  if (!wb.Sheets[SHEETS.SEASONS]) {
    const seasonHeaders = [['season_id','season_number','season_name','year','champion_team','champion_logo','champion_image','captain','man_of_series','runner_up','final_description','final_score','venue','status','display_order','created_at','updated_at']];
    const now = new Date().toISOString();
    const seasonData = [
      ['S01','1','TPL Season 1','2023','Thebri Super Kings','','','Sachin Sharma','Monu Singh','Thebri Titans','Clinched victory in a last-ball thriller against Titans','','Thebri Cricket Ground','ACTIVE','1',now,now],
      ['S02','2','TPL Season 2','2024','Thebri Titans','','','Rajesh Mehra','Hari Ram Dhaka','Thebri Super Kings','Won against Super Kings in a high-scoring final','','Thebri Cricket Ground','ACTIVE','2',now,now],
      ['S03','3','TPL Season 3','2025','Thebri Royals','','','Ajay Singh','Nemichand Mehra','Royal Challengers','Defeated Royal Challengers in a thrilling final match','','Thebri Cricket Ground','ACTIVE','3',now,now]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...seasonHeaders, ...seasonData]), SHEETS.SEASONS);
    changed = true;
  }

  if (!wb.Sheets[SHEETS.GALLERY]) {
    const galleryHeaders = [['gallery_id','season_id','title','description','category','image_path','featured','display_order','active','uploaded_at','updated_at']];
    const now = new Date().toISOString();
    const galleryData = [
      ['G001','S01','TPL Season 1 Match','Season 1 Opening Match','MATCH','','false','1','true',now,now],
      ['G002','S01','TPL Season 1 Team','Winning Team Celebration','CELEBRATION','','false','2','true',now,now],
      ['G003','S01','TPL Season 1 Action','Intense Match Action','MATCH','','false','3','true',now,now],
      ['G004','S01','TPL Season 1 Final','Season 1 Final Match','FINAL','','false','4','true',now,now],
      ['G005','S02','TPL Season 2 Opening','Season 2 Opening Ceremony','CEREMONY','','false','1','true',now,now],
      ['G006','S02','TPL Season 2 Match','Exciting Match Moment','MATCH','','false','2','true',now,now],
      ['G007','S02','TPL Season 2 Team','Team Strategy Session','TEAM','','false','3','true',now,now],
      ['G008','S03','TPL Season 3 Action','Season 3 Match Action','MATCH','','false','1','true',now,now],
      ['G009','S03','TPL Season 3 Celebration','Victory Celebration','CELEBRATION','','false','2','true',now,now],
      ['G010','S03','TPL Season 3 Final','Season 3 Final Match','FINAL','','false','3','true',now,now],
      ['G011','GENERAL','Cricket Action 1','Exciting Cricket Action','ACTION','','false','1','true',now,now],
      ['G012','GENERAL','Cricket Action 2','Player in Action','ACTION','','false','2','true',now,now],
      ['G013','GENERAL','Cricket Action 3','Team Celebration','CELEBRATION','','false','3','true',now,now],
      ['G014','GENERAL','Cricket Match','Cricket Match','MATCH','','false','4','true',now,now]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...galleryHeaders, ...galleryData]), SHEETS.GALLERY);
    changed = true;
  }

  if (!wb.Sheets[SHEETS.TSETTINGS]) {
    const now = new Date().toISOString();
    const tsData = [['setting_key','setting_value','updated_at'],
      ['venue_name','Thebri Cricket Ground, Thebri',now],
      ['venue_address','Thebri Cricket Stadium, Thebri',now],
      ['opening_time','7:00 AM',now],['closing_time','7:00 PM',now],
      ['phone','+91 98765 43210',now],['whatsapp','+91 98765 43210',now],
      ['phone_available','9:00 AM - 6:00 PM',now],
      ['primary_email','info@tpl2025.com',now],['support_email','support@tpl2025.com',now],
      ['response_time','Within 24 hours',now],['maps_url','',now]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tsData), SHEETS.TSETTINGS);
    changed = true;
  }

  if (changed) saveWorkbook(wb);
  return wb;
}

function createWorkbook() {
  const wb = XLSX.utils.book_new();
  const playerHeaders = [['player_id','name','photo','dob','age','mobile','email','city','address','role','batting_style','bowling_style','experience','preferred_position','jersey_number','emergency_contact','registration_date','status','team_id','final_bid']];
  const teamHeaders = [['team_id','team_name','short_name','logo','owner_name','owner_contact','city','team_color','status','initial_purse','remaining_purse','players_count','registration_date']];
  const auctionHeaders = [['auction_id','player_id','player_name','base_price','winning_team_id','winning_team_name','final_bid','status','bid_count','auction_time']];
  const bidHeaders = [['bid_id','auction_id','player_id','team_id','team_name','bid_amount','bid_time']];
  const announcementHeaders = [['announcement_id','message','priority','active','created_at']];
  const settingsHeaders = [['key','value']];
  const auditHeaders = [['audit_id','action','entity','entity_id','prev_value','new_value','created_at','admin']];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(playerHeaders), SHEETS.PLAYERS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(teamHeaders), SHEETS.TEAMS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(auctionHeaders), SHEETS.AUCTION);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bidHeaders), SHEETS.BIDS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(announcementHeaders), SHEETS.ANNOUNCEMENTS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...settingsHeaders, ...DEFAULT_SETTINGS.map(s => [s.key, s.value])]), SHEETS.SETTINGS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(auditHeaders), SHEETS.AUDIT);

  // PreviousSeasons
  const seasonHeaders = [['season_id','season_number','season_name','year','champion_team','champion_logo','champion_image','captain','man_of_series','runner_up','final_description','final_score','venue','status','display_order','created_at','updated_at']];
  const seasonData = [
    ['S01','1','TPL Season 1','2023','Thebri Super Kings','','','Sachin Sharma','Monu Singh','Thebri Titans','Clinched victory in a last-ball thriller against Titans','','Thebri Cricket Ground','ACTIVE','1',new Date().toISOString(),new Date().toISOString()],
    ['S02','2','TPL Season 2','2024','Thebri Titans','','','Rajesh Mehra','Hari Ram Dhaka','Thebri Super Kings','Won against Super Kings in a high-scoring final','','Thebri Cricket Ground','ACTIVE','2',new Date().toISOString(),new Date().toISOString()],
    ['S03','3','TPL Season 3','2025','Thebri Royals','','','Ajay Singh','Nemichand Mehra','Royal Challengers','Defeated Royal Challengers in a thrilling final match','','Thebri Cricket Ground','ACTIVE','3',new Date().toISOString(),new Date().toISOString()]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...seasonHeaders, ...seasonData]), SHEETS.SEASONS);

  // Gallery
  const galleryHeaders = [['gallery_id','season_id','title','description','category','image_path','featured','display_order','active','uploaded_at','updated_at']];
  const galleryData = [
    ['G001','S01','TPL Season 1 Match','Season 1 Opening Match','MATCH','','false','1','true',new Date().toISOString(),new Date().toISOString()],
    ['G002','S01','TPL Season 1 Team','Winning Team Celebration','CELEBRATION','','false','2','true',new Date().toISOString(),new Date().toISOString()],
    ['G003','S01','TPL Season 1 Action','Intense Match Action','MATCH','','false','3','true',new Date().toISOString(),new Date().toISOString()],
    ['G004','S01','TPL Season 1 Final','Season 1 Final Match','FINAL','','false','4','true',new Date().toISOString(),new Date().toISOString()],
    ['G005','S02','TPL Season 2 Opening','Season 2 Opening Ceremony','CEREMONY','','false','1','true',new Date().toISOString(),new Date().toISOString()],
    ['G006','S02','TPL Season 2 Match','Exciting Match Moment','MATCH','','false','2','true',new Date().toISOString(),new Date().toISOString()],
    ['G007','S02','TPL Season 2 Team','Team Strategy Session','TEAM','','false','3','true',new Date().toISOString(),new Date().toISOString()],
    ['G008','S03','TPL Season 3 Action','Season 3 Match Action','MATCH','','false','1','true',new Date().toISOString(),new Date().toISOString()],
    ['G009','S03','TPL Season 3 Celebration','Victory Celebration','CELEBRATION','','false','2','true',new Date().toISOString(),new Date().toISOString()],
    ['G010','S03','TPL Season 3 Final','Season 3 Final Match','FINAL','','false','3','true',new Date().toISOString(),new Date().toISOString()],
    ['G011','GENERAL','Cricket Action 1','Exciting Cricket Action','ACTION','','false','1','true',new Date().toISOString(),new Date().toISOString()],
    ['G012','GENERAL','Cricket Action 2','Player in Action','ACTION','','false','2','true',new Date().toISOString(),new Date().toISOString()],
    ['G013','GENERAL','Cricket Action 3','Team Celebration','CELEBRATION','','false','3','true',new Date().toISOString(),new Date().toISOString()],
    ['G014','GENERAL','Cricket Match','Cricket Match','MATCH','','false','4','true',new Date().toISOString(),new Date().toISOString()]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...galleryHeaders, ...galleryData]), SHEETS.GALLERY);

  // TournamentSettings
  const tsHeaders = [['setting_key','setting_value','updated_at']];
  const tsData = [
    ['venue_name','Thebri Cricket Ground, Thebri',new Date().toISOString()],
    ['venue_address','Thebri Cricket Stadium, Thebri',new Date().toISOString()],
    ['opening_time','7:00 AM',new Date().toISOString()],
    ['closing_time','7:00 PM',new Date().toISOString()],
    ['phone','+91 98765 43210',new Date().toISOString()],
    ['whatsapp','+91 98765 43210',new Date().toISOString()],
    ['phone_available','9:00 AM - 6:00 PM',new Date().toISOString()],
    ['primary_email','info@tpl2025.com',new Date().toISOString()],
    ['support_email','support@tpl2025.com',new Date().toISOString()],
    ['response_time','Within 24 hours',new Date().toISOString()],
    ['maps_url','',new Date().toISOString()]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...tsHeaders, ...tsData]), SHEETS.TSETTINGS);

  // Sample announcement
  const annSheet = wb.Sheets[SHEETS.ANNOUNCEMENTS];
  XLSX.utils.sheet_add_aoa(annSheet, [['ANN001', '📢 TPL2026 Tournament Date Will Be Announced Soon – Expected 1st Week of November 2026', '1', 'true', new Date().toISOString()]], { origin: -1 });

  XLSX.writeFile(wb, DATA_FILE);
  return wb;
}

async function saveWorkbook(wb) {
  ensureDataDir();
  XLSX.writeFile(wb, DATA_FILE);
  if (drive.DRIVE_ENABLED) {
    await drive.uploadExcelToDrive(DATA_FILE).catch(e => console.error('Drive sync error:', e.message));
  }
}

// Pull latest from Drive on startup if enabled
async function syncFromDrive() {
  if (!drive.DRIVE_ENABLED) return;
  try {
    const tmpPath = await drive.downloadExcelToTemp();
    if (tmpPath) {
      ensureDataDir();
      // OneDrive/AV/Excel can briefly lock DATA_FILE (EBUSY). Retry a few
      // times with a short delay before giving up.
      let lastErr;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          fs.copyFileSync(tmpPath, DATA_FILE);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
          console.warn(`DATA_FILE locked (attempt ${attempt}/5), retrying in 1s...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      if (lastErr) throw lastErr;
      fs.unlinkSync(tmpPath);
      console.log('Synced Excel from Google Drive');
    }
  } catch (e) {
    console.error('Drive sync on startup failed (using local):', e.message);
    console.error('Tip: close tpl2026.xlsx if it is open in Excel, and/or move this project out of your OneDrive folder to avoid file locks.');
  }
}

function sheetToJson(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function jsonToSheet(data, headers) {
  if (data.length === 0) return XLSX.utils.aoa_to_sheet([headers]);
  return XLSX.utils.json_to_sheet(data, { header: headers });
}

// ---- Players ----
const PLAYER_HEADERS = ['player_id','name','photo','dob','age','mobile','email','city','address','role','batting_style','bowling_style','experience','preferred_position','jersey_number','emergency_contact','registration_date','status','team_id','final_bid'];

async function getPlayers() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    return sheetToJson(wb, SHEETS.PLAYERS);
  } finally { releaseLock(); }
}

async function getPlayerById(id) {
  const players = await getPlayers();
  return players.find(p => p.player_id === id) || null;
}

async function savePlayer(player) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const players = sheetToJson(wb, SHEETS.PLAYERS);
    players.push(player);
    wb.Sheets[SHEETS.PLAYERS] = jsonToSheet(players, PLAYER_HEADERS);
    await saveWorkbook(wb);
    return player;
  } finally { releaseLock(); }
}

async function updatePlayer(id, updates) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const players = sheetToJson(wb, SHEETS.PLAYERS);
    const idx = players.findIndex(p => p.player_id === id);
    if (idx === -1) throw new Error('Player not found');
    players[idx] = { ...players[idx], ...updates };
    wb.Sheets[SHEETS.PLAYERS] = jsonToSheet(players, PLAYER_HEADERS);
    await saveWorkbook(wb);
    return players[idx];
  } finally { releaseLock(); }
}

async function deletePlayer(id) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    let players = sheetToJson(wb, SHEETS.PLAYERS);
    players = players.filter(p => p.player_id !== id);
    wb.Sheets[SHEETS.PLAYERS] = jsonToSheet(players, PLAYER_HEADERS);
    await saveWorkbook(wb);
  } finally { releaseLock(); }
}

// ---- Teams ----
const TEAM_HEADERS = ['team_id','team_name','short_name','logo','owner_name','owner_contact','city','team_color','status','initial_purse','remaining_purse','players_count','registration_date'];

async function getTeams() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    return sheetToJson(wb, SHEETS.TEAMS);
  } finally { releaseLock(); }
}

async function getTeamById(id) {
  const teams = await getTeams();
  return teams.find(t => t.team_id === id) || null;
}

async function saveTeam(team) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const teams = sheetToJson(wb, SHEETS.TEAMS);
    teams.push(team);
    wb.Sheets[SHEETS.TEAMS] = jsonToSheet(teams, TEAM_HEADERS);
    await saveWorkbook(wb);
    return team;
  } finally { releaseLock(); }
}

async function updateTeam(id, updates) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const teams = sheetToJson(wb, SHEETS.TEAMS);
    const idx = teams.findIndex(t => t.team_id === id);
    if (idx === -1) throw new Error('Team not found');
    teams[idx] = { ...teams[idx], ...updates };
    wb.Sheets[SHEETS.TEAMS] = jsonToSheet(teams, TEAM_HEADERS);
    await saveWorkbook(wb);
    return teams[idx];
  } finally { releaseLock(); }
}

// ---- Auction ----
const AUCTION_HEADERS = ['auction_id','player_id','player_name','base_price','winning_team_id','winning_team_name','final_bid','status','bid_count','auction_time'];

async function getAuctions() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    return sheetToJson(wb, SHEETS.AUCTION);
  } finally { releaseLock(); }
}

async function saveAuction(auction) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const auctions = sheetToJson(wb, SHEETS.AUCTION);
    const idx = auctions.findIndex(a => a.auction_id === auction.auction_id);
    if (idx >= 0) auctions[idx] = auction;
    else auctions.push(auction);
    wb.Sheets[SHEETS.AUCTION] = jsonToSheet(auctions, AUCTION_HEADERS);
    await saveWorkbook(wb);
    return auction;
  } finally { releaseLock(); }
}

// ---- Bids ----
const BID_HEADERS = ['bid_id','auction_id','player_id','team_id','team_name','bid_amount','bid_time'];

async function getBids(auctionId) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const bids = sheetToJson(wb, SHEETS.BIDS);
    return auctionId ? bids.filter(b => b.auction_id === auctionId) : bids;
  } finally { releaseLock(); }
}

async function saveBid(bid) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const bids = sheetToJson(wb, SHEETS.BIDS);
    bids.push(bid);
    wb.Sheets[SHEETS.BIDS] = jsonToSheet(bids, BID_HEADERS);
    await saveWorkbook(wb);
    return bid;
  } finally { releaseLock(); }
}

// ---- Settings ----
async function getSettings() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const rows = sheetToJson(wb, SHEETS.SETTINGS);
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  } finally { releaseLock(); }
}

async function updateSettings(updates) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const rows = sheetToJson(wb, SHEETS.SETTINGS);
    Object.entries(updates).forEach(([key, value]) => {
      const idx = rows.findIndex(r => r.key === key);
      if (idx >= 0) rows[idx].value = String(value);
      else rows.push({ key, value: String(value) });
    });
    wb.Sheets[SHEETS.SETTINGS] = jsonToSheet(rows, ['key', 'value']);
    await saveWorkbook(wb);
    return rows;
  } finally { releaseLock(); }
}

// ---- Announcements ----
const ANN_HEADERS = ['announcement_id','message','priority','active','created_at'];

async function getAnnouncements() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    return sheetToJson(wb, SHEETS.ANNOUNCEMENTS);
  } finally { releaseLock(); }
}

async function saveAnnouncement(ann) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const anns = sheetToJson(wb, SHEETS.ANNOUNCEMENTS);
    const idx = anns.findIndex(a => a.announcement_id === ann.announcement_id);
    if (idx >= 0) anns[idx] = ann;
    else anns.push(ann);
    wb.Sheets[SHEETS.ANNOUNCEMENTS] = jsonToSheet(anns, ANN_HEADERS);
    await saveWorkbook(wb);
    return ann;
  } finally { releaseLock(); }
}

async function deleteAnnouncement(id) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    let anns = sheetToJson(wb, SHEETS.ANNOUNCEMENTS);
    anns = anns.filter(a => a.announcement_id !== id);
    wb.Sheets[SHEETS.ANNOUNCEMENTS] = jsonToSheet(anns, ANN_HEADERS);
    await saveWorkbook(wb);
  } finally { releaseLock(); }
}

// ---- Audit ----
const AUDIT_HEADERS = ['audit_id','action','entity','entity_id','prev_value','new_value','created_at','admin'];

async function saveAudit(entry) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const logs = sheetToJson(wb, SHEETS.AUDIT);
    logs.push(entry);
    wb.Sheets[SHEETS.AUDIT] = jsonToSheet(logs, AUDIT_HEADERS);
    await saveWorkbook(wb);
  } finally { releaseLock(); }
}

async function getAuditLogs() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    return sheetToJson(wb, SHEETS.AUDIT);
  } finally { releaseLock(); }
}

// Atomic auction transaction: mark player sold, deduct purse, update auction record
async function atomicSellPlayer({ playerId, teamId, finalBid, auctionId }) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    const players = sheetToJson(wb, SHEETS.PLAYERS);
    const teams = sheetToJson(wb, SHEETS.TEAMS);
    const auctions = sheetToJson(wb, SHEETS.AUCTION);

    const pIdx = players.findIndex(p => p.player_id === playerId);
    const tIdx = teams.findIndex(t => t.team_id === teamId);
    const aIdx = auctions.findIndex(a => a.auction_id === auctionId);

    if (pIdx === -1) throw new Error('Player not found');
    if (tIdx === -1) throw new Error('Team not found');
    if (players[pIdx].status === 'SOLD') throw new Error('Player already sold');

    const purse = Number(teams[tIdx].remaining_purse);
    if (purse < finalBid) throw new Error('Insufficient purse');

    players[pIdx].status = 'SOLD';
    players[pIdx].team_id = teamId;
    players[pIdx].final_bid = finalBid;

    teams[tIdx].remaining_purse = purse - finalBid;
    teams[tIdx].players_count = Number(teams[tIdx].players_count || 0) + 1;

    if (aIdx >= 0) {
      auctions[aIdx].status = 'SOLD';
      auctions[aIdx].winning_team_id = teamId;
      auctions[aIdx].winning_team_name = teams[tIdx].team_name;
      auctions[aIdx].final_bid = finalBid;
    }

    wb.Sheets[SHEETS.PLAYERS] = jsonToSheet(players, PLAYER_HEADERS);
    wb.Sheets[SHEETS.TEAMS] = jsonToSheet(teams, TEAM_HEADERS);
    wb.Sheets[SHEETS.AUCTION] = jsonToSheet(auctions, AUCTION_HEADERS);
    await saveWorkbook(wb);

    return { player: players[pIdx], team: teams[tIdx] };
  } finally { releaseLock(); }
}

// ---- Previous Seasons ----
const SEASON_HEADERS = ['season_id','season_number','season_name','year','champion_team','champion_logo','champion_image','captain','man_of_series','runner_up','final_description','final_score','venue','status','display_order','created_at','updated_at'];

async function getSeasons() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    if (!wb.Sheets[SHEETS.SEASONS]) return [];
    return sheetToJson(wb, SHEETS.SEASONS);
  } finally { releaseLock(); }
}

async function getSeasonById(id) {
  const seasons = await getSeasons();
  return seasons.find(s => s.season_id === id) || null;
}

async function saveSeason(season) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    if (!wb.Sheets[SHEETS.SEASONS]) wb.Sheets[SHEETS.SEASONS] = XLSX.utils.aoa_to_sheet([SEASON_HEADERS]);
    const seasons = sheetToJson(wb, SHEETS.SEASONS);
    const idx = seasons.findIndex(s => s.season_id === season.season_id);
    if (idx >= 0) seasons[idx] = season; else seasons.push(season);
    wb.Sheets[SHEETS.SEASONS] = jsonToSheet(seasons, SEASON_HEADERS);
    await saveWorkbook(wb); return season;
  } finally { releaseLock(); }
}

async function deleteSeason(id) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    let seasons = sheetToJson(wb, SHEETS.SEASONS);
    seasons = seasons.filter(s => s.season_id !== id);
    wb.Sheets[SHEETS.SEASONS] = jsonToSheet(seasons, SEASON_HEADERS);
    await saveWorkbook(wb);
  } finally { releaseLock(); }
}

// ---- Gallery ----
const GALLERY_HEADERS = ['gallery_id','season_id','title','description','category','image_path','featured','display_order','active','uploaded_at','updated_at'];

async function getGallery(seasonId) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    if (!wb.Sheets[SHEETS.GALLERY]) return [];
    const items = sheetToJson(wb, SHEETS.GALLERY);
    return seasonId ? items.filter(g => g.season_id === seasonId) : items;
  } finally { releaseLock(); }
}

async function saveGalleryItem(item) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    if (!wb.Sheets[SHEETS.GALLERY]) wb.Sheets[SHEETS.GALLERY] = XLSX.utils.aoa_to_sheet([GALLERY_HEADERS]);
    const items = sheetToJson(wb, SHEETS.GALLERY);
    const idx = items.findIndex(g => g.gallery_id === item.gallery_id);
    if (idx >= 0) items[idx] = item; else items.push(item);
    wb.Sheets[SHEETS.GALLERY] = jsonToSheet(items, GALLERY_HEADERS);
    await saveWorkbook(wb); return item;
  } finally { releaseLock(); }
}

async function deleteGalleryItem(id) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    let items = sheetToJson(wb, SHEETS.GALLERY);
    const item = items.find(g => g.gallery_id === id);
    items = items.filter(g => g.gallery_id !== id);
    wb.Sheets[SHEETS.GALLERY] = jsonToSheet(items, GALLERY_HEADERS);
    await saveWorkbook(wb);
    return item;
  } finally { releaseLock(); }
}

// ---- Tournament Settings ----
const TS_HEADERS = ['setting_key','setting_value','updated_at'];

async function getTournamentSettings() {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    if (!wb.Sheets[SHEETS.TSETTINGS]) return {};
    const rows = sheetToJson(wb, SHEETS.TSETTINGS);
    const s = {}; rows.forEach(r => { s[r.setting_key] = r.setting_value; }); return s;
  } finally { releaseLock(); }
}

async function updateTournamentSettings(updates) {
  await acquireLock();
  try {
    const wb = loadWorkbook();
    if (!wb.Sheets[SHEETS.TSETTINGS]) wb.Sheets[SHEETS.TSETTINGS] = XLSX.utils.aoa_to_sheet([TS_HEADERS]);
    const rows = sheetToJson(wb, SHEETS.TSETTINGS);
    Object.entries(updates).forEach(([key, value]) => {
      const idx = rows.findIndex(r => r.setting_key === key);
      const now = new Date().toISOString();
      if (idx >= 0) { rows[idx].setting_value = String(value); rows[idx].updated_at = now; }
      else rows.push({ setting_key: key, setting_value: String(value), updated_at: now });
    });
    wb.Sheets[SHEETS.TSETTINGS] = jsonToSheet(rows, TS_HEADERS);
    await saveWorkbook(wb); return rows;
  } finally { releaseLock(); }
}

// NOTE: Do NOT call loadWorkbook() here at module load time.
// The server's startup sequence calls syncFromDrive() first, then begins serving requests.
// This ensures Drive data is pulled before any read/write happens.

// Called once at startup after Drive sync to ensure local file exists and is migrated
function loadWorkbookForInit() {
  try { loadWorkbook(); } catch(e) { console.error('Workbook init error:', e.message); }
}

module.exports = {
  getPlayers, getPlayerById, savePlayer, updatePlayer, deletePlayer,
  getTeams, getTeamById, saveTeam, updateTeam,
  getAuctions, saveAuction,
  getBids, saveBid,
  getSettings, updateSettings,
  getAnnouncements, saveAnnouncement, deleteAnnouncement,
  saveAudit, getAuditLogs,
  atomicSellPlayer,
  getSeasons, getSeasonById, saveSeason, deleteSeason,
  getGallery, saveGalleryItem, deleteGalleryItem,
  getTournamentSettings, updateTournamentSettings,
  syncFromDrive, loadWorkbookForInit
};