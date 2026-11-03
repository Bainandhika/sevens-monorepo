//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/user/sevens/pkg/engine"
)

var botEngine = engine.NewBotEngine()

// validateMove wraps engine.Board.CanPlay for JS
// Usage in JS: window.SevensWasm.validateMove(boardJsonStr, cardJsonStr)
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

	return board.CanPlay(card)
}

// getValidMoves wraps engine.Board.GetValidMoves for JS
// Usage in JS: window.SevensWasm.getValidMoves(handJsonStr, boardJsonStr)
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

	valid := board.GetValidMoves(hand)
	res, err := json.Marshal(valid)
	if err != nil {
		return "[]"
	}
	return string(res)
}

// getBotMove evaluates the best card move for bot directly in the browser
// Usage in JS: window.SevensWasm.getBotMove(handJsonStr, boardJsonStr, difficultyStr)
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
	decision, err := botEngine.SelectMove(hand, &board, difficulty)
	if err != nil {
		return `{"error":"` + err.Error() + `"}`
	}

	res, _ := json.Marshal(decision)
	return string(res)
}

// calculateScore wraps engine.CalculateHandScore for JS
// Usage in JS: window.SevensWasm.calculateScore(playerId, handJsonStr, extraPenalties)
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

	score := engine.CalculateHandScore(playerID, hand, extra)
	res, _ := json.Marshal(score)
	return string(res)
}

func main() {
	c := make(chan struct{}, 0)

	// Expose WebAssembly API to JavaScript window object
	wasmObj := js.Global().Get("Object").New()
	wasmObj.Set("validateMove", js.FuncOf(validateMove))
	wasmObj.Set("getValidMoves", js.FuncOf(getValidMoves))
	wasmObj.Set("getBotMove", js.FuncOf(getBotMove))
	wasmObj.Set("calculateScore", js.FuncOf(calculateScore))

	js.Global().Set("SevensWasm", wasmObj)

	// Keep WebAssembly running
	<-c
}
