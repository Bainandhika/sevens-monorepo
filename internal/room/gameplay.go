package room

import (
	"errors"
	"math/rand"
	"time"

	"github.com/user/sevens/pkg/engine"
)

type tacticalBotProfile struct {
	ID       string
	Name     string
	Initials string
}

var tacticalBotRoster = []tacticalBotProfile{
	{ID: "bot-1", Name: "Agresif9", Initials: "A9"},
	{ID: "bot-2", Name: "Cermat8", Initials: "C8"},
	{ID: "bot-3", Name: "Taktik7", Initials: "T7"},
	{ID: "bot-4", Name: "Pilar06", Initials: "P6"},
}

func nextTacticalBotProfile(existing []*Player) tacticalBotProfile {
	usedIDs := make(map[string]bool, len(existing))
	usedNames := make(map[string]bool, len(existing))
	for _, p := range existing {
		usedIDs[p.ID] = true
		usedNames[p.Name] = true
	}
	for _, profile := range tacticalBotRoster {
		if !usedIDs[profile.ID] && !usedNames[profile.Name] {
			return profile
		}
	}
	return tacticalBotRoster[len(existing)%len(tacticalBotRoster)]
}

// NewTacticalHardBot constructs a Hard AI Bot player using the next available tactical profile.
func (r *Room) NewTacticalHardBot(seatIdx int) *Player {
	profile := nextTacticalBotProfile(r.Players)
	return &Player{
		ID:                profile.ID,
		Name:              profile.Name,
		Initials:          profile.Initials,
		AvatarColor:       GetAvatarColor(seatIdx),
		IsBot:             true,
		BotLevel:          engine.DifficultyHard,
		IsHost:            false,
		IsReady:           true,
		IsConnected:       true,
		Hand:              make([]engine.Card, 0),
		FoldedCards:       make([]engine.Card, 0),
		PenaltyPoints:     0,
		LossesCount:       0,
		ConsecutiveLosses: 0,
		StatusRTRW:        engine.StatusNone,
	}
}

// FillEmptySeatsWithHardBots fills all remaining empty seats up to 4 total players
// with tactical AI Bots strictly locked to engine.DifficultyHard.
func (r *Room) FillEmptySeatsWithHardBots() {
	for len(r.Players) < MaxPlayers {
		seatIdx := len(r.Players)
		r.Players = append(r.Players, r.NewTacticalHardBot(seatIdx))
	}
}

// GetJuruKunciPlayer returns the 4th-place (Juru Kunci) player from r.Scores
// so the server can assign them to the shuffle ritual on rematch.
func (r *Room) GetJuruKunciPlayer() *Player {
	if len(r.Scores) == 0 {
		return nil
	}

	var targetID string
	highestRank := 0
	for playerID, detail := range r.Scores {
		if detail.IsJuruKunci || detail.RankPosition == MaxPlayers {
			targetID = playerID
			break
		}
		if detail.RankPosition > highestRank {
			highestRank = detail.RankPosition
			targetID = playerID
		}
	}
	if targetID == "" {
		return nil
	}
	for _, p := range r.Players {
		if p.ID == targetID {
			return p
		}
	}
	return nil
}

// StartMatch initializes or restarts match progression for the room.
// For initial games (isRematch == false), it validates that the room is in StatusWaiting
// and that at least 2 human players are marked ready.
// For rematches (isRematch == true), it accepts StatusWaiting, StatusFinished, or StatusShuffling.
// It fills empty seats with Hard Bots, deals cards with auto-reshuffle, extracts the
// opener 7 onto the board, and sets the active turn to the player after the opener.
func (r *Room) StartMatch(isRematch bool, rng *rand.Rand) error {
	if !isRematch {
		if r.Status != StatusWaiting {
			return errors.New("room is not in waiting state")
		}

		readyHumans := 0
		for _, p := range r.Players {
			if !p.IsBot && p.IsReady {
				readyHumans++
			}
		}
		if readyHumans < MinHumanPlayersToStart {
			return errors.New("at least 2 human players must be ready to start")
		}
	} else if r.Status != StatusWaiting && r.Status != StatusFinished && r.Status != StatusShuffling {
		return errors.New("room is not ready for rematch")
	}

	if rng == nil {
		rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	}

	r.FillEmptySeatsWithHardBots()

	hands := engine.DealCardsWithAutoReshuffle(rng)
	openerSuit, openerIdx := engine.ExtractOpenerSeven(hands, rng)

	for i := 0; i < len(r.Players) && i < len(hands); i++ {
		r.Players[i].Hand = hands[i]
		r.Players[i].FoldedCards = make([]engine.Card, 0)
		r.Players[i].PenaltyPoints = 0
		if r.Players[i].StatusRTRW == "" {
			r.Players[i].StatusRTRW = engine.StatusNone
		}
	}

	r.Board = engine.NewBoard()
	openerCard := engine.Card{Suit: openerSuit, Rank: engine.AnchorRank}
	if _, err := r.Board.PlayCardWithAceMode(openerCard, engine.AceModeLockedNone); err != nil {
		return err
	}

	r.Status = StatusPlaying
	r.AceMode = engine.AceModeLockedNone
	r.OpenerSuit = openerSuit
	r.TurnNumber = 1
	if isRematch {
		r.RoundNumber++
		if r.RTRWStatus == "" {
			r.RTRWStatus = engine.StatusNone
		}
	} else {
		r.RoundNumber = 1
		r.RTRWHolderID = ""
		r.RTRWStatus = engine.StatusNone
	}
	r.Scores = nil
	r.ShufflerID = ""
	r.LastFoldTurn = make(map[string]int)
	r.CurrentTurn = r.Players[(openerIdx+1)%len(r.Players)].ID
	r.LastActivity = time.Now()

	return nil
}

// ProcessPlayCard executes card placement for the active player.
func (r *Room) ProcessPlayCard(playerID string, card engine.Card) error {
	if r.Status != StatusPlaying {
		return errors.New("game is not currently in playing status")
	}

	if r.CurrentTurn != playerID {
		return errors.New("it is not player's turn")
	}

	var player *Player
	for _, p := range r.Players {
		if p.ID == playerID {
			player = p
			break
		}
	}
	if player == nil {
		return errors.New("player not found in room")
	}

	cardIdx := -1
	for i, c := range player.Hand {
		if c.Suit == card.Suit && c.Rank == card.Rank {
			cardIdx = i
			break
		}
	}
	if cardIdx == -1 {
		return errors.New("card is not in player's hand")
	}

	newAceMode, err := r.Board.PlayCardWithAceMode(card, r.AceMode)
	if err != nil {
		return err
	}

	r.AceMode = newAceMode
	player.Hand = append(player.Hand[:cardIdx], player.Hand[cardIdx+1:]...)
	r.TurnNumber++
	r.LastActivity = time.Now()

	if r.IsRoundComplete() {
		r.FinalizeRound()
	} else {
		r.AdvanceTurn()
	}

	return nil
}

// ProcessFoldCard executes card folding under Anti-Bohong and 7-Card Anti-Sabotage rules.
func (r *Room) ProcessFoldCard(playerID string, card engine.Card) error {
	if r.Status != StatusPlaying {
		return errors.New("game is not currently in playing status")
	}

	if r.CurrentTurn != playerID {
		return errors.New("it is not player's turn")
	}

	var player *Player
	for _, p := range r.Players {
		if p.ID == playerID {
			player = p
			break
		}
	}
	if player == nil {
		return errors.New("player not found in room")
	}

	if err := r.Board.ValidateFoldCard(player.Hand, card, r.AceMode); err != nil {
		return err
	}

	cardIdx := -1
	for i, c := range player.Hand {
		if c.Suit == card.Suit && c.Rank == card.Rank {
			cardIdx = i
			break
		}
	}
	if cardIdx != -1 {
		player.Hand = append(player.Hand[:cardIdx], player.Hand[cardIdx+1:]...)
	}

	player.FoldedCards = append(player.FoldedCards, card)
	penalty := engine.CalculateCardPenalty(card, r.AceMode)
	player.PenaltyPoints += penalty.Points

	if r.LastFoldTurn == nil {
		r.LastFoldTurn = make(map[string]int)
	}
	r.LastFoldTurn[playerID] = r.TurnNumber
	r.TurnNumber++
	r.LastActivity = time.Now()

	if r.IsRoundComplete() {
		r.FinalizeRound()
	} else {
		r.AdvanceTurn()
	}

	return nil
}

// IsRoundComplete returns true if all players' hands are completely empty.
func (r *Room) IsRoundComplete() bool {
	if len(r.Players) == 0 {
		return false
	}
	for _, p := range r.Players {
		if len(p.Hand) > 0 {
			return false
		}
	}
	return true
}

// AdvanceTurn shifts the current turn to the next player with cards in circular seat order.
func (r *Room) AdvanceTurn() {
	if len(r.Players) == 0 {
		return
	}

	currentIdx := -1
	for i, p := range r.Players {
		if p.ID == r.CurrentTurn {
			currentIdx = i
			break
		}
	}
	if currentIdx == -1 {
		currentIdx = 0
	}

	for step := 1; step <= len(r.Players); step++ {
		nextIdx := (currentIdx + step) % len(r.Players)
		if len(r.Players[nextIdx].Hand) > 0 {
			r.CurrentTurn = r.Players[nextIdx].ID
			return
		}
	}
}

// FinalizeRound finishes the match round, calculates leaderboard rankings, synchronizes penalties,
// and updates LossesCount, ConsecutiveLosses, and RT/RW community status for all players and room.
func (r *Room) FinalizeRound() {
	r.Status = StatusFinished
	r.LastActivity = time.Now()

	inputs := make([]engine.PlayerScoreInput, len(r.Players))
	for i, p := range r.Players {
		status := p.StatusRTRW
		if status == "" {
			status = engine.StatusNone
		}
		inputs[i] = engine.PlayerScoreInput{
			PlayerID:          p.ID,
			PlayerName:        p.Name,
			SeatIndex:         i,
			FoldedCards:       p.FoldedCards,
			LossesCount:       p.LossesCount,
			ConsecutiveLosses: p.ConsecutiveLosses,
			StatusRTRW:        status,
		}
	}

	scores := engine.CalculateFinalLeaderboard(inputs, r.AceMode)
	r.Scores = scores

	r.RTRWHolderID = ""
	r.RTRWStatus = engine.StatusNone

	for _, p := range r.Players {
		if detail, ok := scores[p.ID]; ok {
			p.PenaltyPoints = detail.TotalPenalty
			p.LossesCount = detail.LossesCount
			p.ConsecutiveLosses = detail.ConsecutiveLosses
			p.StatusRTRW = detail.StatusRTRW
			if p.StatusRTRW == engine.StatusRT || p.StatusRTRW == engine.StatusRW {
				r.RTRWHolderID = p.ID
				r.RTRWStatus = p.StatusRTRW
			}
		}
	}
}

