package engine

import (
	"math/rand"
	"testing"
	"time"
)

// TestSevensRules tests foundational 7-opening rules and sequential upward/downward card placement per suit.
func TestSevensRules(t *testing.T) {
	board := NewBoard()

	// 1. Cannot play 6 or 8 before 7 is played
	cardSixSpades := Card{Suit: Spades, Rank: KeyRankSix}
	if board.CanPlay(cardSixSpades) {
		t.Fatalf("Expected CanPlay(6 of Spades) to be false before 7 is played")
	}
	cardEightSpades := Card{Suit: Spades, Rank: KeyRankEight}
	if board.CanPlay(cardEightSpades) {
		t.Fatalf("Expected CanPlay(8 of Spades) to be false before 7 is played")
	}

	// 2. Cannot play non-7 cards in an unopened suit
	for _, rank := range []int{1, 2, 5, 6, 8, 10, 13} {
		if board.CanPlay(Card{Suit: Hearts, Rank: rank}) {
			t.Fatalf("Expected CanPlay(%d of Hearts) to be false before 7 of Hearts is played", rank)
		}
	}

	// 3. Can play 7 of Spades to open the suit lane
	cardSevenSpades := Card{Suit: Spades, Rank: AnchorRank}
	if !board.CanPlay(cardSevenSpades) {
		t.Fatalf("Expected CanPlay(7 of Spades) to be true")
	}
	if err := board.PlayCard(cardSevenSpades); err != nil {
		t.Fatalf("Failed to play 7 of Spades: %v", err)
	}

	// Cannot play 7 of Spades again
	if board.CanPlay(cardSevenSpades) {
		t.Fatalf("Expected CanPlay(7 of Spades) to be false after 7 is already played")
	}
	if err := board.PlayCard(cardSevenSpades); err == nil {
		t.Fatalf("Expected error playing duplicate 7 of Spades")
	}

	// 4. Now 6 and 8 of Spades are valid
	if !board.CanPlay(cardSixSpades) {
		t.Fatalf("Expected CanPlay(6 of Spades) to be true after 7")
	}
	if !board.CanPlay(cardEightSpades) {
		t.Fatalf("Expected CanPlay(8 of Spades) to be true after 7")
	}

	// Cannot skip ranks: 5 and 9 are still invalid
	if board.CanPlay(Card{Suit: Spades, Rank: 5}) {
		t.Fatalf("Expected CanPlay(5 of Spades) to be false before 6 is played")
	}
	if board.CanPlay(Card{Suit: Spades, Rank: 9}) {
		t.Fatalf("Expected CanPlay(9 of Spades) to be false before 8 is played")
	}

	// 5. Sequential downward placement: 6 -> 5 -> 4 -> 3 -> 2
	if err := board.PlayCard(cardSixSpades); err != nil {
		t.Fatalf("Failed to play 6 of Spades: %v", err)
	}
	for rank := 5; rank >= 2; rank-- {
		card := Card{Suit: Spades, Rank: rank}
		if !board.CanPlay(card) {
			t.Fatalf("Expected CanPlay(%d of Spades) to be true", rank)
		}
		if err := board.PlayCard(card); err != nil {
			t.Fatalf("Failed to play %d of Spades: %v", rank, err)
		}
	}

	// 6. Sequential upward placement: 8 -> 9 -> 10 -> 11 -> 12 -> 13
	for rank := 8; rank <= 13; rank++ {
		card := Card{Suit: Spades, Rank: rank}
		if !board.CanPlay(card) {
			t.Fatalf("Expected CanPlay(%d of Spades) to be true", rank)
		}
		if err := board.PlayCard(card); err != nil {
			t.Fatalf("Failed to play %d of Spades: %v", rank, err)
		}
	}

	// 7. Playing Ace after MinPlayed reaches 2
	cardAceSpades := Card{Suit: Spades, Rank: AceRank}
	if !board.CanPlay(cardAceSpades) {
		t.Fatalf("Expected CanPlay(Ace of Spades) to be true when MinPlayed == 2")
	}
	if err := board.PlayCard(cardAceSpades); err != nil {
		t.Fatalf("Failed to play Ace of Spades: %v", err)
	}
	if !board.Suits[Spades].HasAce {
		t.Fatalf("Expected suit state HasAce to be true after playing Ace")
	}

	// Cannot play Ace again
	if board.CanPlay(cardAceSpades) {
		t.Fatalf("Expected CanPlay(Ace of Spades) to be false once HasAce is true")
	}
}

// TestAceStateMachine tests Ace Card State Machine transitions between LOCKED_NONE, LOW, and HIGH.
func TestAceStateMachine(t *testing.T) {
	// Scenario A: Ace played below 2 locks AceMode to LOW and blocks Aces above King
	t.Run("LockAceModeLow", func(t *testing.T) {
		board := NewBoard()
		// Open Spades down to 2
		_ = board.PlayCard(Card{Suit: Spades, Rank: 7})
		for r := 6; r >= 2; r-- {
			_ = board.PlayCard(Card{Suit: Spades, Rank: r})
		}

		// Open Hearts up to 13 (King)
		_ = board.PlayCard(Card{Suit: Hearts, Rank: 7})
		for r := 8; r <= 13; r++ {
			_ = board.PlayCard(Card{Suit: Hearts, Rank: r})
		}

		// In LOCKED_NONE mode: Ace is legal below 2 (Spades) AND above 13 (Hearts)
		aceSpades := Card{Suit: Spades, Rank: AceRank}
		aceHearts := Card{Suit: Hearts, Rank: AceRank}

		if !board.CanPlayWithAceMode(aceSpades, AceModeLockedNone) {
			t.Fatalf("Expected Ace of Spades to be playable below 2 in LOCKED_NONE")
		}
		if !board.CanPlayWithAceMode(aceHearts, AceModeLockedNone) {
			t.Fatalf("Expected Ace of Hearts to be playable above 13 in LOCKED_NONE")
		}

		// Play Ace of Spades below 2 under LOCKED_NONE
		lockedMode, err := board.PlayCardWithAceMode(aceSpades, AceModeLockedNone)
		if err != nil {
			t.Fatalf("Failed to play Ace of Spades: %v", err)
		}
		if lockedMode != AceModeLow {
			t.Fatalf("Expected AceMode to transition to LOW, got %s", lockedMode)
		}
		if board.Suits[Spades].MinPlayed != 1 {
			t.Fatalf("Expected MinPlayed for Spades to be 1, got %d", board.Suits[Spades].MinPlayed)
		}
		if !board.Suits[Spades].HasAce {
			t.Fatalf("Expected HasAce to be true for Spades")
		}

		// Under AceModeLow: Ace above King (Hearts) MUST now be blocked
		if board.CanPlayWithAceMode(aceHearts, AceModeLow) {
			t.Fatalf("Expected Ace of Hearts above King to be forbidden when AceMode is LOW")
		}
		_, err = board.PlayCardWithAceMode(aceHearts, AceModeLow)
		if err == nil {
			t.Fatalf("Expected error when attempting to play Ace of Hearts above King in AceModeLow")
		}

		// If Hearts is then played down to 2, Hearts Ace becomes legal under AceModeLow
		for r := 6; r >= 2; r-- {
			_ = board.PlayCard(Card{Suit: Hearts, Rank: r})
		}
		if !board.CanPlayWithAceMode(aceHearts, AceModeLow) {
			t.Fatalf("Expected Ace of Hearts to be legal below 2 under AceModeLow")
		}
	})

	// Scenario B: Ace played above King locks AceMode to HIGH and blocks Aces below 2
	t.Run("LockAceModeHigh", func(t *testing.T) {
		board := NewBoard()
		// Open Clubs up to 13
		_ = board.PlayCard(Card{Suit: Clubs, Rank: 7})
		for r := 8; r <= 13; r++ {
			_ = board.PlayCard(Card{Suit: Clubs, Rank: r})
		}

		// Open Diamonds down to 2
		_ = board.PlayCard(Card{Suit: Diamonds, Rank: 7})
		for r := 6; r >= 2; r-- {
			_ = board.PlayCard(Card{Suit: Diamonds, Rank: r})
		}

		aceClubs := Card{Suit: Clubs, Rank: AceRank}
		aceDiamonds := Card{Suit: Diamonds, Rank: AceRank}

		// Play Ace of Clubs above 13 under LOCKED_NONE
		lockedMode, err := board.PlayCardWithAceMode(aceClubs, AceModeLockedNone)
		if err != nil {
			t.Fatalf("Failed to play Ace of Clubs: %v", err)
		}
		if lockedMode != AceModeHigh {
			t.Fatalf("Expected AceMode to transition to HIGH, got %s", lockedMode)
		}
		if board.Suits[Clubs].MaxPlayed != 14 {
			t.Fatalf("Expected MaxPlayed for Clubs to be 14, got %d", board.Suits[Clubs].MaxPlayed)
		}
		if !board.Suits[Clubs].HasAce {
			t.Fatalf("Expected HasAce to be true for Clubs")
		}

		// Under AceModeHigh: Ace below 2 (Diamonds) MUST now be blocked
		if board.CanPlayWithAceMode(aceDiamonds, AceModeHigh) {
			t.Fatalf("Expected Ace of Diamonds below 2 to be forbidden when AceMode is HIGH")
		}
		_, err = board.PlayCardWithAceMode(aceDiamonds, AceModeHigh)
		if err == nil {
			t.Fatalf("Expected error when attempting to play Ace of Diamonds below 2 in AceModeHigh")
		}

		// If Diamonds is then played up to 13, Diamonds Ace becomes legal under AceModeHigh
		for r := 8; r <= 13; r++ {
			_ = board.PlayCard(Card{Suit: Diamonds, Rank: r})
		}
		if !board.CanPlayWithAceMode(aceDiamonds, AceModeHigh) {
			t.Fatalf("Expected Ace of Diamonds to be legal above 13 under AceModeHigh")
		}
	})
}

// TestDealCardsWithAutoReshuffle tests deck dealing, the 3-Sevens auto-reshuffle rule, and opener 7 extraction.
func TestDealCardsWithAutoReshuffle(t *testing.T) {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	// 1. Run 50 deal simulations to verify dealing constraints
	for sim := 0; sim < 50; sim++ {
		hands := DealCardsWithAutoReshuffle(rng)
		if len(hands) != 4 {
			t.Fatalf("Simulation %d: expected 4 hands, got %d", sim, len(hands))
		}

		totalCards := 0
		cardSet := make(map[string]bool)

		for pIdx, hand := range hands {
			if len(hand) != 13 {
				t.Fatalf("Simulation %d, player %d: expected 13 cards, got %d", sim, pIdx, len(hand))
			}
			sevensCount := 0
			for _, card := range hand {
				cardKey := card.String()
				if cardSet[cardKey] {
					t.Fatalf("Simulation %d: duplicate card %s found", sim, cardKey)
				}
				cardSet[cardKey] = true
				if card.Rank == AnchorRank {
					sevensCount++
				}
			}

			// Auto-Reshuffle rule: no player may hold >= 3 sevens
			if sevensCount >= 3 {
				t.Fatalf("Simulation %d, player %d: violated auto-reshuffle rule with %d sevens", sim, pIdx, sevensCount)
			}
			totalCards += len(hand)
		}

		if totalCards != 52 {
			t.Fatalf("Simulation %d: expected 52 total cards, got %d", sim, totalCards)
		}
	}

	// 2. Direct unit test of HasExcessSevens
	excessHands := [][]Card{
		{
			{Suit: Spades, Rank: 7},
			{Suit: Hearts, Rank: 7},
			{Suit: Clubs, Rank: 7},
			{Suit: Diamonds, Rank: 2},
		},
		{{Suit: Diamonds, Rank: 7}},
		{},
		{},
	}
	if !HasExcessSevens(excessHands) {
		t.Fatalf("Expected HasExcessSevens to return true for hand with 3 sevens")
	}

	validHands := [][]Card{
		{{Suit: Spades, Rank: 7}, {Suit: Hearts, Rank: 7}},
		{{Suit: Clubs, Rank: 7}},
		{{Suit: Diamonds, Rank: 7}},
		{},
	}
	if HasExcessSevens(validHands) {
		t.Fatalf("Expected HasExcessSevens to return false for hands with at most 2 sevens")
	}

	// 3. Test ExtractOpenerSeven
	testHands := DealCardsWithAutoReshuffle(rng)
	openerSuit, openerSeat := ExtractOpenerSeven(testHands, rng)

	if openerSeat < 0 || openerSeat > 3 {
		t.Fatalf("Expected opener seat between 0 and 3, got %d", openerSeat)
	}
	if len(testHands[openerSeat]) != 12 {
		t.Fatalf("Expected opener player's hand to have 12 cards after extraction, got %d", len(testHands[openerSeat]))
	}
	// Verify that the extracted card was indeed the 7 of openerSuit
	for _, card := range testHands[openerSeat] {
		if card.Suit == openerSuit && card.Rank == AnchorRank {
			t.Fatalf("Found 7 of openerSuit %s still in opener player's hand", openerSuit)
		}
	}
}

// TestValidateFoldAntiBohongAndAntiSabotase tests card fold rejections:
// - Rejection when valid moves exist (Anti-Bohong / Anti-Bluff);
// - Rejection when folding any Rank 7 card (7-Card Anti-Sabotage);
// - Rejection when folding a card not held in hand.
func TestValidateFoldAntiBohongAndAntiSabotase(t *testing.T) {
	board := NewBoard()
	_ = board.PlayCard(Card{Suit: Spades, Rank: 7})

	// 1. Anti-Sabotage rule: folding a 7 is strictly prohibited under any circumstance
	sabotageHand := []Card{
		{Suit: Hearts, Rank: 7},
		{Suit: Clubs, Rank: 2},
	}
	err := board.ValidateFoldCard(sabotageHand, Card{Suit: Hearts, Rank: 7}, AceModeLockedNone)
	if err == nil {
		t.Fatalf("Expected error folding Rank 7 card (7-card anti-sabotage rule), got nil")
	}

	// 2. Anti-Bohong rule: folding when a valid move exists is rejected
	handWithValidMove := []Card{
		{Suit: Spades, Rank: 6},   // Legal move on Spades lane
		{Suit: Hearts, Rank: 3},   // Not legal
	}
	err = board.ValidateFoldCard(handWithValidMove, Card{Suit: Hearts, Rank: 3}, AceModeLockedNone)
	if err == nil {
		t.Fatalf("Expected error folding card when valid move exists (anti-bohong rule), got nil")
	}

	// 3. Cannot fold a card not held in hand
	handWithoutTarget := []Card{
		{Suit: Hearts, Rank: 2},
		{Suit: Clubs, Rank: 3},
	}
	err = board.ValidateFoldCard(handWithoutTarget, Card{Suit: Diamonds, Rank: 5}, AceModeLockedNone)
	if err == nil {
		t.Fatalf("Expected error folding card not present in hand, got nil")
	}

	// 4. Legitimate fold: no valid moves and card is held in hand (non-7)
	legitFoldHand := []Card{
		{Suit: Hearts, Rank: 2},
		{Suit: Clubs, Rank: 4},
	}
	err = board.ValidateFoldCard(legitFoldHand, Card{Suit: Hearts, Rank: 2}, AceModeLockedNone)
	if err != nil {
		t.Fatalf("Expected legitimate fold to succeed, got error: %v", err)
	}
}

// TestTacticalScoreAndLeaderboard tests flat 30-pt penalty for 6 & 8, Ace scoring per AceMode,
// and final leaderboard calculation (Winner rank 1, Juru Kunci rank 4).
func TestTacticalScoreAndLeaderboard(t *testing.T) {
	// 1. Key Card flat 30-point penalty for Rank 6 and Rank 8
	sixDetail := CalculateCardPenalty(Card{Suit: Spades, Rank: 6}, AceModeLockedNone)
	if sixDetail.Points != KeyCardPenaltyPoints || !sixDetail.IsKeyCardPenalty {
		t.Fatalf("Expected flat 30 points for rank 6, got %+v", sixDetail)
	}

	eightDetail := CalculateCardPenalty(Card{Suit: Hearts, Rank: 8}, AceModeLockedNone)
	if eightDetail.Points != KeyCardPenaltyPoints || !eightDetail.IsKeyCardPenalty {
		t.Fatalf("Expected flat 30 points for rank 8, got %+v", eightDetail)
	}

	// 2. Ace penalty based on AceMode
	aceCard := Card{Suit: Clubs, Rank: AceRank}

	aceNone := CalculateCardPenalty(aceCard, AceModeLockedNone)
	if aceNone.Points != AceNonePoints || aceNone.IsAceLocked {
		t.Fatalf("Expected 0 points for Ace in LOCKED_NONE, got %+v", aceNone)
	}

	aceLow := CalculateCardPenalty(aceCard, AceModeLow)
	if aceLow.Points != AceLowPoints || !aceLow.IsAceLocked {
		t.Fatalf("Expected 1 point for Ace in LOW, got %+v", aceLow)
	}

	aceHigh := CalculateCardPenalty(aceCard, AceModeHigh)
	if aceHigh.Points != AceHighPoints || !aceHigh.IsAceLocked {
		t.Fatalf("Expected 15 points for Ace in HIGH, got %+v", aceHigh)
	}

	// 3. Nominal card penalties: 2..5, 9..10, J(11), Q(12), K(13)
	for r := 2; r <= 5; r++ {
		det := CalculateCardPenalty(Card{Suit: Diamonds, Rank: r}, AceModeLockedNone)
		if det.Points != r {
			t.Fatalf("Expected %d points for rank %d, got %d", r, r, det.Points)
		}
	}
	jackDet := CalculateCardPenalty(Card{Suit: Spades, Rank: 11}, AceModeLockedNone)
	if jackDet.Points != 11 {
		t.Fatalf("Expected 11 points for Jack, got %d", jackDet.Points)
	}
	kingDet := CalculateCardPenalty(Card{Suit: Spades, Rank: 13}, AceModeLockedNone)
	if kingDet.Points != 13 {
		t.Fatalf("Expected 13 points for King, got %d", kingDet.Points)
	}

	// 4. CalculateFinalLeaderboard ranking test
	inputs := []PlayerScoreInput{
		{
			PlayerID:   "p1",
			PlayerName: "Budi",
			SeatIndex:  0,
			FoldedCards: []Card{
				{Suit: Spades, Rank: 2}, // 2 pts
			},
		},
		{
			PlayerID:   "p2",
			PlayerName: "Dewi",
			SeatIndex:  1,
			FoldedCards: []Card{
				{Suit: Hearts, Rank: 6}, // 30 pts (key card)
				{Suit: Clubs, Rank: 8},  // 30 pts (key card)
			},
		},
		{
			PlayerID:    "p3",
			PlayerName:  "Eko",
			SeatIndex:   2,
			FoldedCards: []Card{}, // 0 pts (Winner)
		},
		{
			PlayerID:   "p4",
			PlayerName: "Fajar",
			SeatIndex:  3,
			FoldedCards: []Card{
				{Suit: Diamonds, Rank: 13}, // 13 pts
			},
		},
	}

	leaderboard := CalculateFinalLeaderboard(inputs, AceModeLow)

	// Eko (p3): 0 pts -> Rank 1 (Winner)
	p3Score := leaderboard["p3"]
	if p3Score.RankPosition != 1 || !p3Score.IsWinner || p3Score.IsJuruKunci || p3Score.TotalPenalty != 0 {
		t.Fatalf("Expected p3 to be Rank 1 Winner with 0 points, got %+v", p3Score)
	}

	// Budi (p1): 2 pts -> Rank 2
	p1Score := leaderboard["p1"]
	if p1Score.RankPosition != 2 || p1Score.TotalPenalty != 2 {
		t.Fatalf("Expected p1 to be Rank 2 with 2 points, got %+v", p1Score)
	}

	// Fajar (p4): 13 pts -> Rank 3
	p4Score := leaderboard["p4"]
	if p4Score.RankPosition != 3 || p4Score.TotalPenalty != 13 {
		t.Fatalf("Expected p4 to be Rank 3 with 13 points, got %+v", p4Score)
	}

	// Dewi (p2): 60 pts -> Rank 4 (Juru Kunci)
	p2Score := leaderboard["p2"]
	if p2Score.RankPosition != 4 || !p2Score.IsJuruKunci || p2Score.IsWinner || p2Score.TotalPenalty != 60 {
		t.Fatalf("Expected p2 to be Rank 4 Juru Kunci with 60 points, got %+v", p2Score)
	}
}

// TestBotDecisionAndSafeFold tests AI bot decision making across Easy, Medium, and Hard difficulties,
// as well as the safe fold selection logic.
func TestBotDecisionAndSafeFold(t *testing.T) {
	botEng := NewBotEngine()

	// 1. Bot card play when valid moves exist
	board := NewBoard()
	_ = board.PlayCard(Card{Suit: Spades, Rank: 7})

	handWithMoves := []Card{
		{Suit: Spades, Rank: 6},
		{Suit: Spades, Rank: 8},
		{Suit: Hearts, Rank: 2},
	}
	validMoves := board.GetValidMovesWithAceMode(handWithMoves, AceModeLockedNone)

	// Easy bot move
	easyDec, err := botEng.SelectMoveWithAceMode(handWithMoves, board, DifficultyEasy, AceModeLockedNone)
	if err != nil {
		t.Fatalf("Easy bot error: %v", err)
	}
	if easyDec.IsPass || easyDec.Card == nil || easyDec.Action != "play" {
		t.Fatalf("Expected Easy bot to play card, got %+v", easyDec)
	}
	if err := ValidateBotMove(easyDec, validMoves); err != nil {
		t.Fatalf("Easy bot chosen move is invalid: %v", err)
	}

	// Medium bot move
	medDec, err := botEng.SelectMoveWithAceMode(handWithMoves, board, DifficultyMedium, AceModeLockedNone)
	if err != nil {
		t.Fatalf("Medium bot error: %v", err)
	}
	if medDec.IsPass || medDec.Card == nil || medDec.Action != "play" {
		t.Fatalf("Expected Medium bot to play card, got %+v", medDec)
	}
	if err := ValidateBotMove(medDec, validMoves); err != nil {
		t.Fatalf("Medium bot chosen move is invalid: %v", err)
	}

	// Hard bot move
	hardDec, err := botEng.SelectMoveWithAceMode(handWithMoves, board, DifficultyHard, AceModeLockedNone)
	if err != nil {
		t.Fatalf("Hard bot error: %v", err)
	}
	if hardDec.IsPass || hardDec.Card == nil || hardDec.Action != "play" {
		t.Fatalf("Expected Hard bot to play card, got %+v", hardDec)
	}
	if err := ValidateBotMove(hardDec, validMoves); err != nil {
		t.Fatalf("Hard bot chosen move is invalid: %v", err)
	}

	// 2. Safe card folding when no valid moves exist
	handNoMoves := []Card{
		{Suit: Hearts, Rank: 6},   // Key card: 30 pts
		{Suit: Hearts, Rank: 8},   // Key card: 30 pts
		{Suit: Diamonds, Rank: 3}, // Low card: 3 pts
	}

	// Hard bot must strictly avoid folding 6 or 8 when a non-key card (3) is available
	foldCard, err := botEng.SelectFoldCard(handNoMoves, DifficultyHard, AceModeLockedNone)
	if err != nil {
		t.Fatalf("SelectFoldCard error: %v", err)
	}
	if foldCard.Rank == 6 || foldCard.Rank == 8 {
		t.Fatalf("Hard bot folded a key card (rank %d) when a safer rank 3 was available", foldCard.Rank)
	}
	if foldCard.Rank != 3 {
		t.Fatalf("Expected Hard bot to fold rank 3, got rank %d", foldCard.Rank)
	}

	// Medium bot also filters out 6 and 8 and picks lowest nominal rank
	medFoldCard, err := botEng.SelectFoldCard(handNoMoves, DifficultyMedium, AceModeLockedNone)
	if err != nil {
		t.Fatalf("Medium SelectFoldCard error: %v", err)
	}
	if medFoldCard.Rank != 3 {
		t.Fatalf("Expected Medium bot to fold rank 3, got rank %d", medFoldCard.Rank)
	}

	// 3. Anti-Sabotage check in SelectFoldCard: hand with only 7s must return an error
	onlySevensHand := []Card{
		{Suit: Hearts, Rank: 7},
		{Suit: Diamonds, Rank: 7},
	}
	_, err = botEng.SelectFoldCard(onlySevensHand, DifficultyHard, AceModeLockedNone)
	if err == nil {
		t.Fatalf("Expected error when attempting to fold from hand containing only 7s")
	}

	// 4. SelectSafestFoldCard helper
	safest := SelectSafestFoldCard(handNoMoves, AceModeLockedNone)
	if safest.Rank != 3 {
		t.Fatalf("Expected SelectSafestFoldCard to pick rank 3, got rank %d", safest.Rank)
	}

	// 5. SelectMoveWithAceMode when no moves exist returns IsPass=true and Action="fold"
	foldDec, err := botEng.SelectMoveWithAceMode(handNoMoves, board, DifficultyHard, AceModeLockedNone)
	if err != nil {
		t.Fatalf("Unexpected error for fold decision: %v", err)
	}
	if !foldDec.IsPass || foldDec.Action != "fold" || foldDec.FoldCard == nil {
		t.Fatalf("Expected IsPass=true and Action='fold', got %+v", foldDec)
	}
	if foldDec.FoldCard.Rank != 3 {
		t.Fatalf("Expected fold card rank 3, got %d", foldDec.FoldCard.Rank)
	}
}

// TestLegacyScoreCalculation preserves verification for legacy CalculateHandScore and CalculateGameScores.
func TestLegacyScoreCalculation(t *testing.T) {
	hand := []Card{
		{Suit: Hearts, Rank: 1},    // Ace -> 30 penalty points
		{Suit: Clubs, Rank: 7},     // 7 -> 30 penalty points
		{Suit: Spades, Rank: 10},   // 10 points
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
	if score.TotalMinus != 80 {
		t.Errorf("Expected total minus 80, got %d", score.TotalMinus)
	}
}
