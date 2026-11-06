//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/user/sevens/pkg/engine"
)

var botEngine = engine.NewBotEngine()

// validateMove wraps engine.Board.CanPlayWithAceMode for JS.
// Usage in JS: window.SevensWasm.validateMove(boardJsonStr, cardJsonStr, [aceModeStr])
func validateMove(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return false
	}

	boardStr := args[0].String()
	cardStr := args[1].String()

	var board engine.Board
	if err := json.Unmarshal([]byte(boardStr), &board); err != nil {
		return false
	}

	var card engine.Card
	if err := json.Unmarshal([]byte(cardStr), &card); err != nil {
		return false
	}

	aceMode := engine.AceModeLockedNone
	if len(args) >= 3 && args[2].String() != "" {
		aceMode = engine.AceMode(args[2].String())
	}

	return board.CanPlayWithAceMode(card, aceMode)
}

// getValidMoves wraps engine.Board.GetValidMovesWithAceMode for JS.
// Usage in JS: window.SevensWasm.getValidMoves(handJsonStr, boardJsonStr, [aceModeStr])
func getValidMoves(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return "[]"
	}

	var hand []engine.Card
	if err := json.Unmarshal([]byte(args[0].String()), &hand); err != nil {
		return "[]"
	}

	var board engine.Board
	if err := json.Unmarshal([]byte(args[1].String()), &board); err != nil {
		return "[]"
	}

	aceMode := engine.AceModeLockedNone
	if len(args) >= 3 && args[2].String() != "" {
		aceMode = engine.AceMode(args[2].String())
	}

	valid := board.GetValidMovesWithAceMode(hand, aceMode)
	res, err := json.Marshal(valid)
	if err != nil {
		return "[]"
	}
	return string(res)
}

// getBotMove evaluates the best card move or fold for bot directly in the browser.
// Usage in JS: window.SevensWasm.getBotMove(handJsonStr, boardJsonStr, difficultyStr, [aceModeStr])
func getBotMove(this js.Value, args []js.Value) any {
	if len(args) < 3 {
		return `{"error":"missing arguments"}`
	}

	var hand []engine.Card
	if err := json.Unmarshal([]byte(args[0].String()), &hand); err != nil {
		return `{"error":"invalid hand json"}`
	}

	var board engine.Board
	if err := json.Unmarshal([]byte(args[1].String()), &board); err != nil {
		return `{"error":"invalid board json"}`
	}

	difficulty := engine.BotDifficulty(args[2].String())
	aceMode := engine.AceModeLockedNone
	if len(args) >= 4 && args[3].String() != "" {
		aceMode = engine.AceMode(args[3].String())
	}

	decision, err := botEngine.SelectMoveWithAceMode(hand, &board, difficulty, aceMode)
	if err != nil {
		return `{"error":"` + err.Error() + `"}`
	}

	res, err := json.Marshal(decision)
	if err != nil {
		return `{"error":"failed to marshal decision"}`
	}
	return string(res)
}

// calculateScore wraps engine scoring for JS.
// Usage in JS: window.SevensWasm.calculateScore(playerId, handJsonStr, extraPenalties, [aceModeStr])
func calculateScore(this js.Value, args []js.Value) any {
	if len(args) < 2 {
		return "{}"
	}

	playerID := args[0].String()
	var hand []engine.Card
	if err := json.Unmarshal([]byte(args[1].String()), &hand); err != nil {
		return "{}"
	}

	extra := 0
	if len(args) >= 3 {
		extra = args[2].Int()
	}

	var score engine.PlayerScoreDetail
	if len(args) >= 4 && args[3].String() != "" {
		aceMode := engine.AceMode(args[3].String())
		score = engine.CalculatePlayerFoldedScore(playerID, playerID, hand, aceMode)
		score.OtherPenalties = extra
		score.TotalPenalty += extra
	} else {
		score = engine.CalculateHandScore(playerID, hand, extra)
	}

	res, err := json.Marshal(score)
	if err != nil {
		return "{}"
	}
	return string(res)
}

// selectFoldCard evaluates the safest card to fold when no valid moves exist.
// Usage in JS: window.SevensWasm.selectFoldCard(handJsonStr, [difficultyStr], [aceModeStr])
func selectFoldCard(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return "{}"
	}

	var hand []engine.Card
	if err := json.Unmarshal([]byte(args[0].String()), &hand); err != nil {
		return "{}"
	}

	difficulty := engine.DifficultyHard
	aceMode := engine.AceModeLockedNone

	if len(args) >= 2 {
		val := args[1].String()
		switch val {
		case string(engine.DifficultyEasy), string(engine.DifficultyMedium), string(engine.DifficultyHard):
			difficulty = engine.BotDifficulty(val)
		case string(engine.AceModeLockedNone), string(engine.AceModeLow), string(engine.AceModeHigh):
			aceMode = engine.AceMode(val)
		}
	}

	if len(args) >= 3 {
		val := args[2].String()
		switch val {
		case string(engine.AceModeLockedNone), string(engine.AceModeLow), string(engine.AceModeHigh):
			aceMode = engine.AceMode(val)
		case string(engine.DifficultyEasy), string(engine.DifficultyMedium), string(engine.DifficultyHard):
			difficulty = engine.BotDifficulty(val)
		}
	}

	card, err := botEngine.SelectFoldCard(hand, difficulty, aceMode)
	if err != nil {
		return "{}"
	}

	res, err := json.Marshal(card)
	if err != nil {
		return "{}"
	}
	return string(res)
}

func main() {
	// Expose WebAssembly API to JavaScript window object
	wasmObj := js.Global().Get("Object").New()
	wasmObj.Set("validateMove", js.FuncOf(validateMove))
	wasmObj.Set("getValidMoves", js.FuncOf(getValidMoves))
	wasmObj.Set("getBotMove", js.FuncOf(getBotMove))
	wasmObj.Set("calculateScore", js.FuncOf(calculateScore))
	wasmObj.Set("selectFoldCard", js.FuncOf(selectFoldCard))

	js.Global().Set("SevensWasm", wasmObj)

	// Keep WebAssembly running indefinitely
	<-make(chan struct{})
}

// Skipped: Compiling game.wasm binary to frontend/public/game.wasm (out of scope for step 6).
// Risk: Client must pass valid JSON strings to Wasm bridge functions to avoid parse fallbacks.

