package room

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/olahol/melody"
	"github.com/user/sevens/pkg/engine"
)

type SocketHandler struct {
	m       *melody.Melody
	manager *Manager
	botEng  *engine.BotEngine
	mu      sync.Mutex
}

func NewSocketHandler(m *melody.Melody, manager *Manager) *SocketHandler {
	handler := &SocketHandler{
		m:       m,
		manager: manager,
		botEng:  engine.NewBotEngine(),
	}
	handler.setupMelodyRoutes()
	return handler
}

// WSMessage represents incoming and outgoing WebSocket payloads.
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type JoinPayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId"`
	Name     string `json:"name"`
}

type PlayCardPayload struct {
	RoomID   string      `json:"roomId"`
	PlayerID string      `json:"playerId"`
	Card     engine.Card `json:"card"`
}

type PassPayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId"`
}

type AddBotPayload struct {
	RoomID     string               `json:"roomId"`
	Difficulty engine.BotDifficulty `json:"difficulty"`
}

func (h *SocketHandler) HandleUpgrade(w http.ResponseWriter, r *http.Request) {
	_ = h.m.HandleRequest(w, r)
}

func (h *SocketHandler) setupMelodyRoutes() {
	h.m.HandleConnect(func(s *melody.Session) {
		log.Println("[WebSocket] New client connected")
	})

	h.m.HandleDisconnect(func(s *melody.Session) {
		log.Println("[WebSocket] Client disconnected")
		roomID, exists := s.Get("roomId")
		if !exists {
			return
		}
		playerID, _ := s.Get("playerId")
		log.Printf("[WebSocket] Player %v left room %v", playerID, roomID)
	})

	h.m.HandleMessage(func(s *melody.Session, msg []byte) {
		var wsMsg WSMessage
		if err := json.Unmarshal(msg, &wsMsg); err != nil {
			log.Println("[WebSocket] Invalid message JSON:", err)
			return
		}

		switch wsMsg.Type {
		case "join":
			h.handleJoin(s, wsMsg.Payload)
		case "play_card":
			h.handlePlayCard(s, wsMsg.Payload)
		case "pass":
			h.handlePass(s, wsMsg.Payload)
		case "add_bot":
			h.handleAddBot(s, wsMsg.Payload)
		case "start_game":
			h.handleStartGame(s, wsMsg.Payload)
		}
	})
}

func (h *SocketHandler) handleJoin(s *melody.Session, raw json.RawMessage) {
	var payload JoinPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	room := h.manager.GetOrCreateRoom(payload.RoomID)
	room.Mu.Lock()
	defer room.Mu.Unlock()

	s.Set("roomId", payload.RoomID)
	s.Set("playerId", payload.PlayerID)

	player := &Player{
		ID:      payload.PlayerID,
		Name:    payload.Name,
		Session: s,
		Hand:    make([]engine.Card, 0),
		IsReady: true,
	}

	room.Players = append(room.Players, player)
	room.UpdateActivity()

	h.broadcastRoomState(room)
}

func (h *SocketHandler) handlePlayCard(s *melody.Session, raw json.RawMessage) {
	var payload PlayCardPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		return
	}

	room.Mu.Lock()
	defer room.Mu.Unlock()

	if room.Status != StatusPlaying || room.CurrentTurn != payload.PlayerID {
		return
	}

	if err := room.Board.PlayCard(payload.Card); err != nil {
		return
	}

	// Remove card from player's hand
	for _, p := range room.Players {
		if p.ID == payload.PlayerID {
			newHand := make([]engine.Card, 0)
			for _, c := range p.Hand {
				if !(c.Suit == payload.Card.Suit && c.Rank == payload.Card.Rank) {
					newHand = append(newHand, c)
				}
			}
			p.Hand = newHand

			// Win condition check
			if len(p.Hand) == 0 {
				room.Status = StatusFinished
				h.calculateFinalScores(room)
				h.broadcastRoomState(room)
				return
			}
			break
		}
	}

	h.advanceTurn(room)
	room.UpdateActivity()
	h.broadcastRoomState(room)
}

func (h *SocketHandler) handlePass(s *melody.Session, raw json.RawMessage) {
	var payload PassPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		return
	}

	room.Mu.Lock()
	defer room.Mu.Unlock()

	if room.Status != StatusPlaying || room.CurrentTurn != payload.PlayerID {
		return
	}

	// Advance turn to next player
	h.advanceTurn(room)
	room.UpdateActivity()
	h.broadcastRoomState(room)
}

func (h *SocketHandler) handleAddBot(s *melody.Session, raw json.RawMessage) {
	var payload AddBotPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		return
	}

	room.Mu.Lock()
	defer room.Mu.Unlock()

	botID := "bot-" + time.Now().Format("150405")
	botPlayer := &Player{
		ID:       botID,
		Name:     "AI (" + string(payload.Difficulty) + ")",
		IsBot:    true,
		BotLevel: payload.Difficulty,
		Hand:     make([]engine.Card, 0),
		IsReady:  true,
	}

	room.Players = append(room.Players, botPlayer)
	room.UpdateActivity()
	h.broadcastRoomState(room)
}

func (h *SocketHandler) handleStartGame(s *melody.Session, raw json.RawMessage) {
	type StartPayload struct {
		RoomID string `json:"roomId"`
	}
	var payload StartPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists || len(room.Players) < 2 {
		return
	}

	room.Mu.Lock()
	defer room.Mu.Unlock()

	// Deal 52-card deck
	deck := make([]engine.Card, 0, 52)
	for _, suit := range engine.AllSuits {
		for r := 1; r <= 13; r++ {
			deck = append(deck, engine.Card{Suit: suit, Rank: r})
		}
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	rng.Shuffle(len(deck), func(i, j int) { deck[i], deck[j] = deck[j], deck[i] })

	// Deal cards to players
	for i, card := range deck {
		pIdx := i % len(room.Players)
		room.Players[pIdx].Hand = append(room.Players[pIdx].Hand, card)
	}

	room.Board = engine.NewBoard()
	room.Status = StatusPlaying
	room.CurrentTurn = room.Players[0].ID
	room.UpdateActivity()

	h.broadcastRoomState(room)
}

func (h *SocketHandler) advanceTurn(room *Room) {
	for i, p := range room.Players {
		if p.ID == room.CurrentTurn {
			nextIdx := (i + 1) % len(room.Players)
			room.CurrentTurn = room.Players[nextIdx].ID
			break
		}
	}
}

func (h *SocketHandler) calculateFinalScores(room *Room) {
	hands := make(map[string][]engine.Card)
	penalties := make(map[string]int)
	for _, p := range room.Players {
		hands[p.ID] = p.Hand
		penalties[p.ID] = p.Penalties
	}
	room.Scores = engine.CalculateGameScores(hands, penalties)
}

func (h *SocketHandler) broadcastRoomState(room *Room) {
	stateBytes, err := json.Marshal(map[string]interface{}{
		"type": "room_state",
		"payload": room,
	})
	if err != nil {
		return
	}

	_ = h.m.BroadcastFilter(stateBytes, func(q *melody.Session) bool {
		val, exists := q.Get("roomId")
		return exists && val == room.ID
	})
}
