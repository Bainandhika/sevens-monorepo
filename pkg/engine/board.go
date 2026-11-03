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
	Diamonds Suit = "diamonds"
	Clubs    Suit = "clubs"
)

var AllSuits = []Suit{Spades, Hearts, Diamonds, Clubs}

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
	MinPlayed int  `json:"minPlayed"` // Lowest rank played (starts at 7, expands down to 1)
	MaxPlayed int  `json:"maxPlayed"` // Highest rank played (starts at 7, expands up to 13)
	HasSeven  bool `json:"hasSeven"`  // Whether 7 has been placed
	HasAce    bool `json:"hasAce"`    // State As (Ace placed / locked)
}

// Board represents the game table state.
type Board struct {
	Suits map[Suit]*SuitState `json:"suits"`
}

// NewBoard initializes an empty Sevens board.
func NewBoard() *Board {
	suits := make(map[Suit]*SuitState)
	for _, s := range AllSuits {
		suits[s] = &SuitState{
			MinPlayed: 7,
			MaxPlayed: 7,
			HasSeven:  false,
			HasAce:    false,
		}
	}
	return &Board{Suits: suits}
}

// CanPlay validates if a card can be placed on the board according to Sevens rules.
func (b *Board) CanPlay(card Card) bool {
	state, exists := b.Suits[card.Suit]
	if !exists {
		return false
	}

	// Rule: 7 can always be played to start a suit lane
	if card.Rank == 7 {
		return !state.HasSeven
	}

	// Cannot play other cards until 7 is placed
	if !state.HasSeven {
		return false
	}

	// Valid if card extends current lower boundary (e.g., 6 after 7, down to Ace=1)
	if card.Rank == state.MinPlayed-1 && card.Rank >= 1 {
		return true
	}

	// Valid if card extends current upper boundary (e.g., 8 after 7, up to King=13)
	if card.Rank == state.MaxPlayed+1 && card.Rank <= 13 {
		return true
	}

	return false
}

// PlayCard places a card onto the board if valid.
func (b *Board) PlayCard(card Card) error {
	if !b.CanPlay(card) {
		return errors.New("invalid move: card cannot be placed on the board")
	}

	state := b.Suits[card.Suit]
	if card.Rank == 7 {
		state.HasSeven = true
		state.MinPlayed = 7
		state.MaxPlayed = 7
		return nil
	}

	if card.Rank == state.MinPlayed-1 {
		state.MinPlayed = card.Rank
		if card.Rank == 1 {
			state.HasAce = true
		}
		return nil
	}

	if card.Rank == state.MaxPlayed+1 {
		state.MaxPlayed = card.Rank
		return nil
	}

	return errors.New("unexpected board state error")
}

// GetValidMoves returns all valid playable cards from a given hand.
func (b *Board) GetValidMoves(hand []Card) []Card {
	valid := make([]Card, 0)
	for _, c := range hand {
		if b.CanPlay(c) {
			valid = append(valid, c)
		}
	}
	return valid
}
