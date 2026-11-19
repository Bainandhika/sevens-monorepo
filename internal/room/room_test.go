package room

import (
	"bufio"
	"context"
	"encoding/json"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/olahol/melody"
	"github.com/user/sevens/pkg/engine"
)

func TestSanitizeAndInitials(t *testing.T) {
	// 1. Room code sanitization tests
	validCodes := []struct {
		input    string
		expected string
	}{
		{"abc123", "ABC123"},
		{"  ab-cd 78  ", "ABCD78"},
		{"XyZ999", "XYZ999"},
	}
	for _, tc := range validCodes {
		got, err := SanitizeRoomCode(tc.input)
		if err != nil {
			t.Fatalf("SanitizeRoomCode(%q) unexpected error: %v", tc.input, err)
		}
		if got != tc.expected {
			t.Errorf("SanitizeRoomCode(%q) = %q; want %q", tc.input, got, tc.expected)
		}
	}

	invalidCodes := []string{"", "abc", "abcdefgh", "!!!@@@"}
	for _, raw := range invalidCodes {
		if _, err := SanitizeRoomCode(raw); err == nil {
			t.Errorf("SanitizeRoomCode(%q) expected error, got nil", raw)
		}
	}

	// 2. Nickname sanitization tests (strict ASCII alphanumeric ^[a-zA-Z0-9]{1,7}$)
	nicknames := []struct {
		input    string
		expected string
	}{
		{"Alice", "Alice"},
		{"LongNickname123", "LongNic"},
		{"", "Sekop07"},
		{"   !@#$   ", "Sekop07"},
		{"Bob @ 99", "Bob99"},
		{"Budié99", "Budi99"},
		{"αβγ", "Sekop07"},
		{"A1b2C3d4", "A1b2C3d"},
	}
	for _, tc := range nicknames {
		got := SanitizeNickname(tc.input)
		if got != tc.expected {
			t.Errorf("SanitizeNickname(%q) = %q; want %q", tc.input, got, tc.expected)
		}
	}

	// 3. Initials generator tests
	initials := []struct {
		input    string
		expected string
	}{
		{"Sekop07", "S7"},
		{"Ksatria", "KS"},
		{"A", "A"},
		{"", ""},
		{"Elena_F", "EF"},
		{"Bot Taktis", "BT"},
	}
	for _, tc := range initials {
		got := GenerateInitials(tc.input)
		if got != tc.expected {
			t.Errorf("GenerateInitials(%q) = %q; want %q", tc.input, got, tc.expected)
		}
	}
}

func TestWaitingRoomAndAutoFillHardBots(t *testing.T) {
	mgr := NewManager()
	r := mgr.GetOrCreateRoom("WAIT01")

	if r.Status != StatusWaiting {
		t.Fatalf("expected room status %s, got %s", StatusWaiting, r.Status)
	}

	// Host defaults to IsReady = true
	host := &Player{
		ID:          "player-host",
		Name:        "Host1",
		Initials:    "H1",
		AvatarColor: GetAvatarColor(0),
		IsHost:      true,
		IsReady:     true,
		IsConnected: true,
	}
	r.Players = append(r.Players, host)

	if !host.IsReady || !host.IsHost {
		t.Fatalf("expected host to be ready and marked as host")
	}

	// Guest defaults to IsReady = false
	guest := &Player{
		ID:          "player-guest",
		Name:        "Guest1",
		Initials:    "G1",
		AvatarColor: GetAvatarColor(1),
		IsHost:      false,
		IsReady:     false,
		IsConnected: true,
	}
	r.Players = append(r.Players, guest)

	if guest.IsReady || guest.IsHost {
		t.Fatalf("expected guest to be not ready and not host")
	}

	// StartMatch should fail because only 1 human is ready
	err := r.StartMatch(false, nil)
	if err == nil {
		t.Fatalf("expected StartMatch to fail when ready humans < 2")
	}

	// Guest toggles ready
	guest.IsReady = true

	// Now StartMatch should succeed and auto-fill remaining seats with Hard Bots
	rng := rand.New(rand.NewSource(1001))
	if err := r.StartMatch(false, rng); err != nil {
		t.Fatalf("StartMatch failed with 2 ready humans: %v", err)
	}

	if len(r.Players) != MaxPlayers {
		t.Fatalf("expected %d players, got %d", MaxPlayers, len(r.Players))
	}

	// Verify seats 3 and 4 (indices 2 and 3) are tactical Hard Bots
	expectedNames := []string{"Agresif9", "Cermat8"}
	expectedInitials := []string{"A9", "C8"}
	for i := 2; i < 4; i++ {
		bot := r.Players[i]
		if !bot.IsBot {
			t.Errorf("player %d expected to be bot", i)
		}
		if bot.BotLevel != engine.DifficultyHard {
			t.Errorf("player %d expected BotLevel %s, got %s", i, engine.DifficultyHard, bot.BotLevel)
		}
		if bot.Name != expectedNames[i-2] {
			t.Errorf("player %d expected name %q, got %q", i, expectedNames[i-2], bot.Name)
		}
		if bot.Initials != expectedInitials[i-2] {
			t.Errorf("player %d expected initials %q, got %q", i, expectedInitials[i-2], bot.Initials)
		}
	}

	if r.Status != StatusPlaying {
		t.Errorf("expected room status %s, got %s", StatusPlaying, r.Status)
	}

	// Also verify 1 human + 3 empty seats fills Agresif9, Cermat8, Taktik7
	rSolo := mgr.GetOrCreateRoom("SOLO01")
	rSolo.Players = []*Player{
		{ID: "h1", Name: "Sekop07", Initials: "S7", AvatarColor: GetAvatarColor(0), IsHost: true, IsReady: true, IsConnected: true},
	}
	rSolo.FillEmptySeatsWithHardBots()
	wantThree := []struct{ name, init string }{
		{"Agresif9", "A9"},
		{"Cermat8", "C8"},
		{"Taktik7", "T7"},
	}
	for idx, want := range wantThree {
		bot := rSolo.Players[idx+1]
		if bot.Name != want.name || bot.Initials != want.init || bot.BotLevel != engine.DifficultyHard {
			t.Errorf("solo bot %d = (%q, %q, %s); want (%q, %q, hard)",
				idx+1, bot.Name, bot.Initials, bot.BotLevel, want.name, want.init)
		}
	}
}

func TestGameplayAndScoringLifecycle(t *testing.T) {
	mgr := NewManager()
	r := mgr.GetOrCreateRoom("GAME01")

	p1 := &Player{ID: "p1", Name: "P1", IsHost: true, IsReady: true, IsConnected: true}
	p2 := &Player{ID: "p2", Name: "P2", IsHost: false, IsReady: true, IsConnected: true}
	r.Players = append(r.Players, p1, p2)

	rng := rand.New(rand.NewSource(42))
	if err := r.StartMatch(false, rng); err != nil {
		t.Fatalf("StartMatch failed: %v", err)
	}

	// Verify opener 7 was extracted and placed on board
	if r.OpenerSuit == "" {
		t.Fatalf("expected non-empty opener suit")
	}
	suitState, exists := r.Board.Suits[r.OpenerSuit]
	if !exists || !suitState.HasSeven {
		t.Fatalf("expected opener 7 placed on board for suit %s", r.OpenerSuit)
	}

	// Check total card count across players (12 for opener player, 13 for others => 51 total)
	totalCards := 0
	for _, p := range r.Players {
		totalCards += len(p.Hand)
	}
	if totalCards != 51 {
		t.Fatalf("expected 51 total cards remaining in players' hands, got %d", totalCards)
	}

	// 1. Rejection: Wrong turn player
	var nonTurnPlayerID string
	for _, p := range r.Players {
		if p.ID != r.CurrentTurn {
			nonTurnPlayerID = p.ID
			break
		}
	}
	dummyCard := engine.Card{Suit: engine.Spades, Rank: 2}
	if err := r.ProcessPlayCard(nonTurnPlayerID, dummyCard); err == nil {
		t.Errorf("expected error when playing out of turn, got nil")
	}
	if err := r.ProcessFoldCard(nonTurnPlayerID, dummyCard); err == nil {
		t.Errorf("expected error when folding out of turn, got nil")
	}

	// 2. Rejection: Card not in hand
	currPlayer := r.FindPlayerByID(r.CurrentTurn)
	missingCard := engine.Card{Suit: "invalid_suit", Rank: 99}
	if err := r.ProcessPlayCard(currPlayer.ID, missingCard); err == nil {
		t.Errorf("expected error when playing card not in hand, got nil")
	}

	// 3. Rejection: Anti-Bohong rule (folding when valid moves exist)
	validMoves := r.Board.GetValidMovesWithAceMode(currPlayer.Hand, r.AceMode)
	if len(validMoves) > 0 {
		cardToAttemptFold := currPlayer.Hand[0]
		if err := r.ProcessFoldCard(currPlayer.ID, cardToAttemptFold); err == nil {
			t.Errorf("expected Anti-Bohong validation error when folding with available moves, got nil")
		}
	}

	// 4. Rejection: 7-Card Anti-Sabotage rule
	sevenCard := engine.Card{Suit: engine.Hearts, Rank: engine.AnchorRank}
	fakeHandWithSeven := []engine.Card{sevenCard}
	emptyBoard := engine.NewBoard()
	if err := emptyBoard.ValidateFoldCard(fakeHandWithSeven, sevenCard, engine.AceModeLockedNone); err == nil {
		t.Errorf("expected 7-Card Anti-Sabotage error when folding rank 7 card, got nil")
	}

	// 5. Play round until completion
	turnsPlayed := 0
	maxTurns := 100
	for !r.IsRoundComplete() && turnsPlayed < maxTurns {
		turnsPlayed++
		activePlayer := r.FindPlayerByID(r.CurrentTurn)
		legal := r.Board.GetValidMovesWithAceMode(activePlayer.Hand, r.AceMode)
		if len(legal) > 0 {
			if err := r.ProcessPlayCard(activePlayer.ID, legal[0]); err != nil {
				t.Fatalf("ProcessPlayCard error on turn %d: %v", turnsPlayed, err)
			}
		} else {
			safestFold := engine.SelectSafestFoldCard(activePlayer.Hand, r.AceMode)
			if err := r.ProcessFoldCard(activePlayer.ID, safestFold); err != nil {
				t.Fatalf("ProcessFoldCard error on turn %d: %v", turnsPlayed, err)
			}
		}
	}

	if !r.IsRoundComplete() {
		t.Fatalf("expected round to be complete after %d turns", turnsPlayed)
	}
	if r.Status != StatusFinished {
		t.Fatalf("expected room status %s, got %s", StatusFinished, r.Status)
	}

	// Leaderboard calculation checks
	if len(r.Scores) != MaxPlayers {
		t.Fatalf("expected %d score entries, got %d", MaxPlayers, len(r.Scores))
	}

	var winnerCount, juruKunciCount int
	var juruKunciID string
	for pid, score := range r.Scores {
		if score.IsWinner {
			winnerCount++
			if score.RankPosition != 1 {
				t.Errorf("winner rank expected 1, got %d", score.RankPosition)
			}
		}
		if score.IsJuruKunci {
			juruKunciCount++
			juruKunciID = pid
			if score.RankPosition != 4 {
				t.Errorf("juru kunci rank expected 4, got %d", score.RankPosition)
			}
		}
	}

	if winnerCount != 1 {
		t.Errorf("expected exactly 1 winner, got %d", winnerCount)
	}
	if juruKunciCount != 1 {
		t.Errorf("expected exactly 1 juru kunci, got %d", juruKunciCount)
	}

	// Verify LossesCount was incremented for Juru Kunci
	juruKunciPlayer := r.FindPlayerByID(juruKunciID)
	if juruKunciPlayer.LossesCount != 1 {
		t.Errorf("expected juru kunci player LossesCount == 1, got %d", juruKunciPlayer.LossesCount)
	}
}

func TestRematchPreservesLossesCount(t *testing.T) {
	mgr := NewManager()
	r := mgr.GetOrCreateRoom("REMATCH01")

	p1 := &Player{ID: "p1", Name: "P1", IsHost: true, IsReady: true, IsConnected: true, LossesCount: 0, ConsecutiveLosses: 0, StatusRTRW: engine.StatusNone}
	p2 := &Player{ID: "p2", Name: "P2", IsHost: false, IsReady: true, IsConnected: true, LossesCount: 0, ConsecutiveLosses: 0, StatusRTRW: engine.StatusNone}
	p3 := &Player{ID: "p3", Name: "P3", IsHost: false, IsReady: true, IsConnected: true, LossesCount: 0, ConsecutiveLosses: 0, StatusRTRW: engine.StatusNone}
	p4 := &Player{ID: "p4", Name: "P4", IsHost: false, IsReady: true, IsConnected: true, LossesCount: 0, ConsecutiveLosses: 0, StatusRTRW: engine.StatusNone}
	r.Players = append(r.Players, p1, p2, p3, p4)

	rng := rand.New(rand.NewSource(777))
	if err := r.StartMatch(false, rng); err != nil {
		t.Fatalf("StartMatch initial failed: %v", err)
	}

	if r.RoundNumber != 1 {
		t.Fatalf("expected initial roundNumber 1, got %d", r.RoundNumber)
	}
	if r.RTRWHolderID != "" || r.RTRWStatus != engine.StatusNone {
		t.Fatalf("expected initial room RTRW empty, got holder=%q status=%s", r.RTRWHolderID, r.RTRWStatus)
	}

	// Play 6 consecutive rounds where p4 finishes 4th (Juru Kunci) in every round.
	for round := 1; round <= 6; round++ {
		// Assign folded cards ensuring p4 has the highest penalty (Juru Kunci)
		p1.FoldedCards = []engine.Card{}
		p2.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 2}}
		p3.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 3}}
		p4.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 10}}

		r.FinalizeRound()

		if r.Status != StatusFinished {
			t.Fatalf("round %d: expected status %s, got %s", round, StatusFinished, r.Status)
		}
		if len(r.Scores) != 4 {
			t.Fatalf("round %d: expected 4 score records, got %d", round, len(r.Scores))
		}

		// Verify p4 consecutive losses and cumulative losses
		if p4.LossesCount != round {
			t.Errorf("round %d: p4 LossesCount = %d; want %d", round, p4.LossesCount, round)
		}
		if p4.ConsecutiveLosses != round {
			t.Errorf("round %d: p4 ConsecutiveLosses = %d; want %d", round, p4.ConsecutiveLosses, round)
		}

		// Verify non-loser players have 0 consecutive losses and NONE status
		for _, p := range []*Player{p1, p2, p3} {
			if p.ConsecutiveLosses != 0 {
				t.Errorf("round %d: player %s ConsecutiveLosses = %d; want 0", round, p.ID, p.ConsecutiveLosses)
			}
			if p.StatusRTRW != engine.StatusNone {
				t.Errorf("round %d: player %s StatusRTRW = %s; want %s", round, p.ID, p.StatusRTRW, engine.StatusNone)
			}
		}

		// Verify RT/RW status at each milestone
		if round < 3 {
			if p4.StatusRTRW != engine.StatusNone {
				t.Errorf("round %d: p4 StatusRTRW = %s; want %s", round, p4.StatusRTRW, engine.StatusNone)
			}
			if r.RTRWHolderID != "" || r.RTRWStatus != engine.StatusNone {
				t.Errorf("round %d: room RTRWHolderID=%q, RTRWStatus=%s; want empty/NONE", round, r.RTRWHolderID, r.RTRWStatus)
			}
		} else if round < 6 {
			// Rounds 3, 4, 5: p4 has achieved StatusRT
			if p4.StatusRTRW != engine.StatusRT {
				t.Errorf("round %d: p4 StatusRTRW = %s; want %s", round, p4.StatusRTRW, engine.StatusRT)
			}
			if r.RTRWHolderID != "p4" || r.RTRWStatus != engine.StatusRT {
				t.Errorf("round %d: room RTRWHolderID=%q, RTRWStatus=%s; want p4/RT", round, r.RTRWHolderID, r.RTRWStatus)
			}
		} else {
			// Round 6: p4 has achieved StatusRW (2 consecutive RT streaks)
			if p4.StatusRTRW != engine.StatusRW {
				t.Errorf("round %d: p4 StatusRTRW = %s; want %s", round, p4.StatusRTRW, engine.StatusRW)
			}
			if r.RTRWHolderID != "p4" || r.RTRWStatus != engine.StatusRW {
				t.Errorf("round %d: room RTRWHolderID=%q, RTRWStatus=%s; want p4/RW", round, r.RTRWHolderID, r.RTRWStatus)
			}
		}

		// Trigger rematch into next round
		if err := r.StartMatch(true, rng); err != nil {
			t.Fatalf("round %d rematch failed: %v", round, err)
		}

		// Verify rematch state reset
		if r.RoundNumber != round+1 {
			t.Errorf("expected roundNumber %d, got %d", round+1, r.RoundNumber)
		}
		if r.Status != StatusPlaying {
			t.Errorf("expected status %s, got %s", StatusPlaying, r.Status)
		}
		if r.Scores != nil {
			t.Errorf("expected scores to be reset to nil on rematch")
		}

		// Verify hands redealt and round penalty reset
		for i, p := range r.Players {
			if len(p.Hand) == 0 {
				t.Errorf("player %d has empty hand after rematch deal", i)
			}
			if len(p.FoldedCards) != 0 {
				t.Errorf("player %d has non-empty folded cards after rematch reset", i)
			}
			if p.PenaltyPoints != 0 {
				t.Errorf("player %d has non-zero penalty points after rematch reset", i)
			}
		}

		// Verify ConsecutiveLosses, StatusRTRW, RTRWHolderID, and RTRWStatus are preserved across rematch
		if p4.LossesCount != round {
			t.Errorf("after rematch: p4 LossesCount = %d; want %d", p4.LossesCount, round)
		}
		if p4.ConsecutiveLosses != round {
			t.Errorf("after rematch: p4 ConsecutiveLosses = %d; want %d", p4.ConsecutiveLosses, round)
		}

		expectedStatus := engine.StatusNone
		expectedHolder := ""
		if round >= 6 {
			expectedStatus = engine.StatusRW
			expectedHolder = "p4"
		} else if round >= 3 {
			expectedStatus = engine.StatusRT
			expectedHolder = "p4"
		}

		if p4.StatusRTRW != expectedStatus {
			t.Errorf("after rematch %d: p4 StatusRTRW = %s; want %s", round, p4.StatusRTRW, expectedStatus)
		}
		if r.RTRWHolderID != expectedHolder || r.RTRWStatus != expectedStatus {
			t.Errorf("after rematch %d: room RTRWHolderID=%q, RTRWStatus=%s; want %q/%s",
				round, r.RTRWHolderID, r.RTRWStatus, expectedHolder, expectedStatus)
		}
	}

	// Round 7: Streak break test. p1 finishes 4th, p4 finishes 1st.
	// p4 ConsecutiveLosses resets to 0, but retains StatusRW until another player achieves RT.
	p1.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 10}} // 4th place
	p2.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 3}}
	p3.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 2}}
	p4.FoldedCards = []engine.Card{} // 1st place

	r.FinalizeRound()

	if p4.ConsecutiveLosses != 0 {
		t.Errorf("round 7 streak break: p4 ConsecutiveLosses = %d; want 0", p4.ConsecutiveLosses)
	}
	if p4.StatusRTRW != engine.StatusRW {
		t.Errorf("round 7 streak break: p4 StatusRTRW = %s; want %s", p4.StatusRTRW, engine.StatusRW)
	}
	if r.RTRWHolderID != "p4" || r.RTRWStatus != engine.StatusRW {
		t.Errorf("round 7 streak break: room RTRWHolderID=%q, RTRWStatus=%s; want p4/RW", r.RTRWHolderID, r.RTRWStatus)
	}
	if p1.ConsecutiveLosses != 1 || p1.StatusRTRW != engine.StatusNone {
		t.Errorf("round 7: p1 ConsecutiveLosses=%d, Status=%s; want 1/NONE", p1.ConsecutiveLosses, p1.StatusRTRW)
	}

	// Rounds 8 & 9: p1 loses two more times to reach 3 consecutive losses (RT), dethroning p4 (Exclusivity)
	for round := 8; round <= 9; round++ {
		if err := r.StartMatch(true, rng); err != nil {
			t.Fatalf("round %d rematch failed: %v", round, err)
		}
		p1.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 10}}
		p2.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 3}}
		p3.FoldedCards = []engine.Card{{Suit: engine.Hearts, Rank: 2}}
		p4.FoldedCards = []engine.Card{}
		r.FinalizeRound()
	}

	// At round 9, p1 has 3 consecutive losses -> becomes StatusRT.
	// p4's previous StatusRW must be stripped to StatusNone (strictly exclusive holder).
	if p1.ConsecutiveLosses != 3 || p1.StatusRTRW != engine.StatusRT {
		t.Errorf("round 9 dethrone: p1 ConsecutiveLosses=%d, Status=%s; want 3/RT", p1.ConsecutiveLosses, p1.StatusRTRW)
	}
	if p4.StatusRTRW != engine.StatusNone {
		t.Errorf("round 9 exclusivity: p4 StatusRTRW = %s; want %s (stripped)", p4.StatusRTRW, engine.StatusNone)
	}
	if r.RTRWHolderID != "p1" || r.RTRWStatus != engine.StatusRT {
		t.Errorf("round 9 dethrone: room RTRWHolderID=%q, RTRWStatus=%s; want p1/RT", r.RTRWHolderID, r.RTRWStatus)
	}

	// Rematch to round 10: verify p1 RT status and exclusivity preserved
	if err := r.StartMatch(true, rng); err != nil {
		t.Fatalf("round 10 rematch failed: %v", err)
	}
	if p1.StatusRTRW != engine.StatusRT || p4.StatusRTRW != engine.StatusNone {
		t.Errorf("round 10 rematch: p1=%s, p4=%s; want p1=RT, p4=NONE", p1.StatusRTRW, p4.StatusRTRW)
	}
	if r.RTRWHolderID != "p1" || r.RTRWStatus != engine.StatusRT {
		t.Errorf("round 10 rematch: room RTRWHolderID=%q, RTRWStatus=%s; want p1/RT", r.RTRWHolderID, r.RTRWStatus)
	}
}

func TestHostMigrationAndReaper(t *testing.T) {
	// 1. Host migration tests
	r := &Room{
		ID:           "MIGRATE01",
		Status:       StatusWaiting,
		LastActivity: time.Now(),
	}

	p1 := &Player{ID: "p1", Name: "Host1", IsHost: true, IsReady: true, IsConnected: true}
	p2 := &Player{ID: "p2", Name: "Guest1", IsHost: false, IsReady: false, IsConnected: true}
	r.Players = []*Player{p1, p2}

	// No migration needed while host is active
	if r.MigrateHost() {
		t.Errorf("MigrateHost returned true when host was already valid")
	}

	// Disconnect host
	p1.IsConnected = false
	if !r.MigrateHost() {
		t.Fatalf("expected MigrateHost to return true after host disconnected")
	}
	if p1.IsHost {
		t.Errorf("expected disconnected host IsHost to be false")
	}
	if !p2.IsHost || !p2.IsReady {
		t.Errorf("expected next connected human to become host and ready")
	}

	// Disconnect second player
	p2.IsConnected = false
	if r.MigrateHost() {
		t.Errorf("MigrateHost returned true when no connected humans exist")
	}

	// 2. Room Reaper GC tests
	mgr := NewManager()

	// Active room with connected human
	rActive := mgr.GetOrCreateRoom("ACTIVE")
	rActive.Players = []*Player{
		{ID: "u1", IsBot: false, IsConnected: true},
	}
	rActive.LastActivity = time.Now()

	// Idle room (> 5 minutes idle)
	rIdle := mgr.GetOrCreateRoom("IDLE")
	rIdle.Players = []*Player{
		{ID: "u2", IsBot: false, IsConnected: true},
	}
	rIdle.LastActivity = time.Now().Add(-10 * time.Minute)

	// Abandoned room (no connected humans and no reconnect timer)
	rAbandoned := mgr.GetOrCreateRoom("ABANDONED")
	rAbandoned.Players = []*Player{
		{ID: "u3", IsBot: false, IsConnected: false, ReconnectTimer: nil},
	}
	rAbandoned.LastActivity = time.Now()

	// Reconnecting room (human disconnected but reconnect timer is running)
	rReconnecting := mgr.GetOrCreateRoom("RECONNECTING")
	timer := time.NewTimer(10 * time.Second)
	defer timer.Stop()
	rReconnecting.Players = []*Player{
		{ID: "u4", IsBot: false, IsConnected: false, ReconnectTimer: timer},
	}
	rReconnecting.LastActivity = time.Now()

	// Run reapStaleRooms with 5-minute max idle threshold
	mgr.reapStaleRooms(5 * time.Minute)

	if _, exists := mgr.GetRoom("ACTIVE"); !exists {
		t.Errorf("ACTIVE room should not have been reaped")
	}
	if _, exists := mgr.GetRoom("IDLE"); exists {
		t.Errorf("IDLE room should have been reaped")
	}
	if _, exists := mgr.GetRoom("ABANDONED"); exists {
		t.Errorf("ABANDONED room should have been reaped")
	}
	if _, exists := mgr.GetRoom("RECONNECTING"); !exists {
		t.Errorf("RECONNECTING room should not have been reaped while timer active")
	}

	// 3. StartReaper context cancellation test
	ctx, cancel := context.WithCancel(context.Background())
	mgr.StartReaper(ctx, 10*time.Millisecond, 5*time.Minute)
	time.Sleep(25 * time.Millisecond)
	cancel()

	// 4. Concurrency test under Room RWMutex
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			rActive.UpdateActivity()
			rActive.MigrateHost()
			_ = rActive.HumanPlayersCount()
			_ = rActive.ReadyHumanCount()
			_ = rActive.HasActiveHumans()
		}(i)
	}
	wg.Wait()
}

type pipeHijackWriter struct {
	conn   net.Conn
	brw    *bufio.ReadWriter
	header http.Header
}

func (p *pipeHijackWriter) Header() http.Header         { return p.header }
func (p *pipeHijackWriter) Write(b []byte) (int, error) { return p.brw.Write(b) }
func (p *pipeHijackWriter) WriteHeader(int)             {}
func (p *pipeHijackWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	return p.conn, p.brw, nil
}

func setupWSTestServer(t *testing.T) (*Manager, *SocketHandler, func() *websocket.Conn) {
	t.Helper()
	mgr := NewManager()
	m := melody.New()
	handler := NewSocketHandler(m, mgr)

	dial := func() *websocket.Conn {
		clientConn, serverConn := net.Pipe()
		go func() {
			br := bufio.NewReader(serverConn)
			req, err := http.ReadRequest(br)
			if err != nil {
				_ = serverConn.Close()
				return
			}
			rw := &pipeHijackWriter{
				conn:   serverConn,
				brw:    bufio.NewReadWriter(br, bufio.NewWriter(serverConn)),
				header: make(http.Header),
			}
			handler.HandleUpgrade(rw, req)
		}()

		u, _ := url.Parse("ws://localhost/ws")
		wsConn, _, err := websocket.NewClient(clientConn, u, nil, 1024, 1024)
		if err != nil {
			t.Fatalf("in-memory websocket dial failed: %v", err)
		}
		return wsConn
	}

	t.Cleanup(func() {
		_ = m.Close()
	})
	return mgr, handler, dial
}

func readWSMessageOfType(t *testing.T, conn *websocket.Conn, wantType string) WSMessage {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		_ = conn.SetReadDeadline(deadline)
		_, raw, err := conn.ReadMessage()
		if err != nil {
			t.Fatalf("failed reading ws message waiting for %q: %v", wantType, err)
		}
		var msg WSMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			t.Fatalf("invalid ws JSON: %v", err)
		}
		if msg.Type == wantType {
			return msg
		}
	}
	t.Fatalf("timed out waiting for ws message type %q", wantType)
	return WSMessage{}
}

func sendWSEvent(t *testing.T, conn *websocket.Conn, eventType string, payload any) {
	t.Helper()
	if err := conn.WriteJSON(WSResponse{Type: eventType, Payload: payload}); err != nil {
		t.Fatalf("failed sending %s: %v", eventType, err)
	}
}

func TestSocketShuffleRitualAndLoungeReactions(t *testing.T) {
	mgr, handler, dial := setupWSTestServer(t)
	handler.shuffleTimeout = 100 * time.Millisecond
	handler.botShuffleStepDelay = 15 * time.Millisecond

	c1 := dial()
	defer c1.Close()

	c2 := dial()
	defer c2.Close()

	// 1. Join room & check initial statusRtRw == "NONE"
	sendWSEvent(t, c1, EventJoin, JoinPayload{RoomID: "SHUF01", PlayerID: "p1", Name: "Host1!", SessionToken: "tok1"})
	msg1 := readWSMessageOfType(t, c1, EventRoomState)
	var rs1 Room
	if err := json.Unmarshal(msg1.Payload, &rs1); err != nil {
		t.Fatalf("unmarshal room_state 1: %v", err)
	}
	if rs1.Players[0].Name != "Host1" || rs1.Players[0].StatusRTRW != engine.StatusNone {
		t.Fatalf("unexpected player 1 join state: name=%q statusRtRw=%q", rs1.Players[0].Name, rs1.Players[0].StatusRTRW)
	}

	sendWSEvent(t, c2, EventJoin, JoinPayload{RoomID: "SHUF01", PlayerID: "p2", Name: "Guest2", SessionToken: "tok2"})
	_ = readWSMessageOfType(t, c1, EventRoomState)
	_ = readWSMessageOfType(t, c2, EventRoomState)

	// 2. Non-host start_game should return error; add_bot should lock difficulty to hard
	sendWSEvent(t, c2, EventStartGame, StartGamePayload{RoomID: "SHUF01", PlayerID: "p2"})
	errMsg := readWSMessageOfType(t, c2, EventError)
	var errPayload ErrorPayload
	_ = json.Unmarshal(errMsg.Payload, &errPayload)
	if errPayload.Message != "hanya host yang dapat memulai permainan" {
		t.Errorf("unexpected non-host start error: %q", errPayload.Message)
	}

	sendWSEvent(t, c1, EventAddBot, AddBotPayload{RoomID: "SHUF01", Difficulty: engine.DifficultyEasy})
	botStateMsg := readWSMessageOfType(t, c1, EventRoomState)
	_ = readWSMessageOfType(t, c2, EventRoomState)
	var rsBot Room
	_ = json.Unmarshal(botStateMsg.Payload, &rsBot)
	if len(rsBot.Players) != 3 || rsBot.Players[2].BotLevel != engine.DifficultyHard || rsBot.Players[2].Name != "Agresif9" {
		t.Fatalf("expected locked Hard bot Agresif9, got %+v", rsBot.Players)
	}

	// 3. Move room to StatusFinished with p2 as Juru Kunci, then trigger rematch -> StatusShuffling
	r, _ := mgr.GetRoom("SHUF01")
	r.Mu.Lock()
	r.FillEmptySeatsWithHardBots()
	r.Players[0].FoldedCards = nil
	r.Players[1].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 13}} // p2 loses
	r.Players[2].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 2}}
	r.Players[3].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 3}}
	r.RoundNumber = 1
	r.FinalizeRound()
	r.Mu.Unlock()

	// Disable timeout briefly by setting long timeout for manual step-3 test
	handler.shuffleTimeout = 2 * time.Second
	sendWSEvent(t, c1, EventRematch, RematchPayload{RoomID: "SHUF01", PlayerID: "p1"})
	shufMsg := readWSMessageOfType(t, c2, EventRoomState)
	_ = readWSMessageOfType(t, c1, EventRoomState)
	var rsShuf Room
	_ = json.Unmarshal(shufMsg.Payload, &rsShuf)
	if rsShuf.Status != StatusShuffling || rsShuf.ShufflerID != "p2" {
		t.Fatalf("expected StatusShuffling with shufflerId=p2, got status=%s shufflerId=%q", rsShuf.Status, rsShuf.ShufflerID)
	}

	// 4. Lounge reactions: valid 'sruput' & 'cheer', invalid rejected
	sendWSEvent(t, c1, EventLoungeReaction, LoungeReactionPayload{RoomID: "SHUF01", Reaction: "sruput", SenderID: "p1"})
	reactMsg := readWSMessageOfType(t, c2, EventLoungeReaction)
	var reactPayload LoungeReactionPayload
	_ = json.Unmarshal(reactMsg.Payload, &reactPayload)
	if reactPayload.Reaction != "sruput" || reactPayload.SenderID != "p1" || reactPayload.SenderName != "Host1" {
		t.Errorf("unexpected lounge_reaction payload: %+v", reactPayload)
	}

	sendWSEvent(t, c1, EventLoungeReaction, LoungeReactionPayload{RoomID: "SHUF01", Reaction: "invalid", SenderID: "p1"})
	_ = readWSMessageOfType(t, c1, EventError)

	// 5. Shuffle progress steps 1..3 transition to StatusPlaying
	sendWSEvent(t, c2, EventShuffleProgress, ShuffleProgressPayload{RoomID: "SHUF01", Step: 1, TotalSteps: 3})
	p1Msg := readWSMessageOfType(t, c1, EventShuffleProgress)
	var sp1 ShuffleProgressPayload
	_ = json.Unmarshal(p1Msg.Payload, &sp1)
	if sp1.Step != 1 || sp1.ShufflerID != "p2" {
		t.Errorf("unexpected step 1 broadcast: %+v", sp1)
	}

	sendWSEvent(t, c2, EventShuffleProgress, ShuffleProgressPayload{RoomID: "SHUF01", Step: 3, TotalSteps: 3})
	_ = readWSMessageOfType(t, c1, EventShuffleProgress)
	playingMsg := readWSMessageOfType(t, c1, EventRoomState)
	_ = readWSMessageOfType(t, c2, EventRoomState)
	var rsPlaying Room
	_ = json.Unmarshal(playingMsg.Payload, &rsPlaying)
	if rsPlaying.Status != StatusPlaying || rsPlaying.RoundNumber != 2 || rsPlaying.ShufflerID != "" {
		t.Fatalf("expected StatusPlaying round 2 after step 3, got status=%s round=%d shuffler=%q",
			rsPlaying.Status, rsPlaying.RoundNumber, rsPlaying.ShufflerID)
	}

	// 6. Test anti-stall fallback timeout when human shuffler stalls
	handler.shuffleTimeout = 40 * time.Millisecond
	r.Mu.Lock()
	r.Players[0].FoldedCards = nil
	r.Players[1].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 13}}
	r.Players[2].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 2}}
	r.Players[3].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 3}}
	r.FinalizeRound()
	r.Mu.Unlock()

	sendWSEvent(t, c1, EventRematch, RematchPayload{RoomID: "SHUF01", PlayerID: "p1"})
	_ = readWSMessageOfType(t, c1, EventRoomState) // shuffling
	autoMsg := readWSMessageOfType(t, c1, EventShuffleProgress)
	var spAuto ShuffleProgressPayload
	_ = json.Unmarshal(autoMsg.Payload, &spAuto)
	if !spAuto.AutoReshuffle || spAuto.Step != 3 {
		t.Errorf("expected AutoReshuffle step 3 on timeout, got %+v", spAuto)
	}
	resumedMsg := readWSMessageOfType(t, c1, EventRoomState)
	var rsResumed Room
	_ = json.Unmarshal(resumedMsg.Payload, &rsResumed)
	if rsResumed.Status != StatusPlaying || rsResumed.RoundNumber != 3 {
		t.Errorf("expected StatusPlaying round 3 after timeout, got status=%s round=%d", rsResumed.Status, rsResumed.RoundNumber)
	}

	// 7. Test Bot Juru Kunci automated 3-step shuffle ritual
	handler.shuffleTimeout = 2 * time.Second
	r.Mu.Lock()
	r.Players[0].FoldedCards = nil
	r.Players[1].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 2}}
	r.Players[2].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 13}} // bot loses
	r.Players[3].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 3}}
	r.FinalizeRound()
	r.Mu.Unlock()

	sendWSEvent(t, c1, EventRematch, RematchPayload{RoomID: "SHUF01", PlayerID: "p1"})
	_ = readWSMessageOfType(t, c1, EventRoomState) // shuffling with bot shuffler
	for expectedStep := 1; expectedStep <= 3; expectedStep++ {
		botStepMsg := readWSMessageOfType(t, c1, EventShuffleProgress)
		var spBot ShuffleProgressPayload
		_ = json.Unmarshal(botStepMsg.Payload, &spBot)
		if spBot.Step != expectedStep {
			t.Errorf("expected bot shuffle step %d, got %d", expectedStep, spBot.Step)
		}
	}
	botDoneMsg := readWSMessageOfType(t, c1, EventRoomState)
	var rsBotDone Room
	_ = json.Unmarshal(botDoneMsg.Payload, &rsBotDone)
	if rsBotDone.Status != StatusPlaying || rsBotDone.RoundNumber != 4 {
		t.Errorf("expected StatusPlaying round 4 after bot shuffle, got status=%s round=%d", rsBotDone.Status, rsBotDone.RoundNumber)
	}

	// 8. Test Juru Kunci leaving during StatusShuffling converts to Bot and auto-completes
	r.Mu.Lock()
	r.Players[0].FoldedCards = nil
	r.Players[1].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 13}} // p2 loses
	r.Players[2].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 2}}
	r.Players[3].FoldedCards = []engine.Card{{Suit: engine.Spades, Rank: 3}}
	r.FinalizeRound()
	r.Mu.Unlock()

	sendWSEvent(t, c1, EventRematch, RematchPayload{RoomID: "SHUF01", PlayerID: "p1"})
	_ = readWSMessageOfType(t, c1, EventRoomState) // shuffling (p2)
	_ = readWSMessageOfType(t, c2, EventRoomState)

	sendWSEvent(t, c2, EventLeaveRoom, LeaveRoomPayload{RoomID: "SHUF01", PlayerID: "p2"})
	leaveAutoMsg := readWSMessageOfType(t, c1, EventShuffleProgress)
	var spLeave ShuffleProgressPayload
	_ = json.Unmarshal(leaveAutoMsg.Payload, &spLeave)
	if !spLeave.AutoReshuffle || spLeave.Step != 3 {
		t.Errorf("expected AutoReshuffle step 3 on shuffler leave, got %+v", spLeave)
	}
	leaveDoneMsg := readWSMessageOfType(t, c1, EventRoomState)
	var rsLeaveDone Room
	_ = json.Unmarshal(leaveDoneMsg.Payload, &rsLeaveDone)
	if rsLeaveDone.Status != StatusPlaying || !rsLeaveDone.Players[1].IsBot {
		t.Errorf("expected StatusPlaying and p2 converted to Bot after leave, got status=%s isBot=%v",
			rsLeaveDone.Status, rsLeaveDone.Players[1].IsBot)
	}
}

// Skipped: live WebSocket network latency testing (isolated to in-memory room lifecycle).
// Risk: none; all room state invariants, turn validation, host migration, and reaper tests pass.
