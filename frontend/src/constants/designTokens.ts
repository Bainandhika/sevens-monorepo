import {
  AceMode,
  Card,
  Rank,
  RankLabel,
  Suit,
  SuitNameId,
  SuitSymbol,
} from '../types/game';

/**
 * High-contrast Suit Configuration following DESIGN.md & Stitch specifications:
 * - Spades ('♠') & Clubs ('♣') use Deep Black '#0F172A' / '#000000'
 * - Hearts ('♥') & Diamonds ('♦') use Coral Red '#FF4343' / '#FF3B30'
 */
export const SUIT_SYMBOLS: Record<Suit, SuitSymbol> = {
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
  diamonds: '♦',
};

export const SUIT_NAMES_ID: Record<Suit, SuitNameId> = {
  spades: 'Sekop',
  hearts: 'Hati',
  clubs: 'Keriting',
  diamonds: 'Wajik',
};

export const SUIT_COLORS: Record<
  Suit,
  {
    primary: string;
    deep: string;
    isRed: boolean;
    name: SuitNameId;
    symbol: SuitSymbol;
  }
> = {
  spades: {
    primary: '#000000',
    deep: '#0F172A',
    isRed: false,
    name: 'Sekop',
    symbol: '♠',
  },
  hearts: {
    primary: '#FF4343',
    deep: '#FF3B30',
    isRed: true,
    name: 'Hati',
    symbol: '♥',
  },
  clubs: {
    primary: '#000000',
    deep: '#0F172A',
    isRed: false,
    name: 'Keriting',
    symbol: '♣',
  },
  diamonds: {
    primary: '#FF4343',
    deep: '#FF3B30',
    isRed: true,
    name: 'Wajik',
    symbol: '♦',
  },
};

export const SUIT_COLOR_HEX: Record<Suit, string> = {
  spades: '#000000',
  hearts: '#FF4343',
  clubs: '#000000',
  diamonds: '#FF4343',
};

/**
 * 7-character alphanumeric preset nicknames for rapid randomized guest onboarding.
 */
export const DICE_NICKNAME_PRESETS: readonly string[] = [
  'Sekop07',
  'Wajik99',
  'Ksatria',
  'Taktik7',
  'Garuda7',
  'RajaAs1',
  'Kunci68',
  'Master7',
] as const;

export const MAX_NICKNAME_LENGTH = 7;
export const ROOM_CODE_LENGTH = 6;
export const RECONNECT_TIMEOUT_SECONDS = 30;
export const TURN_TIME_LIMIT_SECONDS = 10;
export const TURN_TIME_URGENT_SECONDS = 4;

/**
 * Card Rank Definitions & Ranks
 */
export const ALL_SUITS: readonly Suit[] = [
  'spades',
  'hearts',
  'clubs',
  'diamonds',
] as const;

export const ALL_RANKS: readonly Rank[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;

export const RANK_LABELS: Record<Rank, RankLabel> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

/**
 * Tactical Key Card & Rule Constants
 * - Key cards 6 & 8: flat 30 penalty points if folded/unplayed.
 * - Anchor card 7: always starts the column. Cannot be folded.
 * - Ace card 1: points determined by AceMode (0 / 1 / 15).
 */
export const ANCHOR_RANK: Rank = 7;
export const ACE_RANK: Rank = 1;
export const KEY_CARD_RANKS: readonly Rank[] = [6, 8] as const;
export const KEY_CARD_PENALTY_POINTS = 30;

export const ACE_PENALTY_BY_MODE: Record<AceMode, number> = {
  LOCKED_NONE: 0,
  LOW: 1,
  HIGH: 15,
};

export const ACE_MODE_LABELS: Record<AceMode, string> = {
  LOCKED_NONE: 'Belum Terbuka',
  LOW: 'As Rendah (1)',
  HIGH: 'As Tinggi (15)',
};

/**
 * Returns true if the rank or card is a key card (6 or 8).
 */
export function isKeyCard(cardOrRank: Card | Rank): boolean {
  const rank = typeof cardOrRank === 'number' ? cardOrRank : cardOrRank.rank;
  return rank === 6 || rank === 8;
}

/**
 * Returns true if the rank or card is the center anchor card 7.
 */
export function isAnchorCard(cardOrRank: Card | Rank): boolean {
  const rank = typeof cardOrRank === 'number' ? cardOrRank : cardOrRank.rank;
  return rank === ANCHOR_RANK;
}

/**
 * Calculates card penalty point breakdown strictly adhering to Tujuhan Tactical rules:
 * - 6 and 8: Flat 30 points (isKeyCardPenalty = true)
 * - Ace (1): 0 points (LOCKED_NONE), 1 point (LOW), 15 points (HIGH)
 * - 2-10: Nominal face value (2 to 10 points)
 * - J (11), Q (12), K (13): 11, 12, 13 points
 */
export function calculateCardPenalty(
  card: Card,
  aceMode: AceMode
): { points: number; isKeyCardPenalty: boolean; isAceLocked: boolean } {
  if (card.rank === 6 || card.rank === 8) {
    return {
      points: KEY_CARD_PENALTY_POINTS,
      isKeyCardPenalty: true,
      isAceLocked: false,
    };
  }

  if (card.rank === 1) {
    return {
      points: ACE_PENALTY_BY_MODE[aceMode],
      isKeyCardPenalty: false,
      isAceLocked: aceMode !== 'LOCKED_NONE',
    };
  }

  return {
    points: card.rank,
    isKeyCardPenalty: false,
    isAceLocked: false,
  };
}

/**
 * Neo-Brutalist Color Tokens
 */
export const NEO_COLORS = {
  bg: '#F5F0EA',
  surface: '#FAF8FF',
  white: '#FFFFFF',
  black: '#000000',
  dark: '#131B2E',
  yellow: '#FFE600',
  mint: '#00D084',
  emerald: '#10B981',
  coral: '#FF4343',
  red: '#FF4D4D',
  cyan: '#00D4FF',
  tableFelt: '#055A36',
  tableDark: '#033B23',
  tableLight: '#087346',
} as const;

/**
 * Hard-Edge Box Shadow Tokens (no blur)
 */
export const NEO_SHADOWS = {
  xs: '1px 1px 0px #000000',
  sm: '2px 2px 0px #000000',
  card: '2.5px 2.5px 0px #000000',
  default: '3.5px 3.5px 0px #000000',
  md: '4px 4px 0px #000000',
  lg: '6px 6px 0px #000000',
} as const;

/**
 * Distinct High-Contrast Avatar Colors for Players & Bots
 */
export const AVATAR_COLORS: readonly string[] = [
  '#4F46E5', // Indigo
  '#F59E0B', // Amber
  '#A855F7', // Purple
  '#00D084', // Mint
  '#FF4343', // Coral
  '#00D4FF', // Cyan
  '#EC4899', // Pink
  '#3B82F6', // Blue
] as const;

