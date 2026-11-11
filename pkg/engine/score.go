package engine

import (
	"sort"
)

const (
	// KeyCardPenaltyPoints is the flat 30-point penalty for folding a 6 or 8.
	KeyCardPenaltyPoints = 30

	// AceNonePoints is 0 points when Ace is folded and AceMode is LOCKED_NONE.
	AceNonePoints = 0

	// AceLowPoints is 1 point when Ace is folded and AceMode is LOW.
	AceLowPoints = 1

	// AceHighPoints is 15 points when Ace is folded and AceMode is HIGH.
	AceHighPoints = 15

	// AcePenaltyPoints is the 30-point penalty for holding an Ace when game ends (legacy).
	AcePenaltyPoints = 30

	// SevenPenaltyPoints is the penalty for holding a 7 when game ends (legacy).
	SevenPenaltyPoints = 30

	// IllegalPassPenalty is applied if a player attempts an illegal pass.
	IllegalPassPenalty = 30

	// ConsecutiveLossesForRT is the number of 4th-place finishes in a row to earn RT status.
	ConsecutiveLossesForRT = 3

	// ConsecutiveLossesForRW is the number of 4th-place finishes in a row to earn RW status.
	ConsecutiveLossesForRW = 6
)

// CommunityStatus represents the RT/RW badge status of a player or room.
type CommunityStatus string

const (
	StatusNone CommunityStatus = "NONE"
	StatusRT   CommunityStatus = "RT"
	StatusRW   CommunityStatus = "RW"
)

// FoldedCardScoreDetail contains the breakdown of penalty points for a single folded card.
type FoldedCardScoreDetail struct {
	Card             Card `json:"card"`
	Points           int  `json:"points"`
	IsKeyCardPenalty bool `json:"isKeyCardPenalty"`
	IsAceLocked      bool `json:"isAceLocked"`
}

// PlayerScoreInput holds the input parameters for calculating final round leaderboard rankings.
type PlayerScoreInput struct {
	PlayerID          string          `json:"playerId"`
	PlayerName        string          `json:"playerName"`
	SeatIndex         int             `json:"seatIndex"`
	FoldedCards       []Card          `json:"foldedCards"`
	LossesCount       int             `json:"lossesCount"`
	ConsecutiveLosses int             `json:"consecutiveLosses"`
	StatusRTRW        CommunityStatus `json:"statusRtRw"`
}

// PlayerScoreDetail contains the breakdown of penalty points and leaderboard standings for a player.
type PlayerScoreDetail struct {
	PlayerID          string                  `json:"playerId"`
	PlayerName        string                  `json:"playerName"`
	RankPosition      int                     `json:"rankPosition"`
	FoldedCards       []FoldedCardScoreDetail `json:"foldedCards"`
	TotalPenalty      int                     `json:"totalPenalty"`
	IsWinner          bool                    `json:"isWinner"`
	IsJuruKunci       bool                    `json:"isJuruKunci"`
	LossesCount       int                     `json:"lossesCount"`
	ConsecutiveLosses int                     `json:"consecutiveLosses"`
	StatusRTRW        CommunityStatus         `json:"statusRtRw"`
	RemainingCards    int                     `json:"remainingCards,omitempty"`
	CardPoints        int                     `json:"cardPoints,omitempty"`
	AcePenalties      int                     `json:"acePenalties,omitempty"`
	SevenPenalties    int                     `json:"sevenPenalties,omitempty"`
	OtherPenalties    int                     `json:"otherPenalties,omitempty"`
	TotalMinus        int                     `json:"totalMinus,omitempty"`
}

// IsKeyCard checks if a card is rank 6 or rank 8.
func IsKeyCard(card Card) bool {
	return card.Rank == KeyRankSix || card.Rank == KeyRankEight
}

// CalculateCardPenalty calculates penalty points for a single folded card based on AceMode.
// Key cards (6 and 8) incur a flat 30-point penalty.
// Ace card (1) value depends on AceMode: LOCKED_NONE -> 0, LOW -> 1, HIGH -> 15.
// Other number cards (2..10) and face cards (J=11, Q=12, K=13) incur their nominal face value.
func CalculateCardPenalty(card Card, aceMode AceMode) FoldedCardScoreDetail {
	if IsKeyCard(card) {
		return FoldedCardScoreDetail{
			Card:             card,
			Points:           KeyCardPenaltyPoints,
			IsKeyCardPenalty: true,
			IsAceLocked:      false,
		}
	}

	if card.Rank == AceRank {
		switch aceMode {
		case AceModeLow:
			return FoldedCardScoreDetail{
				Card:             card,
				Points:           AceLowPoints,
				IsKeyCardPenalty: false,
				IsAceLocked:      true,
			}
		case AceModeHigh:
			return FoldedCardScoreDetail{
				Card:             card,
				Points:           AceHighPoints,
				IsKeyCardPenalty: false,
				IsAceLocked:      true,
			}
		case AceModeLockedNone:
			fallthrough
		default:
			return FoldedCardScoreDetail{
				Card:             card,
				Points:           AceNonePoints,
				IsKeyCardPenalty: false,
				IsAceLocked:      false,
			}
		}
	}

	return FoldedCardScoreDetail{
		Card:             card,
		Points:           card.Rank,
		IsKeyCardPenalty: false,
		IsAceLocked:      false,
	}
}

// CalculatePlayerFoldedScore computes the penalty breakdown and total penalty points for a player's folded cards.
func CalculatePlayerFoldedScore(playerID string, playerName string, foldedCards []Card, aceMode AceMode) PlayerScoreDetail {
	details := make([]FoldedCardScoreDetail, 0, len(foldedCards))
	totalPenalty := 0

	for _, card := range foldedCards {
		penaltyDetail := CalculateCardPenalty(card, aceMode)
		details = append(details, penaltyDetail)
		totalPenalty += penaltyDetail.Points
	}

	return PlayerScoreDetail{
		PlayerID:     playerID,
		PlayerName:   playerName,
		FoldedCards:  details,
		TotalPenalty: totalPenalty,
	}
}

// CalculateFinalLeaderboard computes the final leaderboard rankings for all players based on their folded cards.
// Players are sorted in ascending order by TotalPenalty, breaking ties deterministically by SeatIndex.
// The 1st-place player is marked RankPosition=1 and IsWinner=true.
// The 4th-place (highest penalty) player is marked RankPosition=4 and IsJuruKunci=true.
func CalculateFinalLeaderboard(inputs []PlayerScoreInput, aceMode AceMode) map[string]PlayerScoreDetail {
	type rankedPlayer struct {
		input  PlayerScoreInput
		detail PlayerScoreDetail
	}

	ranked := make([]rankedPlayer, len(inputs))
	for i, in := range inputs {
		ranked[i] = rankedPlayer{
			input:  in,
			detail: CalculatePlayerFoldedScore(in.PlayerID, in.PlayerName, in.FoldedCards, aceMode),
		}
	}

	sort.Slice(ranked, func(i, j int) bool {
		if ranked[i].detail.TotalPenalty != ranked[j].detail.TotalPenalty {
			return ranked[i].detail.TotalPenalty < ranked[j].detail.TotalPenalty
		}
		return ranked[i].input.SeatIndex < ranked[j].input.SeatIndex
	})

	results := make(map[string]PlayerScoreDetail, len(ranked))
	var loserID string
	var hasLoser bool

	for i := range ranked {
		ranked[i].detail.RankPosition = i + 1
		if i == 0 {
			ranked[i].detail.IsWinner = true
		}
		if i == len(ranked)-1 && len(ranked) > 1 {
			ranked[i].detail.IsJuruKunci = true
		}

		// Pass 1: Normalize status and update losses count and streak
		status := ranked[i].input.StatusRTRW
		if status == "" {
			status = StatusNone
		}
		if ranked[i].detail.IsJuruKunci {
			ranked[i].detail.LossesCount = ranked[i].input.LossesCount + 1
			ranked[i].detail.ConsecutiveLosses = ranked[i].input.ConsecutiveLosses + 1
			loserID = ranked[i].detail.PlayerID
			hasLoser = true
		} else {
			ranked[i].detail.LossesCount = ranked[i].input.LossesCount
			ranked[i].detail.ConsecutiveLosses = 0
		}
		ranked[i].detail.StatusRTRW = status

		results[ranked[i].detail.PlayerID] = ranked[i].detail
	}

	// Pass 2: Evaluate RT/RW promotion or dethroning for the Juru Kunci loser
	if hasLoser {
		loser := results[loserID]
		if loser.ConsecutiveLosses >= ConsecutiveLossesForRW {
			for id, d := range results {
				if id != loserID {
					d.StatusRTRW = StatusNone
					results[id] = d
				}
			}
			loser.StatusRTRW = StatusRW
			results[loserID] = loser
		} else if loser.ConsecutiveLosses >= ConsecutiveLossesForRT {
			for id, d := range results {
				if id != loserID {
					d.StatusRTRW = StatusNone
					results[id] = d
				}
			}
			loser.StatusRTRW = StatusRT
			results[loserID] = loser
		}
	}

	return results
}

// CalculateHandScore computes the total minus score and breakdown for remaining cards (legacy compatibility).
func CalculateHandScore(playerID string, hand []Card, extraPenalties int) PlayerScoreDetail {
	detail := PlayerScoreDetail{
		PlayerID:       playerID,
		RemainingCards: len(hand),
		OtherPenalties: extraPenalties,
		FoldedCards:    make([]FoldedCardScoreDetail, 0),
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

// CalculateGameScores calculates total minus scores for all players in a match (legacy compatibility).
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
