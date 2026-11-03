package engine

const (
	// AcePenaltyPoints is the 30-point penalty for holding an Ace when game ends.
	AcePenaltyPoints = 30

	// SevenPenaltyPoints is the penalty for holding a 7 when game ends.
	SevenPenaltyPoints = 30

	// IllegalPassPenalty is applied if a player attempts an illegal pass.
	IllegalPassPenalty = 30
)

// PlayerScoreDetail contains the breakdown of penalty points for a player's remaining hand.
type PlayerScoreDetail struct {
	PlayerID       string `json:"playerId"`
	RemainingCards int    `json:"remainingCards"`
	CardPoints     int    `json:"cardPoints"`     // Face value points (2-10: face, J/Q/K: 10, Ace: 1 or 30)
	AcePenalties   int    `json:"acePenalties"`   // 30 points per remaining Ace
	SevenPenalties int    `json:"sevenPenalties"` // 30 points per remaining 7
	OtherPenalties int    `json:"otherPenalties"` // Any additional penalties (e.g. illegal pass)
	TotalMinus     int    `json:"totalMinus"`     // Total negative score (cardPoints + penalties)
}

// CalculateHandScore computes the total minus score and breakdown for remaining cards.
func CalculateHandScore(playerID string, hand []Card, extraPenalties int) PlayerScoreDetail {
	detail := PlayerScoreDetail{
		PlayerID:       playerID,
		RemainingCards: len(hand),
		OtherPenalties: extraPenalties,
	}

	for _, card := range hand {
		if card.Rank == 1 {
			// Ace penalty is 30 points
			detail.AcePenalties += AcePenaltyPoints
		} else if card.Rank == 7 {
			// 7 penalty is 30 points
			detail.SevenPenalties += SevenPenaltyPoints
		} else if card.Rank > 10 {
			// Picture cards count as 10
			detail.CardPoints += 10
		} else {
			// Number cards count as their rank value
			detail.CardPoints += card.Rank
		}
	}

	detail.TotalMinus = detail.CardPoints + detail.AcePenalties + detail.SevenPenalties + detail.OtherPenalties
	return detail
}

// CalculateGameScores calculates total minus scores for all players in a match.
func CalculateGameScores(playerHands map[string][]Card, penalties map[string]int) map[string]PlayerScoreDetail {
	results := make(map[string]PlayerScoreDetail)
	for pID, hand := range playerHands {
		extra := 0
		if penalties != nil {
			extra = penalties[pID]
		}
		results[pID] = CalculateHandScore(pID, hand, extra)
	}
	return results
}
