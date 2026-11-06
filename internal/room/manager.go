package room

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/olahol/melody"
	"github.com/user/sevens/pkg/engine"
)

// Player represents a participant in a game room with client SSOT alignment.
type Player struct {
	ID             string               `json:"id"`
	Name           string               `json:"name"`
	Initials       string               `json:"initials"`
	AvatarColor    string               `json:"avatarColor"`
	IsBot          bool                 `json:"isBot"`
	BotLevel       engine.BotDifficulty `json:"botLevel,omitempty"`
	IsHost         bool                 `json:"isHost"`
	IsReady        bool                 `json:"isReady"`
	Hand           []engine.Card        `json:"hand"`
	FoldedCards    []engine.Card        `json:"foldedCards"`
	PenaltyPoints  int                  `json:"penaltyPoints"`
	LossesCount    int                  `json:"lossesCount"`
	IsConnected    bool                 `json:"isConnected"`
	Session        *melody.Session      `json:"-"`
	SessionToken   string               `json:"-"`
	DisconnectedAt *time.Time           `json:"-"`
	ReconnectTimer *time.Timer          `json:"-"`
}

// Room represents an active multiplayer match instance protected by sync.RWMutex.
type Room struct {
	ID           string                              `json:"id"`
	Mode         string                              `json:"mode"`
	Status       RoomStatus                          `json:"status"`
	RoundNumber  int                                 `json:"roundNumber"`
	TurnNumber   int                                 `json:"turnNumber"`
	CurrentTurn  string                              `json:"currentTurn"`
	AceMode      engine.AceMode                      `json:"aceMode"`
	OpenerSuit   engine.Suit                         `json:"openerSuit"`
	Board        *engine.Board                       `json:"board"`
	Players      []*Player                           `json:"players"`
	Scores       map[string]engine.PlayerScoreDetail `json:"scores,omitempty"`
	LastActivity time.Time                           `json:"lastActivity"`
	LastFoldTurn map[string]int                      `json:"-"`
	Mu           sync.RWMutex                        `json:"-"`
}

// Manager manages in-memory game rooms and background GC (Room Reaper).
type Manager struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

// NewManager initializes a new room manager.
func NewManager() *Manager {
	return &Manager{
		rooms: make(map[string]*Room),
	}
}

// GetRoom retrieves a room by ID.
func (m *Manager) GetRoom(roomID string) (*Room, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	room, exists := m.rooms[roomID]
	return room, exists
}

// GetOrCreateRoom returns an existing room or creates a new one.
func (m *Manager) GetOrCreateRoom(roomID string) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	if room, exists := m.rooms[roomID]; exists {
		return room
	}

	newRoom := &Room{
		ID:           roomID,
		Status:       StatusWaiting,
		AceMode:      engine.AceModeLockedNone,
		Board:        engine.NewBoard(),
		Players:      make([]*Player, 0),
		LastFoldTurn: make(map[string]int),
		LastActivity: time.Now(),
	}
	m.rooms[roomID] = newRoom
	return newRoom
}

// DeleteRoom removes a room from memory.
func (m *Manager) DeleteRoom(roomID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.rooms, roomID)
}

// StartReaper runs a background garbage collector for stale or empty rooms.
func (m *Manager) StartReaper(ctx context.Context, interval time.Duration, maxIdle time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				log.Println("[Room Reaper] Stopping room cleaner...")
				return
			case <-ticker.C:
				m.reapStaleRooms(maxIdle)
			}
		}
	}()
}

// reapStaleRooms removes rooms that are idle past maxIdle or have no active humans and no sessions awaiting reconnect.
func (m *Manager) reapStaleRooms(maxIdle time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for id, r := range m.rooms {
		r.Mu.RLock()
		lastActivity := r.LastActivity
		isIdle := now.Sub(lastActivity) > maxIdle
		hasConnectedHuman := false
		hasAwaitingReconnect := false
		for _, p := range r.Players {
			if !p.IsBot {
				if p.IsConnected {
					hasConnectedHuman = true
				}
				if p.ReconnectTimer != nil {
					hasAwaitingReconnect = true
				}
			}
		}
		r.Mu.RUnlock()

		if isIdle || (!hasConnectedHuman && !hasAwaitingReconnect) {
			log.Printf("[Room Reaper] Evicting room: %s (idle since %s)", id, lastActivity.Format(time.RFC3339))
			delete(m.rooms, id)
		}
	}
}

// UpdateActivity updates the last active timestamp for Reaper tracking.
func (r *Room) UpdateActivity() {
	r.Mu.Lock()
	defer r.Mu.Unlock()
	r.LastActivity = time.Now()
}

// FindPlayerByID returns the player matching the given player ID, or nil if not found.
func (r *Room) FindPlayerByID(playerID string) *Player {
	r.Mu.RLock()
	defer r.Mu.RUnlock()

	for _, p := range r.Players {
		if p.ID == playerID {
			return p
		}
	}
	return nil
}

// FindPlayerBySessionToken returns the player matching the session token, or nil if not found.
func (r *Room) FindPlayerBySessionToken(token string) *Player {
	r.Mu.RLock()
	defer r.Mu.RUnlock()

	if token == "" {
		return nil
	}
	for _, p := range r.Players {
		if p.SessionToken == token {
			return p
		}
	}
	return nil
}

// HumanPlayersCount returns the total number of human players in the room.
func (r *Room) HumanPlayersCount() int {
	r.Mu.RLock()
	defer r.Mu.RUnlock()

	count := 0
	for _, p := range r.Players {
		if !p.IsBot {
			count++
		}
	}
	return count
}

// ReadyHumanCount returns the number of ready human players in the room.
func (r *Room) ReadyHumanCount() int {
	r.Mu.RLock()
	defer r.Mu.RUnlock()

	count := 0
	for _, p := range r.Players {
		if !p.IsBot && p.IsReady {
			count++
		}
	}
	return count
}

// HasActiveHumans checks if there is at least one connected human player in the room.
func (r *Room) HasActiveHumans() bool {
	r.Mu.RLock()
	defer r.Mu.RUnlock()

	for _, p := range r.Players {
		if !p.IsBot && p.IsConnected {
			return true
		}
	}
	return false
}

// CancelPlayerReconnectTimer stops and clears any active reconnect timer for the player.
func (r *Room) CancelPlayerReconnectTimer(playerID string) bool {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	for _, p := range r.Players {
		if p.ID == playerID {
			if p.ReconnectTimer != nil {
				p.ReconnectTimer.Stop()
				p.ReconnectTimer = nil
				return true
			}
			return false
		}
	}
	return false
}

// MigrateHost ensures there is always exactly one active Host among connected human players (!p.IsBot && p.IsConnected).
// If the current Host leaves or disconnects, ownership (IsHost=true and IsReady=true) automatically transfers
// to the next connected human player. Returns true if host ownership was migrated.
func (r *Room) MigrateHost() bool {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	// Check if an existing connected human player is already host
	hasValidHost := false
	for _, p := range r.Players {
		if !p.IsBot && p.IsConnected && p.IsHost {
			if !hasValidHost {
				hasValidHost = true
			} else {
				p.IsHost = false
			}
		} else if p.IsHost {
			p.IsHost = false
		}
	}

	if hasValidHost {
		return false
	}

	// Transfer host to the first connected human player
	for _, p := range r.Players {
		if !p.IsBot && p.IsConnected {
			p.IsHost = true
			p.IsReady = true
			return true
		}
	}

	return false
}
