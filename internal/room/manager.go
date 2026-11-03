package room

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/olahol/melody"
	"github.com/user/sevens/pkg/engine"
)

type RoomStatus string

const (
	StatusWaiting  RoomStatus = "waiting"
	StatusPlaying  RoomStatus = "playing"
	StatusFinished RoomStatus = "finished"
)

// Player represents a participant in a game room.
type Player struct {
	ID         string               `json:"id"`
	Name       string               `json:"name"`
	IsBot      bool                 `json:"isBot"`
	BotLevel   engine.BotDifficulty `json:"botLevel,omitempty"`
	Hand       []engine.Card        `json:"hand"`
	Session    *melody.Session      `json:"-"`
	IsReady    bool                 `json:"isReady"`
	Penalties  int                  `json:"penalties"`
}

// Room represents an active multiplayer match instance.
type Room struct {
	ID           string                          `json:"id"`
	Status       RoomStatus                      `json:"status"`
	Players      []*Player                       `json:"players"`
	Board        *engine.Board                   `json:"board"`
	CurrentTurn  string                          `json:"currentTurn"`
	Scores       map[string]engine.PlayerScoreDetail `json:"scores,omitempty"`
	LastActivity time.Time                       `json:"lastActivity"`
	Mu           sync.RWMutex                    `json:"-"`
}

// UpdateActivity updates the last active timestamp for Reaper tracking.
func (r *Room) UpdateActivity() {
	r.LastActivity = time.Now()
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
		Players:      make([]*Player, 0),
		Board:        engine.NewBoard(),
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

// StartReaper runs a background garbage collector for stale rooms.
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

// reapStaleRooms removes rooms that haven't had activity past maxIdle.
func (m *Manager) reapStaleRooms(maxIdle time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for id, r := range m.rooms {
		r.Mu.RLock()
		isStale := now.Sub(r.LastActivity) > maxIdle
		r.Mu.RUnlock()

		if isStale {
			log.Printf("[Room Reaper] Evicting idle room: %s (idle since %s)", id, r.LastActivity.Format(time.RFC3339))
			delete(m.rooms, id)
		}
	}
}
