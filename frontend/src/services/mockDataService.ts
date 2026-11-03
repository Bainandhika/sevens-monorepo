import {
  AceMode,
  BoardState,
  BotDifficulty,
  Card,
  Player,
  PlayerScoreDetail,
  Rank,
  RoomState,
  Suit,
} from '../types/game';
import {
  ALL_RANKS,
  ALL_SUITS,
  AVATAR_COLORS,
  KEY_CARD_PENALTY_POINTS,
  ROOM_CODE_LENGTH,
} from '../constants/designTokens';

/**
 * Interface contract for MockDataService as specified in Step 24.
 */
export interface MockDataService {
  generateRoomCode: () => string;
  getInitials: (name: string) => string;
  dealValidHandsWithOpener: () => { hands: Card[][]; openerCard: Card };
  calculateCardPenalty: (
    card: Card,
    aceMode: AceMode
  ) => { points: number; isKeyCardPenalty: boolean; isAceLocked: boolean };
  buildFinalScoreboard: (
    players: Player[],
    aceMode: AceMode
  ) => Record<string, PlayerScoreDetail>;
  createOfflineMatchState: (
    humanPlayer: { id: string; name: string },
    difficulty: BotDifficulty,
    existingLosses?: Record<string, number>,
    roundNumber?: number
  ) => RoomState;
}

/**
 * High-contrast Neo-Brutalist avatar colors for the 4 offline players
 * Strictly follows ui_rules: '#4F46E5', '#F59E0B', '#A855F7', '#00D084'
 */
export const OFFLINE_AVATAR_COLORS = [
  AVATAR_COLORS[0] ?? '#4F46E5', // Human player (Indigo)
  AVATAR_COLORS[1] ?? '#F59E0B', // Bot 1 (Amber)
  AVATAR_COLORS[2] ?? '#A855F7', // Bot 2 (Purple)
  AVATAR_COLORS[3] ?? '#00D084', // Bot 3 (Mint)
] as const;

/**
 * Tactical suit sort order (Sekop -> Hati -> Keriting -> Wajik)
 */
const SUIT_SORT_ORDER: Record<Suit, number> = {
  spades: 0,
  hearts: 1,
  clubs: 2,
  diamonds: 3,
};

/**
 * Creates a standard 52-card deck (4 suits x 13 ranks)
 */
export function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Standard Fisher-Yates array shuffle
 */
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sorts cards by tactical suit order and ascending rank (1-13)
 */
export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_SORT_ORDER[a.suit] - SUIT_SORT_ORDER[b.suit];
    }
    return a.rank - b.rank;
  });
}

/**
 * Generates a clean 6-character uppercase alphanumeric room code.
 * Excludes ambiguous characters (0, O, 1, I) to maintain readability on mobile screens.
 */
export function generateRoomCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return code;
}

/**
 * Generates exactly 2 uppercase characters avatar initials from a player nickname.
 * Follows Google Stitch UI standards:
 * - 'Sekop07' -> 'S7' (initial + trailing digit)
 * - 'Wajik99' -> 'W9'
 * - 'Bot Taktis' -> 'BT' (first letters of words)
 * - 'Elena_F' -> 'EF' (delimited letters)
 * - 'Bagus_K' -> 'BK'
 * - 'PitMrtn' -> 'PM' (PascalCase capitals)
 * - 'Ksatria' -> 'KS' (first two letters)
 * - 'A' -> 'A7'
 * - '' -> '77'
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '77';
  }

  const clean = name.trim();

  // Single character: append '7' as the tactical anchor signature
  if (clean.length === 1) {
    return `${clean.toUpperCase()}7`;
  }

  // Multi-word or underscore-delimited names (e.g. 'Bot Taktis', 'Elena_F', 'Bagus_K')
  const parts = clean.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Trailing digit pattern (e.g. 'Sekop07' -> 'S7', 'Wajik99' -> 'W9')
  const lastChar = clean[clean.length - 1];
  if (/\d/.test(lastChar)) {
    return (clean[0] + lastChar).toUpperCase();
  }

  // PascalCase capital letters (e.g. 'PitMrtn' -> 'PM')
  const uppercaseMatches = clean.match(/[A-Z]/g);
  if (uppercaseMatches && uppercaseMatches.length >= 2) {
    return (uppercaseMatches[0] + uppercaseMatches[1]).toUpperCase();
  }

  // Default to first two letters
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Mathematical fallback to deal cards ensuring no player receives >= 3 cards of rank 7.
 * Distributes exactly one 7 to each of the 4 players, then distributes remaining 48 cards.
 */
function dealGuaranteedBalancedHands(): Card[][] {
  const sevens: Card[] = ALL_SUITS.map((suit) => ({ suit, rank: 7 as Rank }));
  const nonSevens: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      if (rank !== 7) {
        nonSevens.push({ suit, rank });
      }
    }
  }

  const shuffledSevens = shuffleCards(sevens);
  const shuffledOthers = shuffleCards(nonSevens);

  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    hands[i].push(shuffledSevens[i]);
  }

  for (let i = 0; i < shuffledOthers.length; i++) {
    hands[i % 4].push(shuffledOthers[i]);
  }

  return hands;
}

/**
 * Deals 52 cards to 4 players with mandatory Auto-Reshuffle rule:
 * - If ANY player holds >= 3 cards of rank 7, cards are automatically reshuffled & redealt.
 * - Automatically chooses an opener suit (random among 4 suits), places that 7 to the table,
 *   and removes it from the holding player's hand.
 * - Returns the resulting 4 hands (sorted) and the opener Card.
 */
export function dealValidHandsWithOpener(): {
  hands: Card[][];
  openerCard: Card;
  openerPlayerIndex: number;
} {
  const maxAttempts = 500;
  let attempts = 0;
  let selectedHands: Card[][] | null = null;

  while (attempts < maxAttempts) {
    attempts++;
    const shuffled = shuffleCards(createStandardDeck());
    const hands: Card[][] = [[], [], [], []];

    for (let i = 0; i < 52; i++) {
      hands[i % 4].push(shuffled[i]);
    }

    const anyExcessSevens = hands.some((hand) => {
      const sevens = hand.filter((c) => c.rank === 7);
      return sevens.length >= 3;
    });

    if (!anyExcessSevens) {
      selectedHands = hands;
      break;
    }
  }

  // Fallback to mathematically balanced deal if random attempts exceed threshold
  if (!selectedHands) {
    selectedHands = dealGuaranteedBalancedHands();
  }

  // Select random opener suit
  const openerSuit = ALL_SUITS[Math.floor(Math.random() * ALL_SUITS.length)];
  const openerCard: Card = { suit: openerSuit, rank: 7 };

  // Find player holding the opener 7 card
  let openerPlayerIndex = -1;
  for (let pIdx = 0; pIdx < selectedHands.length; pIdx++) {
    const cardIdx = selectedHands[pIdx].findIndex(
      (c) => c.suit === openerSuit && c.rank === 7
    );
    if (cardIdx !== -1) {
      openerPlayerIndex = pIdx;
      // Peletakan otomatis kartu 7 pembuka ke tengah meja (dikeluarkan dari tangan)
      selectedHands[pIdx].splice(cardIdx, 1);
      break;
    }
  }

  if (openerPlayerIndex === -1) {
    openerPlayerIndex = 0;
  }

  const sortedHands = selectedHands.map(sortHand);

  return {
    hands: sortedHands,
    openerCard,
    openerPlayerIndex,
  };
}

/**
 * Calculates tactical penalty points for folded/unplayed cards adhering to Tujuhan rules:
 * - Key cards 6 & 8: Flat 30 points penalty (isKeyCardPenalty = true)
 * - Ace (1): 0 points (LOCKED_NONE), 1 point (LOW), 15 points (HIGH)
 * - Nominal cards (2-5, 7, 9-13): Nominal rank value (points = rank)
 */
export function calculateCardPenalty(
  card: Card,
  aceMode: AceMode
): { points: number; isKeyCardPenalty: boolean; isAceLocked: boolean } {
  // Key cards 6 & 8 have flat 30 penalty points
  if (card.rank === 6 || card.rank === 8) {
    return {
      points: KEY_CARD_PENALTY_POINTS,
      isKeyCardPenalty: true,
      isAceLocked: false,
    };
  }

  // Ace card (1) scoring rules based on aceMode
  if (card.rank === 1) {
    let points = 0;
    if (aceMode === 'LOW') {
      points = 1;
    } else if (aceMode === 'HIGH') {
      points = 15;
    } else {
      points = 0; // 'LOCKED_NONE'
    }

    return {
      points,
      isKeyCardPenalty: false,
      isAceLocked: aceMode !== 'LOCKED_NONE',
    };
  }

  // Nominal cards: 2-5, 7, 9, 10, J(11), Q(12), K(13)
  return {
    points: card.rank,
    isKeyCardPenalty: false,
    isAceLocked: false,
  };
}

/**
 * Builds the final scoreboard rankings from an array of players and the current AceMode:
 * - Calculates breakdown of folded cards with individual penalties
 * - Computes total penalty points
 * - Ranks players in ascending order of total penalty (Rank 1 = Juara/Winner, Rank 4 = Juru Kunci)
 * - Resolves ties by fewest folded cards, then player seat order
 */
export function buildFinalScoreboard(
  players: Player[],
  aceMode: AceMode
): Record<string, PlayerScoreDetail> {
  const playerBreakdown = players.map((player) => {
    const foldedCardsWithPoints = (player.foldedCards || []).map((card) => ({
      card,
      ...calculateCardPenalty(card, aceMode),
    }));

    const totalPenalty = foldedCardsWithPoints.reduce(
      (sum, item) => sum + item.points,
      0
    );

    return {
      player,
      foldedCardsWithPoints,
      totalPenalty,
    };
  });

  // Sort ascending: lowest penalty is 1st place (winner), highest is 4th place (Juru Kunci)
  playerBreakdown.sort((a, b) => {
    if (a.totalPenalty !== b.totalPenalty) {
      return a.totalPenalty - b.totalPenalty;
    }
    return a.foldedCardsWithPoints.length - b.foldedCardsWithPoints.length;
  });

  const scoreboard: Record<string, PlayerScoreDetail> = {};

  playerBreakdown.forEach((entry, index) => {
    const rankPosition = (index + 1) as 1 | 2 | 3 | 4;
    const isWinner = rankPosition === 1;
    const isJuruKunci = rankPosition === 4;

    scoreboard[entry.player.id] = {
      playerId: entry.player.id,
      playerName: entry.player.name,
      rankPosition,
      foldedCards: entry.foldedCardsWithPoints,
      totalPenalty: entry.totalPenalty,
      isWinner,
      isJuruKunci,
    };
  });

  return scoreboard;
}

/**
 * Creates a fully initialized offline match RoomState:
 * - Human player at slot 0 with color '#4F46E5'
 * - 3 Bots at slots 1-3 with distinct high-contrast colors '#F59E0B', '#A855F7', '#00D084'
 * - 52 cards dealt with Auto-Reshuffle rule (reshuffle if any player holds >= 3 sevens)
 * - Opener 7 automatically placed onto the board, opening suit determined
 * - Current turn assigned to the player next clockwise after the opener
 * - Existing losses tracked and assigned to players
 */
export function createOfflineMatchState(
  humanPlayer: { id: string; name: string },
  difficulty: BotDifficulty = 'medium',
  existingLosses: Record<string, number> = {},
  roundNumber: number = 1
): RoomState {
  const dealResult = dealValidHandsWithOpener();
  const { hands, openerCard, openerPlayerIndex } = dealResult;

  const humanName = humanPlayer.name?.trim() || 'Sekop07';
  const humanId = humanPlayer.id || 'p_human';

  const human: Player = {
    id: humanId,
    name: humanName,
    initials: getInitials(humanName),
    avatarColor: OFFLINE_AVATAR_COLORS[0], // '#4F46E5'
    isBot: false,
    isHost: true,
    isReady: true,
    hand: hands[0],
    foldedCards: [],
    penaltyPoints: 0,
    lossesCount: existingLosses[humanId] ?? 0,
    isConnected: true,
  };

  const bot1: Player = {
    id: 'bot_1',
    name: 'Bot Taktis',
    initials: 'BT',
    avatarColor: OFFLINE_AVATAR_COLORS[1], // '#F59E0B'
    isBot: true,
    botLevel: difficulty,
    isHost: false,
    isReady: true,
    hand: hands[1],
    foldedCards: [],
    penaltyPoints: 0,
    lossesCount: existingLosses['bot_1'] ?? 0,
    isConnected: true,
  };

  const bot2: Player = {
    id: 'bot_2',
    name: 'Bot Cermat',
    initials: 'BC',
    avatarColor: OFFLINE_AVATAR_COLORS[2], // '#A855F7'
    isBot: true,
    botLevel: difficulty,
    isHost: false,
    isReady: true,
    hand: hands[2],
    foldedCards: [],
    penaltyPoints: 0,
    lossesCount: existingLosses['bot_2'] ?? 0,
    isConnected: true,
  };

  const bot3: Player = {
    id: 'bot_3',
    name: 'Bot Agresif',
    initials: 'BA',
    avatarColor: OFFLINE_AVATAR_COLORS[3], // '#00D084'
    isBot: true,
    botLevel: difficulty,
    isHost: false,
    isReady: true,
    hand: hands[3],
    foldedCards: [],
    penaltyPoints: 0,
    lossesCount: existingLosses['bot_3'] ?? 0,
    isConnected: true,
  };

  const players: Player[] = [human, bot1, bot2, bot3];

  // Initialize board with the opener 7 placed
  const initialBoard: BoardState = {
    suits: {
      spades: {
        minPlayed: 7,
        maxPlayed: 7,
        hasSeven: openerCard.suit === 'spades',
        hasAce: false,
      },
      hearts: {
        minPlayed: 7,
        maxPlayed: 7,
        hasSeven: openerCard.suit === 'hearts',
        hasAce: false,
      },
      clubs: {
        minPlayed: 7,
        maxPlayed: 7,
        hasSeven: openerCard.suit === 'clubs',
        hasAce: false,
      },
      diamonds: {
        minPlayed: 7,
        maxPlayed: 7,
        hasSeven: openerCard.suit === 'diamonds',
        hasAce: false,
      },
    },
  };

  // Turn passes to the next player clockwise from the opener player
  const nextPlayerIndex = (openerPlayerIndex + 1) % 4;
  const currentTurn = players[nextPlayerIndex].id;

  const roomCode = generateRoomCode();

  return {
    id: `offline_${roomCode}`,
    mode: 'offline',
    status: 'playing',
    roundNumber,
    turnNumber: 1,
    currentTurn,
    aceMode: 'LOCKED_NONE',
    openerSuit: openerCard.suit,
    board: initialBoard,
    players,
  };
}

/**
 * Updates player lossesCount after round finalization.
 * Adds 1 to the loss count of the 4th rank (Juru Kunci) player ("Kalah: Nx").
 */
export function applyRoundLosses(
  players: Player[],
  scoreboard: Record<string, PlayerScoreDetail>
): Player[] {
  return players.map((player) => {
    const detail = scoreboard[player.id];
    const isJuruKunci = detail ? detail.isJuruKunci : false;
    return {
      ...player,
      lossesCount: isJuruKunci ? (player.lossesCount || 0) + 1 : (player.lossesCount || 0),
    };
  });
}

/**
 * Generates dummy scoreboard preview data exactly matching Google Stitch Screen f0929f7d41dd4a3f82fdb77e65683df9.
 * Useful for development testing, storyboards, and instant preview.
 */
export function createDummyScoreboardData(
  userDisplayName: string = 'Sekop07',
  userId: string = 'p_user'
): Record<string, PlayerScoreDetail> {
  return {
    [userId]: {
      playerId: userId,
      playerName: userDisplayName,
      rankPosition: 1,
      foldedCards: [],
      totalPenalty: 0,
      isWinner: true,
      isJuruKunci: false,
    },
    bot_elena: {
      playerId: 'bot_elena',
      playerName: 'Elena_F',
      rankPosition: 2,
      foldedCards: [
        {
          card: { suit: 'spades', rank: 4 },
          points: 4,
          isKeyCardPenalty: false,
          isAceLocked: false,
        },
        {
          card: { suit: 'hearts', rank: 5 },
          points: 5,
          isKeyCardPenalty: false,
          isAceLocked: false,
        },
      ],
      totalPenalty: 9,
      isWinner: false,
      isJuruKunci: false,
    },
    bot_pitmrtn: {
      playerId: 'bot_pitmrtn',
      playerName: 'PitMrtn',
      rankPosition: 3,
      foldedCards: [
        {
          card: { suit: 'diamonds', rank: 6 },
          points: 30,
          isKeyCardPenalty: true,
          isAceLocked: false,
        },
        {
          card: { suit: 'clubs', rank: 8 },
          points: 8,
          isKeyCardPenalty: false,
          isAceLocked: false,
        },
      ],
      totalPenalty: 38,
      isWinner: false,
      isJuruKunci: false,
    },
    bot_bagus: {
      playerId: 'bot_bagus',
      playerName: 'Bagus_K',
      rankPosition: 4,
      foldedCards: [
        {
          card: { suit: 'spades', rank: 6 },
          points: 30,
          isKeyCardPenalty: true,
          isAceLocked: false,
        },
        {
          card: { suit: 'hearts', rank: 8 },
          points: 30,
          isKeyCardPenalty: true,
          isAceLocked: false,
        },
        {
          card: { suit: 'spades', rank: 1 },
          points: 15,
          isKeyCardPenalty: false,
          isAceLocked: true,
        },
      ],
      totalPenalty: 75,
      isWinner: false,
      isJuruKunci: true,
    },
  };
}

/**
 * Creates dummy finished match RoomState for instant testing of ScoreboardScreen
 */
export function createDummyFinishedMatchState(
  humanPlayer: { id: string; name: string } = { id: 'p_user', name: 'Sekop07' },
  aceMode: AceMode = 'HIGH',
  existingLosses: Record<string, number> = {}
): RoomState {
  const scoreboard = createDummyScoreboardData(humanPlayer.name, humanPlayer.id);

  const human: Player = {
    id: humanPlayer.id,
    name: humanPlayer.name,
    initials: getInitials(humanPlayer.name),
    avatarColor: OFFLINE_AVATAR_COLORS[0],
    isBot: false,
    isHost: true,
    isReady: true,
    hand: [],
    foldedCards: [],
    penaltyPoints: 0,
    lossesCount: existingLosses[humanPlayer.id] ?? 0,
    isConnected: true,
  };

  const bot1: Player = {
    id: 'bot_elena',
    name: 'Elena_F',
    initials: 'EF',
    avatarColor: OFFLINE_AVATAR_COLORS[1],
    isBot: true,
    botLevel: 'medium',
    isHost: false,
    isReady: true,
    hand: [],
    foldedCards: scoreboard['bot_elena'].foldedCards.map((f) => f.card),
    penaltyPoints: scoreboard['bot_elena'].totalPenalty,
    lossesCount: existingLosses['bot_elena'] ?? 0,
    isConnected: true,
  };

  const bot2: Player = {
    id: 'bot_pitmrtn',
    name: 'PitMrtn',
    initials: 'PM',
    avatarColor: OFFLINE_AVATAR_COLORS[2],
    isBot: true,
    botLevel: 'medium',
    isHost: false,
    isReady: true,
    hand: [],
    foldedCards: scoreboard['bot_pitmrtn'].foldedCards.map((f) => f.card),
    penaltyPoints: scoreboard['bot_pitmrtn'].totalPenalty,
    lossesCount: existingLosses['bot_pitmrtn'] ?? 0,
    isConnected: true,
  };

  const bot3: Player = {
    id: 'bot_bagus',
    name: 'Bagus_K',
    initials: 'BK',
    avatarColor: OFFLINE_AVATAR_COLORS[3],
    isBot: true,
    botLevel: 'medium',
    isHost: false,
    isReady: true,
    hand: [],
    foldedCards: scoreboard['bot_bagus'].foldedCards.map((f) => f.card),
    penaltyPoints: scoreboard['bot_bagus'].totalPenalty,
    lossesCount: (existingLosses['bot_bagus'] ?? 0) + 1, // +1 for Juru Kunci
    isConnected: true,
  };

  const players: Player[] = [human, bot1, bot2, bot3];

  const board: BoardState = {
    suits: {
      spades: { minPlayed: 1, maxPlayed: 13, hasSeven: true, hasAce: true },
      hearts: { minPlayed: 2, maxPlayed: 12, hasSeven: true, hasAce: false },
      clubs: { minPlayed: 3, maxPlayed: 11, hasSeven: true, hasAce: false },
      diamonds: { minPlayed: 5, maxPlayed: 10, hasSeven: true, hasAce: false },
    },
  };

  return {
    id: `offline_${generateRoomCode()}`,
    mode: 'offline',
    status: 'finished',
    roundNumber: 1,
    turnNumber: 52,
    currentTurn: '',
    aceMode,
    openerSuit: 'spades',
    board,
    players,
    scores: scoreboard,
  };
}

/**
 * Service implementation export complying with MockDataService
 */
export const mockDataService: MockDataService = {
  generateRoomCode,
  getInitials,
  dealValidHandsWithOpener,
  calculateCardPenalty,
  buildFinalScoreboard,
  createOfflineMatchState,
};

export default mockDataService;
