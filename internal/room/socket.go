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

func (h *SocketHandler) HandleUpgrade(w http.ResponseWriter, r *http.Request) {
	_ = h.m.HandleRequest(w, r)
}

func (h *SocketHandler) setupMelodyRoutes() {
	h.m.HandleConnect(func(s *melody.Session) {
		log.Println("[WebSocket] New client connected")
	})

	h.m.HandleDisconnect(func(s *melody.Session) {
		h.handleDisconnect(s)
	})

	h.m.HandleMessage(func(s *melody.Session, msg []byte) {
		var wsMsg WSMessage
		if err := json.Unmarshal(msg, &wsMsg); err != nil {
			log.Println("[WebSocket] Invalid message JSON:", err)
			return
		}

		switch wsMsg.Type {
		case EventJoin:
			h.handleJoin(s, wsMsg.Payload)
		case EventToggleReady:
			h.handleToggleReady(s, wsMsg.Payload)
		case EventStartGame:
			h.handleStartGame(s, wsMsg.Payload)
		case EventPlayCard:
			h.handlePlayCard(s, wsMsg.Payload)
		case EventFoldCard:
			h.handleFoldCard(s, wsMsg.Payload)
		case EventPass:
			h.handlePass(s, wsMsg.Payload)
		case EventRematch:
			h.handleRematch(s, wsMsg.Payload)
		case EventLeaveRoom:
			h.handleLeaveRoom(s, wsMsg.Payload)
		case EventAddBot:
			h.handleAddBot(s, wsMsg.Payload)
		case EventPing:
			h.handlePing(s, wsMsg.Payload)
		default:
			log.Println("[WebSocket] Unknown message type:", wsMsg.Type)
		}
	})
}

func (h *SocketHandler) handleJoin(s *melody.Session, raw json.RawMessage) {
	var payload JoinPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid join payload")
		return
	}

	roomCode, err := SanitizeRoomCode(payload.RoomID)
	if err != nil {
		h.sendError(s, err.Error())
		return
	}

	sanitizedName := SanitizeNickname(payload.Name)
	room := h.manager.GetOrCreateRoom(roomCode)

	var existingPlayer *Player
	if payload.SessionToken != "" {
		existingPlayer = room.FindPlayerBySessionToken(payload.SessionToken)
	}
	if existingPlayer == nil && payload.PlayerID != "" {
		existingPlayer = room.FindPlayerByID(payload.PlayerID)
	}

	if existingPlayer != nil {
		room.CancelPlayerReconnectTimer(existingPlayer.ID)

		room.Mu.Lock()
		existingPlayer.Session = s
		existingPlayer.IsConnected = true
		existingPlayer.DisconnectedAt = nil
		sessionToken := existingPlayer.SessionToken
		playerID := existingPlayer.ID
		room.LastActivity = time.Now()
		room.Mu.Unlock()

		s.Set("roomId", room.ID)
		s.Set("playerId", playerID)
		s.Set("sessionToken", sessionToken)

		h.broadcastRoomState(room)
		return
	}

	room.Mu.Lock()
	if room.Status != StatusWaiting {
		room.Mu.Unlock()
		h.sendError(s, "game is already in progress")
		return
	}

	humanCount := 0
	for _, p := range room.Players {
		if !p.IsBot {
			humanCount++
		}
	}
	if humanCount >= MaxPlayers || len(room.Players) >= MaxPlayers {
		room.Mu.Unlock()
		h.sendError(s, "room is full")
		return
	}

	isHost := humanCount == 0
	isReady := isHost
	seatIdx := len(room.Players)
	sessionToken := payload.SessionToken
	if sessionToken == "" {
		sessionToken = payload.PlayerID
	}
	playerID := payload.PlayerID
	if playerID == "" {
		playerID = sessionToken
	}

	newPlayer := &Player{
		ID:            playerID,
		Name:          sanitizedName,
		Initials:      GenerateInitials(sanitizedName),
		AvatarColor:   GetAvatarColor(seatIdx),
		IsBot:         false,
		IsHost:        isHost,
		IsReady:       isReady,
		Hand:          make([]engine.Card, 0),
		FoldedCards:   make([]engine.Card, 0),
		PenaltyPoints: 0,
		LossesCount:   0,
		IsConnected:   true,
		Session:       s,
		SessionToken:  sessionToken,
	}

	room.Players = append(room.Players, newPlayer)
	room.LastActivity = time.Now()
	room.Mu.Unlock()

	s.Set("roomId", room.ID)
	s.Set("playerId", playerID)
	s.Set("sessionToken", sessionToken)

	h.broadcastRoomState(room)
}

func (h *SocketHandler) handleToggleReady(s *melody.Session, raw json.RawMessage) {
	var payload ToggleReadyPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid toggle_ready payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		h.sendError(s, "room not found")
		return
	}

	playerID := payload.PlayerID
	if playerID == "" {
		if val, ok := s.Get("playerId"); ok {
			playerID = val.(string)
		}
	}

	room.Mu.Lock()
	if room.Status != StatusWaiting {
		room.Mu.Unlock()
		h.sendError(s, "cannot toggle ready after game has started")
		return
	}

	var target *Player
	for _, p := range room.Players {
		if p.ID == playerID {
			target = p
			break
		}
	}

	if target == nil {
		room.Mu.Unlock()
		h.sendError(s, "player not found in room")
		return
	}

	if !target.IsHost {
		target.IsReady = !target.IsReady
	} else {
		target.IsReady = true
	}
	room.LastActivity = time.Now()
	room.Mu.Unlock()

	h.broadcastRoomState(room)
}

func (h *SocketHandler) handleStartGame(s *melody.Session, raw json.RawMessage) {
	var payload StartGamePayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid start_game payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		h.sendError(s, "room not found")
		return
	}

	playerID := payload.PlayerID
	if playerID == "" {
		if val, ok := s.Get("playerId"); ok {
			playerID = val.(string)
		}
	}

	room.Mu.Lock()
	isHost := false
	readyHumans := 0
	for _, p := range room.Players {
		if p.ID == playerID && p.IsHost {
			isHost = true
		}
		if !p.IsBot && p.IsReady {
			readyHumans++
		}
	}

	if !isHost && readyHumans < MinHumanPlayersToStart {
		room.Mu.Unlock()
		h.sendError(s, "only host or at least 2 ready human players can start the game")
		return
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	if err := room.StartMatch(false, rng); err != nil {
		room.Mu.Unlock()
		h.sendError(s, err.Error())
		return
	}
	room.Mu.Unlock()

	h.broadcastRoomState(room)
	h.scheduleBotTurnIfNeeded(room)
}

func (h *SocketHandler) handlePlayCard(s *melody.Session, raw json.RawMessage) {
	var payload PlayCardPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid play_card payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		h.sendError(s, "room not found")
		return
	}

	playerID := payload.PlayerID
	if playerID == "" {
		if val, ok := s.Get("playerId"); ok {
			playerID = val.(string)
		}
	}

	room.Mu.Lock()
	err := room.ProcessPlayCard(playerID, payload.Card)
	room.Mu.Unlock()

	if err != nil {
		h.sendError(s, err.Error())
		return
	}

	h.broadcastRoomState(room)
	h.scheduleBotTurnIfNeeded(room)
}

func (h *SocketHandler) handleFoldCard(s *melody.Session, raw json.RawMessage) {
	var payload FoldCardPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid fold_card payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		h.sendError(s, "room not found")
		return
	}

	playerID := payload.PlayerID
	if playerID == "" {
		if val, ok := s.Get("playerId"); ok {
			playerID = val.(string)
		}
	}

	room.Mu.Lock()
	err := room.ProcessFoldCard(playerID, payload.Card)
	room.Mu.Unlock()

	if err != nil {
		h.sendError(s, err.Error())
		return
	}

	h.broadcastRoomState(room)
	h.scheduleBotTurnIfNeeded(room)
}

func (h *SocketHandler) handlePass(s *melody.Session, raw json.RawMessage) {
	var payload PassPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid pass payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		return
	}

	playerID := payload.PlayerID
	if playerID == "" {
		if val, ok := s.Get("playerId"); ok {
			playerID = val.(string)
		}
	}

	room.Mu.Lock()
	if room.Status != StatusPlaying || room.CurrentTurn != playerID {
		room.Mu.Unlock()
		return
	}

	var player *Player
	for _, p := range room.Players {
		if p.ID == playerID {
			player = p
			break
		}
	}
	if player == nil {
		room.Mu.Unlock()
		h.sendError(s, "player not found in room")
		return
	}

	validMoves := room.Board.GetValidMovesWithAceMode(player.Hand, room.AceMode)
	if len(validMoves) > 0 {
		room.Mu.Unlock()
		h.sendError(s, "cannot pass when valid moves exist")
		return
	}

	safestFold := engine.SelectSafestFoldCard(player.Hand, room.AceMode)
	err := room.ProcessFoldCard(playerID, safestFold)
	room.Mu.Unlock()

	if err != nil {
		h.sendError(s, err.Error())
		return
	}

	h.broadcastRoomState(room)
	h.scheduleBotTurnIfNeeded(room)
}

func (h *SocketHandler) handleRematch(s *melody.Session, raw json.RawMessage) {
	var payload RematchPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid rematch payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		h.sendError(s, "room not found")
		return
	}

	room.Mu.Lock()
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	if err := room.StartMatch(true, rng); err != nil {
		room.Mu.Unlock()
		h.sendError(s, err.Error())
		return
	}
	room.Mu.Unlock()

	h.broadcastRoomState(room)
	h.scheduleBotTurnIfNeeded(room)
}

func (h *SocketHandler) handleLeaveRoom(s *melody.Session, raw json.RawMessage) {
	s.Set("manualLeave", true)

	var payload LeaveRoomPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	roomID := payload.RoomID
	if roomID == "" {
		if val, ok := s.Get("roomId"); ok {
			roomID = val.(string)
		}
	}
	playerID := payload.PlayerID
	if playerID == "" {
		if val, ok := s.Get("playerId"); ok {
			playerID = val.(string)
		}
	}

	room, exists := h.manager.GetRoom(roomID)
	if !exists {
		return
	}

	room.Mu.Lock()
	for _, p := range room.Players {
		if p.ID == playerID && p.ReconnectTimer != nil {
			p.ReconnectTimer.Stop()
			p.ReconnectTimer = nil
		}
	}

	if room.Status == StatusPlaying {
		for _, p := range room.Players {
			if p.ID == playerID {
				p.IsBot = true
				p.BotLevel = engine.DifficultyHard
				p.Name = "Bot (Hard)"
				p.Initials = "BH"
				p.IsConnected = true
				p.Session = nil
				break
			}
		}
		room.LastActivity = time.Now()
		room.Mu.Unlock()
		room.MigrateHost()

		if !room.HasActiveHumans() {
			h.manager.DeleteRoom(room.ID)
		} else {
			h.broadcastRoomState(room)
			h.scheduleBotTurnIfNeeded(room)
		}
		return
	}

	newPlayers := make([]*Player, 0, len(room.Players))
	for _, p := range room.Players {
		if p.ID != playerID {
			newPlayers = append(newPlayers, p)
		}
	}
	room.Players = newPlayers
	room.LastActivity = time.Now()
	room.Mu.Unlock()
	room.MigrateHost()

	if !room.HasActiveHumans() {
		h.manager.DeleteRoom(room.ID)
	} else {
		h.broadcastRoomState(room)
	}
}

func (h *SocketHandler) handleAddBot(s *melody.Session, raw json.RawMessage) {
	var payload AddBotPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		h.sendError(s, "invalid add_bot payload")
		return
	}

	room, exists := h.manager.GetRoom(payload.RoomID)
	if !exists {
		h.sendError(s, "room not found")
		return
	}

	room.Mu.Lock()
	if room.Status != StatusWaiting {
		room.Mu.Unlock()
		h.sendError(s, "cannot add bot while game is in progress")
		return
	}
	if len(room.Players) >= MaxPlayers {
		room.Mu.Unlock()
		h.sendError(s, "room is full")
		return
	}

	diff := payload.Difficulty
	if diff == "" {
		diff = engine.DifficultyHard
	}

	seatIdx := len(room.Players)
	botIDs := []string{"bot-1", "bot-2", "bot-3", "bot-4"}
	botID := botIDs[seatIdx]
	botName := "Bot (" + string(diff) + ")"
	botPlayer := &Player{
		ID:            botID,
		Name:          botName,
		Initials:      GenerateInitials(botName),
		AvatarColor:   GetAvatarColor(seatIdx),
		IsBot:         true,
		BotLevel:      diff,
		IsHost:        false,
		IsReady:       true,
		IsConnected:   true,
		Hand:          make([]engine.Card, 0),
		FoldedCards:   make([]engine.Card, 0),
		PenaltyPoints: 0,
		LossesCount:   0,
	}

	room.Players = append(room.Players, botPlayer)
	room.LastActivity = time.Now()
	room.Mu.Unlock()

	h.broadcastRoomState(room)
}

func (h *SocketHandler) handlePing(s *melody.Session, raw json.RawMessage) {
	var payload PingPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	resp := WSResponse{
		Type: EventPong,
		Payload: PongPayload{
			Timestamp: payload.Timestamp,
		},
	}
	bytes, err := json.Marshal(resp)
	if err == nil {
		_ = s.Write(bytes)
	}
}

func (h *SocketHandler) handleDisconnect(s *melody.Session) {
	if val, ok := s.Get("manualLeave"); ok {
		if manual, okBool := val.(bool); okBool && manual {
			return
		}
	}

	roomIDVal, ok1 := s.Get("roomId")
	playerIDVal, ok2 := s.Get("playerId")
	if !ok1 || !ok2 {
		return
	}

	roomID, ok1 := roomIDVal.(string)
	playerID, ok2 := playerIDVal.(string)
	if !ok1 || !ok2 {
		return
	}

	room, exists := h.manager.GetRoom(roomID)
	if !exists {
		return
	}

	room.Mu.Lock()
	var player *Player
	for _, p := range room.Players {
		if p.ID == playerID {
			player = p
			break
		}
	}

	if player == nil || player.IsBot {
		room.Mu.Unlock()
		return
	}

	if player.Session != nil && player.Session != s {
		room.Mu.Unlock()
		return
	}

	player.IsConnected = false
	player.Session = nil
	now := time.Now()
	player.DisconnectedAt = &now

	if player.ReconnectTimer != nil {
		player.ReconnectTimer.Stop()
		player.ReconnectTimer = nil
	}

	player.ReconnectTimer = time.AfterFunc(ReconnectGracePeriod, func() {
		room.Mu.Lock()
		var p *Player
		for _, pl := range room.Players {
			if pl.ID == playerID {
				p = pl
				break
			}
		}

		if p == nil || p.IsConnected {
			room.Mu.Unlock()
			return
		}

		p.ReconnectTimer = nil

		if room.Status == StatusPlaying {
			p.IsBot = true
			p.BotLevel = engine.DifficultyHard
			p.Name = "Bot (Hard)"
			p.Initials = "BH"
			p.IsConnected = true
			isCurrentTurn := room.CurrentTurn == p.ID
			room.LastActivity = time.Now()
			room.Mu.Unlock()

			room.MigrateHost()
			h.broadcastRoomState(room)

			if isCurrentTurn {
				h.scheduleBotTurnIfNeeded(room)
			}
			return
		}

		newPlayers := make([]*Player, 0, len(room.Players))
		for _, pl := range room.Players {
			if pl.ID != playerID {
				newPlayers = append(newPlayers, pl)
			}
		}
		room.Players = newPlayers
		room.LastActivity = time.Now()
		room.Mu.Unlock()

		room.MigrateHost()
		if !room.HasActiveHumans() {
			h.manager.DeleteRoom(room.ID)
		} else {
			h.broadcastRoomState(room)
		}
	})

	room.LastActivity = time.Now()
	room.Mu.Unlock()

	room.MigrateHost()
	h.broadcastRoomState(room)
}

func (h *SocketHandler) scheduleBotTurnIfNeeded(room *Room) {
	room.Mu.RLock()
	if room.Status != StatusPlaying {
		room.Mu.RUnlock()
		return
	}

	var currentBot *Player
	for _, p := range room.Players {
		if p.ID == room.CurrentTurn && p.IsBot {
			currentBot = p
			break
		}
	}
	room.Mu.RUnlock()

	if currentBot == nil {
		return
	}

	targetPlayerID := currentBot.ID
	go func() {
		time.Sleep(BotTurnDelay)

		room.Mu.Lock()
		if room.Status != StatusPlaying || room.CurrentTurn != targetPlayerID {
			room.Mu.Unlock()
			return
		}

		var bot *Player
		for _, p := range room.Players {
			if p.ID == targetPlayerID && p.IsBot {
				bot = p
				break
			}
		}
		if bot == nil {
			room.Mu.Unlock()
			return
		}

		difficulty := bot.BotLevel
		if difficulty == "" {
			difficulty = engine.DifficultyHard
		}

		decision, err := h.botEng.SelectMoveWithAceMode(bot.Hand, room.Board, difficulty, room.AceMode)
		if err != nil {
			room.Mu.Unlock()
			log.Printf("[Bot] SelectMove error for %s: %v", targetPlayerID, err)
			return
		}

		if !decision.IsPass && decision.Card != nil {
			if err := room.ProcessPlayCard(targetPlayerID, *decision.Card); err != nil {
				log.Printf("[Bot] ProcessPlayCard error for %s: %v", targetPlayerID, err)
			}
		} else {
			var cardToFold engine.Card
			if decision.FoldCard != nil {
				cardToFold = *decision.FoldCard
			} else {
				cardToFold = engine.SelectSafestFoldCard(bot.Hand, room.AceMode)
			}
			if err := room.ProcessFoldCard(targetPlayerID, cardToFold); err != nil {
				log.Printf("[Bot] ProcessFoldCard error for %s: %v", targetPlayerID, err)
			}
		}
		room.Mu.Unlock()

		h.broadcastRoomState(room)
		h.scheduleBotTurnIfNeeded(room)
	}()
}

func (h *SocketHandler) broadcastRoomState(room *Room) {
	room.Mu.RLock()
	resp := WSResponse{
		Type:    EventRoomState,
		Payload: room,
	}
	stateBytes, err := json.Marshal(resp)
	room.Mu.RUnlock()

	if err != nil {
		log.Println("[WebSocket] Error marshaling room state:", err)
		return
	}

	_ = h.m.BroadcastFilter(stateBytes, func(q *melody.Session) bool {
		val, exists := q.Get("roomId")
		return exists && val == room.ID
	})
}

func (h *SocketHandler) sendError(s *melody.Session, message string) {
	resp := WSResponse{
		Type: EventError,
		Payload: ErrorPayload{
			Message: message,
		},
	}
	bytes, err := json.Marshal(resp)
	if err == nil {
		_ = s.Write(bytes)
	}
}
