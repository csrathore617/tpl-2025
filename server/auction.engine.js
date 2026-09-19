const excel = require('./excel.service');
const { v4: uuidv4 } = require('uuid');

let io = null;
let timerInterval = null;
let timerSeconds = 20;
let auctionState = {
  state: 'NOT_STARTED',
  currentPlayer: null,
  currentAuctionId: null,
  currentBid: 0,
  currentBidTeamId: null,
  currentBidTeamName: null,
  timerSeconds: 20,
  bidHistory: []
};

function setIO(socketIO) { io = socketIO; }

function broadcast(event, data) {
  if (io) io.emit(event, data);
}

function getState() { return { ...auctionState }; }

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

async function startTimer() {
  stopTimer();
  const settings = await excel.getSettings();
  timerSeconds = parseInt(settings.auctionTimer) || 20;
  auctionState.timerSeconds = timerSeconds;
  broadcast('TIMER_UPDATED', { seconds: timerSeconds });

  timerInterval = setInterval(async () => {
    auctionState.timerSeconds--;
    broadcast('TIMER_UPDATED', { seconds: auctionState.timerSeconds });
    if (auctionState.timerSeconds <= 0) {
      stopTimer();
      if (auctionState.currentBid > 0 && auctionState.currentBidTeamId) {
        await autoSold();
      } else {
        await autoUnsold();
      }
    }
  }, 1000);
}

async function autoSold() {
  if (!auctionState.currentPlayer || !auctionState.currentAuctionId) return;
  try {
    const result = await excel.atomicSellPlayer({
      playerId: auctionState.currentPlayer.player_id,
      teamId: auctionState.currentBidTeamId,
      finalBid: auctionState.currentBid,
      auctionId: auctionState.currentAuctionId
    });
    await excel.updateSettings({ auctionState: 'SOLD' });
    auctionState.state = 'SOLD';
    broadcast('PLAYER_SOLD', {
      player: result.player,
      team: result.team,
      finalBid: auctionState.currentBid
    });
    broadcast('TEAM_PURSE_UPDATED', { team: result.team });
    await excel.saveAudit({
      audit_id: uuidv4(), action: 'PLAYER_SOLD', entity: 'Player',
      entity_id: auctionState.currentPlayer.player_id,
      prev_value: 'AVAILABLE', new_value: 'SOLD',
      created_at: new Date().toISOString(), admin: 'system'
    });
  } catch (e) { console.error('autoSold error', e.message); }
}

async function autoUnsold() {
  if (!auctionState.currentPlayer) return;
  await excel.updatePlayer(auctionState.currentPlayer.player_id, { status: 'UNSOLD' });
  if (auctionState.currentAuctionId) {
    const auctions = await excel.getAuctions();
    const a = auctions.find(x => x.auction_id === auctionState.currentAuctionId);
    if (a) await excel.saveAuction({ ...a, status: 'UNSOLD' });
  }
  await excel.updateSettings({ auctionState: 'UNSOLD' });
  auctionState.state = 'UNSOLD';
  broadcast('PLAYER_UNSOLD', { player: auctionState.currentPlayer });
}

async function selectPlayer(playerId) {
  stopTimer();
  const player = await excel.getPlayerById(playerId);
  if (!player) throw new Error('Player not found');
  if (!['AVAILABLE', 'VERIFIED'].includes(player.status)) throw new Error('Player not eligible for auction');
  auctionState.currentPlayer = player;
  auctionState.currentAuctionId = null;
  auctionState.currentBid = 0;
  auctionState.currentBidTeamId = null;
  auctionState.currentBidTeamName = null;
  auctionState.bidHistory = [];
  auctionState.state = 'READY';
  await excel.updateSettings({ auctionState: 'READY', currentPlayerId: playerId, currentBid: '0', currentBidTeamId: '', currentBidTeamName: '' });
  broadcast('PLAYER_SELECTED', { player });
  return player;
}

async function randomPlayer() {
  const players = await excel.getPlayers();
  const eligible = players.filter(p => ['AVAILABLE', 'VERIFIED'].includes(p.status));
  if (eligible.length === 0) throw new Error('No eligible players available');
  const selected = eligible[Math.floor(Math.random() * eligible.length)];
  broadcast('RANDOM_PLAYER_SELECTED', { players: eligible, selected });
  await selectPlayer(selected.player_id);
  return { players: eligible, selected };
}

async function startAuction() {
  if (!auctionState.currentPlayer) throw new Error('No player selected');
  const settings = await excel.getSettings();
  const baseBid = parseInt(settings.baseBid) || 100;
  const auctionId = uuidv4();
  auctionState.currentAuctionId = auctionId;
  auctionState.currentBid = 0;
  auctionState.state = 'LIVE';
  auctionState.bidHistory = [];

  const auctionRecord = {
    auction_id: auctionId,
    player_id: auctionState.currentPlayer.player_id,
    player_name: auctionState.currentPlayer.name,
    base_price: baseBid,
    winning_team_id: '',
    winning_team_name: '',
    final_bid: 0,
    status: 'LIVE',
    bid_count: 0,
    auction_time: new Date().toISOString()
  };
  await excel.saveAuction(auctionRecord);
  await excel.updateSettings({ auctionState: 'LIVE', currentAuctionId: auctionId, currentBid: '0' });

  broadcast('AUCTION_STARTED', { player: auctionState.currentPlayer, baseBid, auctionId });
  await startTimer();
  return auctionRecord;
}

async function placeBid(teamId, bidAmount) {
  if (auctionState.state !== 'LIVE') throw new Error('Auction is not active');
  if (!auctionState.currentPlayer) throw new Error('No player being auctioned');

  const settings = await excel.getSettings();
  const bidIncrement = parseInt(settings.bidIncrement) || 100;
  const baseBid = parseInt(settings.baseBid) || 100;
  const minBid = auctionState.currentBid === 0 ? baseBid : auctionState.currentBid + bidIncrement;

  if (bidAmount < minBid) throw new Error(`Bid must be at least ₹${minBid}`);

  const team = await excel.getTeamById(teamId);
  if (!team) throw new Error('Team not found');
  if (team.status !== 'ACTIVE' && team.status !== 'REGISTERED') throw new Error('Team is not active');
  if (Number(team.remaining_purse) < bidAmount) throw new Error('Insufficient team purse');

  const bid = {
    bid_id: uuidv4(),
    auction_id: auctionState.currentAuctionId,
    player_id: auctionState.currentPlayer.player_id,
    team_id: teamId,
    team_name: team.team_name,
    bid_amount: bidAmount,
    bid_time: new Date().toISOString()
  };
  await excel.saveBid(bid);

  auctionState.currentBid = bidAmount;
  auctionState.currentBidTeamId = teamId;
  auctionState.currentBidTeamName = team.team_name;
  auctionState.bidHistory.unshift(bid);

  await excel.updateSettings({ currentBid: String(bidAmount), currentBidTeamId: teamId, currentBidTeamName: team.team_name });

  broadcast('BID_PLACED', { bid, currentBid: bidAmount, team: team.team_name, minNextBid: bidAmount + bidIncrement });
  await startTimer();
  return bid;
}

async function pauseAuction() {
  stopTimer();
  auctionState.state = 'PAUSED';
  await excel.updateSettings({ auctionState: 'PAUSED' });
  broadcast('AUCTION_PAUSED', {});
}

async function resumeAuction() {
  auctionState.state = 'LIVE';
  await excel.updateSettings({ auctionState: 'LIVE' });
  broadcast('AUCTION_RESUMED', {});
  await startTimer();
}

async function markSold() {
  if (!auctionState.currentPlayer || !auctionState.currentBidTeamId) throw new Error('No winning bid');
  stopTimer();
  await autoSold();
}

async function markUnsold() {
  stopTimer();
  await autoUnsold();
}

async function undoLastAuction() {
  const auctions = await excel.getAuctions();
  const last = [...auctions].reverse().find(a => a.status === 'SOLD');
  if (!last) throw new Error('No sold auction to undo');

  await excel.updatePlayer(last.player_id, { status: 'AVAILABLE', team_id: '', final_bid: '' });
  const team = await excel.getTeamById(last.winning_team_id);
  if (team) {
    await excel.updateTeam(last.winning_team_id, {
      remaining_purse: Number(team.remaining_purse) + Number(last.final_bid),
      players_count: Math.max(0, Number(team.players_count) - 1)
    });
  }
  await excel.saveAuction({ ...last, status: 'UNDONE' });
  broadcast('AUCTION_RESUMED', { message: 'Last auction undone' });
  return last;
}

async function resetAuction() {
  stopTimer();
  auctionState = {
    state: 'NOT_STARTED', currentPlayer: null, currentAuctionId: null,
    currentBid: 0, currentBidTeamId: null, currentBidTeamName: null,
    timerSeconds: 20, bidHistory: []
  };
  await excel.updateSettings({ auctionState: 'NOT_STARTED', currentPlayerId: '', currentBid: '0', currentBidTeamId: '', currentBidTeamName: '', currentAuctionId: '' });
  broadcast('AUCTION_COMPLETED', { message: 'Auction reset' });
}

async function restoreStateFromExcel() {
  const settings = await excel.getSettings();
  auctionState.state = settings.auctionState || 'NOT_STARTED';
  auctionState.currentBid = parseInt(settings.currentBid) || 0;
  auctionState.currentBidTeamId = settings.currentBidTeamId || null;
  auctionState.currentBidTeamName = settings.currentBidTeamName || null;
  auctionState.currentAuctionId = settings.currentAuctionId || null;
  if (settings.currentPlayerId) {
    auctionState.currentPlayer = await excel.getPlayerById(settings.currentPlayerId);
  }
  if (auctionState.currentAuctionId) {
    auctionState.bidHistory = await excel.getBids(auctionState.currentAuctionId);
    auctionState.bidHistory.sort((a, b) => new Date(b.bid_time) - new Date(a.bid_time));
  }
}

module.exports = {
  setIO, getState, selectPlayer, randomPlayer, startAuction,
  placeBid, pauseAuction, resumeAuction, markSold, markUnsold,
  undoLastAuction, resetAuction, restoreStateFromExcel
};
