package engine

import (
	"math/rand"
	"sort"
	"time"
)

// NewStandardDeck generates an exact 52-card standard deck (4 suits x Ranks 1..13 without Jokers).
func NewStandardDeck() []Card {
	deck := make([]Card, 0, 52)
	for _, suit := range AllSuits {
		for rank := 1; rank <= 13; rank++ {
			deck = append(deck, Card{Suit: suit, Rank: rank})
		}
	}
	return deck
}

// suitPriority returns the deterministic sort priority for a Suit:
// spades=0, hearts=1, clubs=2, diamonds=3.
func suitPriority(s Suit) int {
	switch s {
	case Spades:
		return 0
	case Hearts:
		return 1
	case Clubs:
		return 2
	case Diamonds:
		return 3
	default:
		return 4
	}
}

// ShuffleDeck shuffles a card deck using the Fisher-Yates algorithm.
func ShuffleDeck(deck []Card, rng *rand.Rand) []Card {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	shuffled := make([]Card, len(deck))
	copy(shuffled, deck)
	for i := len(shuffled) - 1; i > 0; i-- {
		j := rng.Intn(i + 1)
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	}
	return shuffled
}

// SortHand deterministically sorts a card slice by suit priority
// (spades=0, hearts=1, clubs=2, diamonds=3) and then by ascending Rank (1..13).
func SortHand(hand []Card) []Card {
	sort.Slice(hand, func(i, j int) bool {
		pi := suitPriority(hand[i].Suit)
		pj := suitPriority(hand[j].Suit)
		if pi != pj {
			return pi < pj
		}
		return hand[i].Rank < hand[j].Rank
	})
	return hand
}

// HasExcessSevens checks if any player hand holds 3 or more Rank 7 cards.
func HasExcessSevens(hands [][]Card) bool {
	for _, hand := range hands {
		sevensCount := 0
		for _, card := range hand {
			if card.Rank == AnchorRank {
				sevensCount++
				if sevensCount >= 3 {
					return true
				}
			}
		}
	}
	return false
}

// DealCardsWithAutoReshuffle deals 52 cards evenly across 4 players (13 cards each).
// If any player receives >= 3 cards of Rank 7, it automatically reshuffles and redeals
// (up to 200 attempts) before returning the sorted hands via SortHand.
func DealCardsWithAutoReshuffle(rng *rand.Rand) [][]Card {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}

	standardDeck := NewStandardDeck()
	var hands [][]Card

	for attempt := 0; attempt < 200; attempt++ {
		deck := ShuffleDeck(standardDeck, rng)
		hands = make([][]Card, 4)
		for i := 0; i < 4; i++ {
			hands[i] = make([]Card, 0, 13)
		}
		for i, card := range deck {
			hands[i%4] = append(hands[i%4], card)
		}

		if !HasExcessSevens(hands) {
			break
		}
	}

	for i := range hands {
		hands[i] = SortHand(hands[i])
	}

	return hands
}

// ExtractOpenerSeven randomly selects an opener suit from AllSuits (spades, hearts, clubs, diamonds),
// locates the player holding Card{Suit: openerSuit, Rank: 7}, removes that card from the player's
// hand slice, and returns openerSuit along with the opener player's seat index (0..3).
func ExtractOpenerSeven(hands [][]Card, rng *rand.Rand) (Suit, int) {
	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}

	openerSuit := AllSuits[rng.Intn(len(AllSuits))]

	for pIdx, hand := range hands {
		for cIdx, card := range hand {
			if card.Suit == openerSuit && card.Rank == AnchorRank {
				hands[pIdx] = append(hands[pIdx][:cIdx], hands[pIdx][cIdx+1:]...)
				return openerSuit, pIdx
			}
		}
	}

	// Fallback if the randomly selected opener suit was not present in hands
	for pIdx, hand := range hands {
		for cIdx, card := range hand {
			if card.Rank == AnchorRank {
				suit := card.Suit
				hands[pIdx] = append(hands[pIdx][:cIdx], hands[pIdx][cIdx+1:]...)
				return suit, pIdx
			}
		}
	}

	return Spades, 0
}

