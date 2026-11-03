package engine

import (
	"testing"
)

func TestSevensRules(t *testing.T) {
	board := NewBoard()

	// 1. Cannot play 6 or 8 before 7
	cardSixSpades := Card{Suit: Spades, Rank: 6}
	if board.CanPlay(cardSixSpades) {
		t.Errorf("Expected CanPlay(6 of Spades) to be false before 7 is played")
	}

	// 2. Can play 7 of Spades
	cardSevenSpades := Card{Suit: Spades, Rank: 7}
	if !board.CanPlay(cardSevenSpades) {
		t.Errorf("Expected CanPlay(7 of Spades) to be true")
	}
	if err := board.PlayCard(cardSevenSpades); err != nil {
		t.Fatalf("Failed to play 7 of Spades: %v", err)
	}

	// 3. Now 6 and 8 of Spades are valid
	if !board.CanPlay(cardSixSpades) {
		t.Errorf("Expected CanPlay(6 of Spades) to be true after 7")
	}
	cardEightSpades := Card{Suit: Spades, Rank: 8}
	if !board.CanPlay(cardEightSpades) {
		t.Errorf("Expected CanPlay(8 of Spades) to be true after 7")
	}

	// 4. Playing down to Ace sets HasAce
	_ = board.PlayCard(cardSixSpades)
	_ = board.PlayCard(Card{Suit: Spades, Rank: 5})
	_ = board.PlayCard(Card{Suit: Spades, Rank: 4})
	_ = board.PlayCard(Card{Suit: Spades, Rank: 3})
	_ = board.PlayCard(Card{Suit: Spades, Rank: 2})
	cardAce := Card{Suit: Spades, Rank: 1}
	if err := board.PlayCard(cardAce); err != nil {
		t.Fatalf("Failed to play Ace: %v", err)
	}

	if !board.Suits[Spades].HasAce {
		t.Errorf("Expected suit state HasAce to be true after playing Ace")
	}
}

func TestScoreCalculation(t *testing.T) {
	hand := []Card{
		{Suit: Hearts, Rank: 1},  // Ace -> 30 penalty points
		{Suit: Clubs, Rank: 7},   // 7 -> 30 penalty points
		{Suit: Spades, Rank: 10}, // 10 points
		{Suit: Diamonds, Rank: 12}, // Queen -> 10 points
	}

	score := CalculateHandScore("player1", hand, 0)

	if score.AcePenalties != 30 {
		t.Errorf("Expected 30 Ace penalty, got %d", score.AcePenalties)
	}
	if score.SevenPenalties != 30 {
		t.Errorf("Expected 30 Seven penalty, got %d", score.SevenPenalties)
	}
	if score.CardPoints != 20 {
		t.Errorf("Expected 20 Card points, got %d", score.CardPoints)
	}
	// Total Minus: 20 + 30 + 30 = 80
	if score.TotalMinus != 80 {
		t.Errorf("Expected total minus 80, got %d", score.TotalMinus)
	}
}
