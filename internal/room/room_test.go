package room

import (
	"context"
	"math/rand"
	"sync"
	"testing"
	"time"

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

	// 2. Nickname sanitization tests
	nicknames := []struct {
		input    string
		expected string
	}{
		{"Alice", "Alice"},
		{"LongNickname123", "LongNic"},
		{"", "Sekop07"},
		{"   !@#$   ", "Sekop07"},
		{"Bob @ 99", "Bob99"},
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

	// Verify seats 3 and 4 (indices 2 and 3) are Hard Bots
	for i := 2; i < 4; i++ {
		bot := r.Players[i]
		if !bot.IsBot {
			t.Errorf("player %d expected to be bot", i)
		}
		if bot.BotLevel != engine.DifficultyHard {
			t.Errorf("player %d expected BotLevel %s, got %s", i, engine.DifficultyHard, bot.BotLevel)
		}
		if bot.Name != "Bot (Hard)" {
			t.Errorf("player %d expected name 'Bot (Hard)', got %s", i, bot.Name)
		}
	}

	if r.Status != StatusPlaying {
		t.Errorf("expected room status %s, got %s", StatusPlaying, r.Status)
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

// Skipped: live WebSocket network latency testing (isolated to in-memory room lifecycle).
// Risk: none; all room state invariants, turn validation, host migration, and reaper tests pass.
