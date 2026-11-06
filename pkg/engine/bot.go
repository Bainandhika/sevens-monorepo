package engine

import (
	"errors"
	"math/rand"
	"sort"
	"time"
)

// BotDifficulty defines the AI bot strategy level.
type BotDifficulty string

const (
	DifficultyEasy   BotDifficulty = "easy"
	DifficultyMedium BotDifficulty = "medium"
	DifficultyHard   BotDifficulty = "hard"
)

// BotDecision represents the AI bot's chosen move or fold action.
type BotDecision struct {
	Card     *Card `json:"card"`               // Card to play, nil if passing/folding
	IsPass   bool  `json:"isPass"`             // True if no valid moves available
	Action   string `json:"action,omitempty"`   // "play" or "fold"
	FoldCard *Card `json:"foldCard,omitempty"` // Selected card to fold when isPass is true
}

// BotEngine evaluates the best card to play or fold given the hand, board, and AceMode.
type BotEngine struct {
	rng *rand.Rand
}

// NewBotEngine initializes a BotEngine with a time-seeded random number generator.
func NewBotEngine() *BotEngine {
	return &BotEngine{
		rng: rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (b *BotEngine) getRng() *rand.Rand {
	if b.rng == nil {
		b.rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}
	return b.rng
}

// SelectMove chooses a move under AceModeLockedNone for backward compatibility.
func (b *BotEngine) SelectMove(hand []Card, board *Board, difficulty BotDifficulty) (BotDecision, error) {
	return b.SelectMoveWithAceMode(hand, board, difficulty, AceModeLockedNone)
}

// SelectMoveWithAceMode chooses a card to play or fold according to difficulty and AceMode rules.
func (b *BotEngine) SelectMoveWithAceMode(hand []Card, board *Board, difficulty BotDifficulty, aceMode AceMode) (BotDecision, error) {
	validMoves := board.GetValidMovesWithAceMode(hand, aceMode)

	if len(validMoves) == 0 {
		foldCard, err := b.SelectFoldCard(hand, difficulty, aceMode)
		if err != nil {
			return BotDecision{
				Card:     nil,
				IsPass:   true,
				Action:   "fold",
				FoldCard: nil,
			}, err
		}
		return BotDecision{
			Card:     nil,
			IsPass:   true,
			Action:   "fold",
			FoldCard: &foldCard,
		}, nil
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

// selectEasyMove picks 1 card uniformly at random from validMoves.
func (b *BotEngine) selectEasyMove(validMoves []Card) BotDecision {
	idx := b.getRng().Intn(len(validMoves))
	chosen := validMoves[idx]
	return BotDecision{
		Card:   &chosen,
		IsPass: false,
		Action: "play",
	}
}

// selectMediumMove prioritizes moves where the bot holds adjacent continuation cards (+3),
// sheds high-value cards Rank >= 10 (+2), and avoids holding key cards 6/8.
func (b *BotEngine) selectMediumMove(validMoves []Card, hand []Card) BotDecision {
	handMap := make(map[string]bool, len(hand))
	for _, c := range hand {
		handMap[c.String()] = true
	}

	bestScore := -9999
	bestCard := validMoves[0]

	for _, move := range validMoves {
		score := 0

		// Prioritizes moves where the bot holds adjacent continuation cards in hand (+3 score)
		if move.Rank < AnchorRank {
			down := Card{Suit: move.Suit, Rank: move.Rank - 1}
			if handMap[down.String()] {
				score += 3
			}
		} else if move.Rank > AnchorRank {
			up := Card{Suit: move.Suit, Rank: move.Rank + 1}
			if handMap[up.String()] {
				score += 3
			}
		} else { // move.Rank == AnchorRank (7)
			down := Card{Suit: move.Suit, Rank: KeyRankSix}
			up := Card{Suit: move.Suit, Rank: KeyRankEight}
			if handMap[down.String()] {
				score += 3
			}
			if handMap[up.String()] {
				score += 3
			}
		}

		// Prioritizes shedding high-value cards (Rank >= 10 gets +2 score)
		if move.Rank >= 10 {
			score += 2
		}

		// Avoids holding key cards 6/8 by prioritizing playing them
		if IsKeyCard(move) {
			score += 2
		}

		if score > bestScore {
			bestScore = score
			bestCard = move
		}
	}

	return BotDecision{
		Card:   &bestCard,
		IsPass: false,
		Action: "play",
	}
}

// selectHardMove executes tactical blocking and hand-aligned AceMode steering:
// - withholds opening a new 7 (-10 score) if the bot holds neither 6 nor 8 of that suit;
// - withholds playing 6 or 8 (-4 score) if alternative safe moves exist and the bot lacks follow-up cards in that lane;
// - evaluates low-card (Ranks 2..5) vs high-card (Ranks 10..13) hand composition to mathematically steer
//   AceMode locking ('LOW' vs 'HIGH') when playing an Ace (+12 score if aligned with hand composition);
// - awards +5 score for each self-continuation card unlocked in hand.
func (b *BotEngine) selectHardMove(validMoves []Card, hand []Card, board *Board) BotDecision {
	bestScore := -99999
	bestCard := validMoves[0]

	// Evaluate hand composition: low cards (2..5) vs high cards (10..13)
	lowCount := 0
	highCount := 0
	for _, c := range hand {
		if c.Rank >= 2 && c.Rank <= 5 {
			lowCount++
		} else if c.Rank >= 10 && c.Rank <= 13 {
			highCount++
		}
	}

	for _, move := range validMoves {
		score := 0

		// 1. Withholds opening a new 7 (-10 score) if the bot holds neither 6 nor 8 of that suit
		if move.Rank == AnchorRank {
			hasFollowUp := false
			for _, c := range hand {
				if c.Suit == move.Suit && (c.Rank == KeyRankSix || c.Rank == KeyRankEight) {
					hasFollowUp = true
					break
				}
			}
			if !hasFollowUp {
				score -= 10
			}
		}

		// 2. Withholds playing 6 or 8 (-4 score) if alternative safe moves exist and the bot lacks follow-up cards in that lane
		if IsKeyCard(move) && len(validMoves) > 1 {
			hasLaneFollowUp := false
			if move.Rank == KeyRankSix {
				for _, c := range hand {
					if c.Suit == move.Suit && c.Rank < KeyRankSix {
						hasLaneFollowUp = true
						break
					}
				}
			} else if move.Rank == KeyRankEight {
				for _, c := range hand {
					if c.Suit == move.Suit && (c.Rank > KeyRankEight || c.Rank == AceRank) {
						hasLaneFollowUp = true
						break
					}
				}
			}
			if !hasLaneFollowUp {
				score -= 4
			}
		}

		// 3. Evaluates low-card vs high-card composition to steer AceMode locking (+12 score)
		if move.Rank == AceRank && board != nil && board.Suits != nil {
			state := board.Suits[move.Suit]
			if state != nil {
				if state.MinPlayed == 2 && lowCount >= highCount {
					score += 12
				}
				if state.MaxPlayed == 13 && highCount >= lowCount {
					score += 12
				}
			}
		}

		// 4. Awards +5 score for each self-continuation card unlocked in hand
		for _, c := range hand {
			if c.Suit == move.Suit {
				if move.Rank == AnchorRank {
					if c.Rank != AnchorRank {
						score += 5
					}
				} else if move.Rank < AnchorRank {
					if c.Rank < move.Rank {
						score += 5
					}
				} else if move.Rank > AnchorRank {
					if c.Rank > move.Rank || (c.Rank == AceRank && move.Rank == 13) {
						score += 5
					}
				}
			}
		}

		if score > bestScore {
			bestScore = score
			bestCard = move
		}
	}

	return BotDecision{
		Card:   &bestCard,
		IsPass: false,
		Action: "play",
	}
}

// continuationLoss counts how many continuation cards in hand of the same suit are blocked if card is folded.
func continuationLoss(card Card, hand []Card) int {
	loss := 0
	for _, c := range hand {
		if c.Suit == card.Suit {
			if card.Rank < AnchorRank && c.Rank < card.Rank {
				loss++
			} else if card.Rank > AnchorRank && (c.Rank > card.Rank || (card.Rank == 13 && c.Rank == AceRank)) {
				loss++
			}
		}
	}
	return loss
}

// SelectFoldCard selects 1 card to fold when no valid moves exist:
// (a) Strictly filters out all Rank == 7 cards (7-Card Anti-Sabotage rule);
// (b) Easy: picks a random non-7 card;
// (c) Medium: filters out key cards 6 and 8, then selects the card with lowest nominal rank;
// (d) Hard: evaluates actual penalty cost via CalculateCardPenalty(card, aceMode), strictly avoids folding
//
//	6 and 8 (30-point penalty) whenever other cards exist, and selects card with minimum penalty and continuation loss.
func (b *BotEngine) SelectFoldCard(hand []Card, difficulty BotDifficulty, aceMode AceMode) (Card, error) {
	if len(hand) == 0 {
		return Card{}, errors.New("cannot fold from empty hand")
	}

	// Strictly filter out all Rank == 7 cards (7-Card Anti-Sabotage rule)
	candidates := make([]Card, 0, len(hand))
	for _, c := range hand {
		if c.Rank != AnchorRank {
			candidates = append(candidates, c)
		}
	}

	if len(candidates) == 0 {
		return Card{}, errors.New("cannot fold rank 7 card: 7-card anti-sabotage rule")
	}

	switch difficulty {
	case DifficultyEasy:
		idx := b.getRng().Intn(len(candidates))
		return candidates[idx], nil

	case DifficultyMedium:
		// Filters out key cards 6 and 8
		pool := make([]Card, 0, len(candidates))
		for _, c := range candidates {
			if !IsKeyCard(c) {
				pool = append(pool, c)
			}
		}
		if len(pool) == 0 {
			pool = candidates
		}

		// Selects the card with the lowest nominal rank (e.g., 2 or 3)
		bestCard := pool[0]
		for _, c := range pool[1:] {
			if c.Rank < bestCard.Rank {
				bestCard = c
			}
		}
		return bestCard, nil

	case DifficultyHard:
		fallthrough
	default:
		// Strictly avoids folding 6 and 8 (30-point penalty) whenever other cards exist
		pool := make([]Card, 0, len(candidates))
		for _, c := range candidates {
			if !IsKeyCard(c) {
				pool = append(pool, c)
			}
		}
		if len(pool) == 0 {
			pool = candidates
		}

		// Evaluates actual penalty cost via CalculateCardPenalty and selects card with
		// minimum penalty and continuation loss.
		sort.Slice(pool, func(i, j int) bool {
			penI := CalculateCardPenalty(pool[i], aceMode).Points
			penJ := CalculateCardPenalty(pool[j], aceMode).Points
			if penI != penJ {
				return penI < penJ
			}
			lossI := continuationLoss(pool[i], hand)
			lossJ := continuationLoss(pool[j], hand)
			if lossI != lossJ {
				return lossI < lossJ
			}
			if pool[i].Rank != pool[j].Rank {
				return pool[i].Rank < pool[j].Rank
			}
			return pool[i].Suit < pool[j].Suit
		})

		return pool[0], nil
	}
}

// SelectSafestFoldCard returns the optimal card to fold using the Hard bot strategy.
func SelectSafestFoldCard(hand []Card, aceMode AceMode) Card {
	b := NewBotEngine()
	card, err := b.SelectFoldCard(hand, DifficultyHard, aceMode)
	if err != nil {
		if len(hand) > 0 {
			return hand[0]
		}
		return Card{}
	}
	return card
}

// ValidateBotMove verifies that the move returned by bot is legitimate.
func ValidateBotMove(decision BotDecision, validMoves []Card) error {
	if decision.IsPass {
		if len(validMoves) > 0 {
			return errors.New("cannot pass when valid moves exist")
		}
		if decision.FoldCard != nil && decision.FoldCard.Rank == AnchorRank {
			return errors.New("cannot fold rank 7 card: 7-card anti-sabotage rule")
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
