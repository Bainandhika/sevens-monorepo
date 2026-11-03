package engine

import (
	"errors"
	"math/rand"
	"time"
)

type BotDifficulty string

const (
	DifficultyEasy   BotDifficulty = "easy"
	DifficultyMedium BotDifficulty = "medium"
	DifficultyHard   BotDifficulty = "hard"
)

// BotDecision represents the AI bot's chosen move.
type BotDecision struct {
	Card   *Card `json:"card"`   // Nil if bot must pass
	IsPass bool  `json:"isPass"` // True if no valid moves available
}

// BotEngine evaluates the best card to play given the hand and current board.
type BotEngine struct {
	rng *rand.Rand
}

func NewBotEngine() *BotEngine {
	return &BotEngine{
		rng: rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// SelectMove chooses a card based on difficulty level.
func (b *BotEngine) SelectMove(hand []Card, board *Board, difficulty BotDifficulty) (BotDecision, error) {
	validMoves := board.GetValidMoves(hand)

	if len(validMoves) == 0 {
		return BotDecision{Card: nil, IsPass: true}, nil
	}

	switch difficulty {
	case DifficultyEasy:
		return b.selectEasyMove(validMoves), nil
	case DifficultyMedium:
		return b.selectMediumMove(validMoves, hand), nil
	case DifficultyHard:
		return b.selectHardMove(validMoves, hand, board), nil
	default:
		return b.selectEasyMove(validMoves), nil
	}
}

// selectEasyMove picks a random valid card.
func (b *BotEngine) selectEasyMove(validMoves []Card) BotDecision {
	idx := b.rng.Intn(len(validMoves))
	chosen := validMoves[idx]
	return BotDecision{Card: &chosen, IsPass: false}
}

// selectMediumMove prefers playing cards where the bot holds adjacent continuation cards.
func (b *BotEngine) selectMediumMove(validMoves []Card, hand []Card) BotDecision {
	handMap := make(map[string]bool)
	for _, c := range hand {
		handMap[c.String()] = true
	}

	bestScore := -100
	bestCard := validMoves[0]

	for _, move := range validMoves {
		score := 0
		// Check if we hold consecutive cards that this move unlocks
		if move.Rank < 7 {
			down := Card{Suit: move.Suit, Rank: move.Rank - 1}
			if handMap[down.String()] {
				score += 2
			}
		} else if move.Rank > 7 {
			up := Card{Suit: move.Suit, Rank: move.Rank + 1}
			if handMap[up.String()] {
				score += 2
			}
		}

		if score > bestScore {
			bestScore = score
			bestCard = move
		}
	}

	return BotDecision{Card: &bestCard, IsPass: false}
}

// selectHardMove executes strategic play:
// - Retains 7s if opponents are likely blocked
// - Plays cards with safe self-continuations
// - Prioritizes dumping high-rank penalty risks
func (b *BotEngine) selectHardMove(validMoves []Card, hand []Card, board *Board) BotDecision {
	bestScore := -9999
	bestCard := validMoves[0]

	for _, move := range validMoves {
		score := 0

		// Avoid starting a new suit (playing 7) if we don't hold follow-ups
		if move.Rank == 7 {
			hasFollowUp := false
			for _, c := range hand {
				if c.Suit == move.Suit && (c.Rank == 6 || c.Rank == 8) {
					hasFollowUp = true
					break
				}
			}
			if !hasFollowUp {
				score -= 10 // Hold 7 to force opponents to pass
			}
		}

		// Check self continuity
		for _, c := range hand {
			if c.Suit == move.Suit {
				if (move.Rank < 7 && c.Rank < move.Rank) || (move.Rank > 7 && c.Rank > move.Rank) {
					score += 5
				}
			}
		}

		// Prefer playing towards the Ace or King to finalize the suit lane
		if move.Rank == 1 || move.Rank == 13 {
			score += 8
		}

		if score > bestScore {
			bestScore = score
			bestCard = move
		}
	}

	return BotDecision{Card: &bestCard, IsPass: false}
}

// ValidateBotMove verifies that the move returned by bot is legitimate.
func ValidateBotMove(decision BotDecision, validMoves []Card) error {
	if decision.IsPass {
		if len(validMoves) > 0 {
			return errors.New("cannot pass when valid moves exist")
		}
		return nil
	}
	if decision.Card == nil {
		return errors.New("invalid decision: no card specified")
	}
	for _, m := range validMoves {
		if m.Suit == decision.Card.Suit && m.Rank == decision.Card.Rank {
			return nil
		}
	}
	return errors.New("chosen bot card is not in valid moves")
}
