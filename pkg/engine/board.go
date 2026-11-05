package engine

import (
	"errors"
	"fmt"
)

// Suit represents the playing card suit.
type Suit string

const (
	Spades   Suit = "spades"
	Hearts   Suit = "hearts"
	Clubs    Suit = "clubs"
	Diamonds Suit = "diamonds"
)

// AllSuits lists all four standard card suits.
var AllSuits = []Suit{Spades, Hearts, Clubs, Diamonds}

// AceMode represents the current Ace State Machine mode.
type AceMode string

const (
	AceModeLockedNone AceMode = "LOCKED_NONE"
	AceModeLow        AceMode = "LOW"
	AceModeHigh       AceMode = "HIGH"
)

// Core rank constants for the 7-an card game.
const (
	AnchorRank   = 7
	AceRank      = 1
	KeyRankSix   = 6
	KeyRankEight = 8
)

// Card represents a single playing card.
// Rank: 1 = Ace, 2-10, 11 = Jack, 12 = Queen, 13 = King.
type Card struct {
	Suit Suit `json:"suit"`
	Rank int  `json:"rank"`
}

func (c Card) String() string {
	return fmt.Sprintf("%s-%d", c.Suit, c.Rank)
}

// SuitState tracks the lowest and highest ranks played on the table for a suit.
type SuitState struct {
	MinPlayed int  `json:"minPlayed"`
	MaxPlayed int  `json:"maxPlayed"`
	HasSeven  bool `json:"hasSeven"`
	HasAce    bool `json:"hasAce"`
}

// Board represents the game table state.
type Board struct {
	Suits map[Suit]*SuitState `json:"suits"`
}

// NewBoard initializes an empty Sevens board with all 4 suits.
func NewBoard() *Board {
	suits := make(map[Suit]*SuitState, len(AllSuits))
	for _, s := range AllSuits {
		suits[s] = &SuitState{
			MinPlayed: AnchorRank,
			MaxPlayed: AnchorRank,
			HasSeven:  false,
			HasAce:    false,
		}
	}
	return &Board{Suits: suits}
}

// CanPlay validates if a card can be placed on the board assuming AceModeLockedNone.
func (b *Board) CanPlay(card Card) bool {
	return b.CanPlayWithAceMode(card, AceModeLockedNone)
}

// CanPlayWithAceMode validates if a card can be placed on the board under the specified AceMode.
func (b *Board) CanPlayWithAceMode(card Card, aceMode AceMode) bool {
	state, exists := b.Suits[card.Suit]
	if !exists {
		return false
	}

	// Rank 7 cards are always legal to open a suit lane if HasSeven == false
	if card.Rank == AnchorRank {
		return !state.HasSeven
	}

	// Non-7 cards are rejected if HasSeven == false
	if !state.HasSeven {
		return false
	}

	// Ranks 2..6 are legal if Rank == MinPlayed-1
	if card.Rank >= 2 && card.Rank <= KeyRankSix {
		return card.Rank == state.MinPlayed-1
	}

	// Ranks 8..13 are legal if Rank == MaxPlayed+1
	if card.Rank >= KeyRankEight && card.Rank <= 13 {
		return card.Rank == state.MaxPlayed+1
	}

	// Ace Card State Machine (Rank 1): rejected if HasAce == true
	if card.Rank == AceRank {
		if state.HasAce {
			return false
		}
		canLow := state.MinPlayed == 2
		canHigh := state.MaxPlayed == 13

		switch aceMode {
		case AceModeLow:
			return canLow
		case AceModeHigh:
			return canHigh
		case AceModeLockedNone:
			fallthrough
		default:
			return canLow || canHigh
		}
	}

	return false
}

// PlayCard places a card onto the board if valid, assuming AceModeLockedNone.
func (b *Board) PlayCard(card Card) error {
	_, err := b.PlayCardWithAceMode(card, AceModeLockedNone)
	return err
}

// PlayCardWithAceMode places a card onto the board under the specified AceMode,
// updates MinPlayed/MaxPlayed boundaries, sets HasAce=true when an Ace is placed,
// and locks the global AceMode if an Ace was placed while AceMode was LOCKED_NONE.
func (b *Board) PlayCardWithAceMode(card Card, aceMode AceMode) (AceMode, error) {
	if !b.CanPlayWithAceMode(card, aceMode) {
		return aceMode, errors.New("invalid move: card cannot be placed on the board")
	}

	state := b.Suits[card.Suit]

	if card.Rank == AnchorRank {
		state.HasSeven = true
		state.MinPlayed = AnchorRank
		state.MaxPlayed = AnchorRank
		return aceMode, nil
	}

	if card.Rank >= 2 && card.Rank <= KeyRankSix {
		state.MinPlayed = card.Rank
		return aceMode, nil
	}

	if card.Rank >= KeyRankEight && card.Rank <= 13 {
		state.MaxPlayed = card.Rank
		return aceMode, nil
	}

	if card.Rank == AceRank {
		state.HasAce = true
		if aceMode == AceModeLow {
			state.MinPlayed = 1
			return AceModeLow, nil
		}
		if aceMode == AceModeHigh {
			state.MaxPlayed = 14
			return AceModeHigh, nil
		}

		// When AceMode is LOCKED_NONE
		if state.MinPlayed == 2 {
			state.MinPlayed = 1
			return AceModeLow, nil
		}
		if state.MaxPlayed == 13 {
			state.MaxPlayed = 14
			return AceModeHigh, nil
		}
	}

	return aceMode, errors.New("unexpected board state error")
}

// GetValidMoves returns all valid playable cards from a given hand assuming AceModeLockedNone.
func (b *Board) GetValidMoves(hand []Card) []Card {
	return b.GetValidMovesWithAceMode(hand, AceModeLockedNone)
}

// GetValidMovesWithAceMode returns all valid playable cards from a given hand under the specified AceMode.
func (b *Board) GetValidMovesWithAceMode(hand []Card, aceMode AceMode) []Card {
	valid := make([]Card, 0)
	for _, c := range hand {
		if b.CanPlayWithAceMode(c, aceMode) {
			valid = append(valid, c)
		}
	}
	return valid
}

// ValidateFoldCard validates whether a player can fold the given card.
// Enforces:
// 1. 7-Card Anti-Sabotage rule: strictly prohibiting folding any card with Rank == 7 under any circumstance.
// 2. Hand verification: verifies that the player holds the target card in their hand.
// 3. Anti-Bluff (Anti-Bohong) rule: rejecting fold actions when valid moves exist in hand.
func (b *Board) ValidateFoldCard(hand []Card, cardToFold Card, aceMode AceMode) error {
	// 7-Card Anti-Sabotage rule: strictly prohibited under any circumstance
	if cardToFold.Rank == AnchorRank {
		return errors.New("cannot fold rank 7 card: 7-card anti-sabotage rule")
	}

	// Verify that the player holds the target card in their hand
	holdsCard := false
	for _, c := range hand {
		if c.Suit == cardToFold.Suit && c.Rank == cardToFold.Rank {
			holdsCard = true
			break
		}
	}
	if !holdsCard {
		return errors.New("cannot fold card: player does not hold this card in hand")
	}

	// Anti-Bluff (Anti-Bohong) rule: rejecting fold actions when valid moves exist
	validMoves := b.GetValidMovesWithAceMode(hand, aceMode)
	if len(validMoves) > 0 {
		return errors.New("cannot fold card: valid moves exist in hand (anti-bohong rule)")
	}

	return nil
}
