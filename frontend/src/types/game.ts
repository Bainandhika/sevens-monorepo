/**
 * Core TypeScript Domain Models for 7-an (Tujuhan Tactical)
 * Single Source of Truth (SSOT) client domain types.
 */

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type AceMode = 'LOCKED_NONE' | 'LOW' | 'HIGH';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export type CommunityStatus = 'NONE' | 'RT' | 'RW';

export type ScreenName = 'lobby' | 'waiting_room' | 'gameplay' | 'scoreboard' | 'shuffling';

export type ScreenRoute = ScreenName;

export type ServerHealthStatus = 'ready' | 'waking' | 'offline';

export type RankLabel = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type SuitSymbol = '♠' | '♥' | '♣' | '♦';

export type SuitNameId = 'Sekop' | 'Hati' | 'Keriting' | 'Wajik';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface SuitState {
  minPlayed: number;
  maxPlayed: number;
  hasSeven: boolean;
  hasAce: boolean;
}

export interface BoardState {
  suits: Record<Suit, SuitState>;
}

export interface Player {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  isBot: boolean;
  botLevel?: BotDifficulty;
  isHost?: boolean;
  isReady: boolean;
  hand: Card[];
  foldedCards: Card[];
  penaltyPoints: number;
  lossesCount: number;
  consecutiveLosses?: number;
  statusRtRw?: CommunityStatus;
  isConnected: boolean;
}

export interface FoldedCardScoreDetail {
  card: Card;
  points: number;
  isKeyCardPenalty: boolean;
  isAceLocked: boolean;
}

export interface PlayerScoreDetail {
  playerId: string;
  playerName: string;
  rankPosition: 1 | 2 | 3 | 4;
  foldedCards: Array<{
    card: Card;
    points: number;
    isKeyCardPenalty: boolean;
    isAceLocked: boolean;
  }>;
  totalPenalty: number;
  lossesCount?: number;
  consecutiveLosses?: number;
  statusRtRw?: CommunityStatus;
  isWinner: boolean;
  isJuruKunci: boolean;
}

export type ScoreDetail = PlayerScoreDetail;

export interface RoomState {
  id: string;
  mode: 'offline' | 'online';
  status: 'waiting' | 'playing' | 'finished';
  roundNumber: number;
  turnNumber: number;
  currentTurn: string;
  aceMode: AceMode;
  openerSuit: Suit;
  board: BoardState;
  players: Player[];
  scores?: Record<string, PlayerScoreDetail>;
  rtRwHolderId?: string;
  rtRwStatus?: CommunityStatus;
}

export type ModalType =
  | 'none'
  | 'rules'
  | 'key_warning'
  | 'cold_start'
  | 'rematch'
  | 'settings'
  | 'round_log';

export type ActiveModalType = ModalType;

export interface ToastState {
  visible: boolean;
  icon: string;
  message: string;
}

