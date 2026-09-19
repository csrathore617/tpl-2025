export interface Player {
  player_id: string;
  name: string;
  photo: string;
  dob: string;
  age: number | string;
  city: string;
  role: 'Batsman' | 'Bowler' | 'All Rounder' | 'Wicket Keeper';
  batting_style: string;
  bowling_style: string;
  experience: string;
  preferred_position: string;
  jersey_number: string;
  registration_date: string;
  status: 'REGISTERED' | 'VERIFIED' | 'AVAILABLE' | 'SOLD' | 'UNSOLD' | 'RETAINED' | 'WITHDRAWN';
  team_id: string;
  final_bid: number | string;
}

export interface Team {
  team_id: string;
  team_name: string;
  short_name: string;
  logo: string;
  owner_name: string;
  city: string;
  team_color: string;
  status: 'REGISTERED' | 'ACTIVE' | 'INACTIVE';
  initial_purse: number;
  remaining_purse: number;
  players_count: number;
  registration_date: string;
}

export interface AuctionRecord {
  auction_id: string;
  player_id: string;
  player_name: string;
  base_price: number;
  winning_team_id: string;
  winning_team_name: string;
  final_bid: number;
  status: string;
  bid_count: number;
  auction_time: string;
}

export interface Bid {
  bid_id: string;
  auction_id: string;
  player_id: string;
  team_id: string;
  team_name: string;
  bid_amount: number;
  bid_time: string;
}

export interface Announcement {
  announcement_id: string;
  message: string;
  priority: string;
  active: string | boolean;
  created_at: string;
}

export interface Settings {
  maxTeams: string;
  initialPurse: string;
  baseBid: string;
  bidIncrement: string;
  auctionTimer: string;
  tournamentDate: string;
  tournamentVenue: string;
}

export interface Season {
  season_id: string;
  season_number: string;
  season_name: string;
  year: string;
  champion_team: string;
  champion_logo: string;
  champion_image: string;
  captain: string;
  man_of_series: string;
  runner_up: string;
  final_description: string;
  final_score: string;
  venue: string;
  status: string;
  display_order: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  gallery_id: string;
  season_id: string;
  title: string;
  description: string;
  category: string;
  image_path: string;
  featured: string;
  display_order: string;
  active: string | boolean;
  uploaded_at: string;
  updated_at: string;
}

export interface TournamentSettings {
  venue_name: string;
  venue_address: string;
  opening_time: string;
  closing_time: string;
  phone: string;
  whatsapp: string;
  phone_available: string;
  primary_email: string;
  support_email: string;
  response_time: string;
  maps_url: string;
}

export interface AuctionState {
  state: 'NOT_STARTED' | 'READY' | 'LIVE' | 'PAUSED' | 'SOLD' | 'UNSOLD' | 'COMPLETED';
  currentPlayer: Player | null;
  currentAuctionId: string | null;
  currentBid: number;
  currentBidTeamId: string | null;
  currentBidTeamName: string | null;
  timerSeconds: number;
  bidHistory: Bid[];
  minNextBid: number;
  baseBid: number;
  bidIncrement: number;
}

export interface Stats {
  totalPlayers: number;
  verifiedPlayers: number;
  availablePlayers: number;
  soldPlayers: number;
  unsoldPlayers: number;
  totalTeams: number;
  totalAuctionValue: number;
  auctionState: string;
}

export interface AuthUser {
  token: string;
  role: 'admin' | 'team_owner';
  username?: string;
  teamId?: string;
  teamName?: string;
}
