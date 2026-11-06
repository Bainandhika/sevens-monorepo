package room

import (
	"encoding/json"
	"errors"
	"strings"
	"time"
	"unicode"

	"github.com/user/sevens/pkg/engine"
)

// RoomStatus represents the state of a room lifecycle.
type RoomStatus string

const (
	StatusWaiting  RoomStatus = "waiting"
	StatusPlaying  RoomStatus = "playing"
	StatusFinished RoomStatus = "finished"
)

// Table capacity, validation limits, and timing constants.
const (
	MaxPlayers             = 4
	MinHumanPlayersToStart = 2
	MaxNicknameLength      = 7
	RoomCodeLength         = 6
	ReconnectGracePeriod   = 30 * time.Second
	BotTurnDelay           = 700 * time.Millisecond
	ReaperInterval         = 60 * time.Second
	MaxRoomIdleDuration    = 5 * time.Minute
)

// WebSocket event type identifiers.
const (
	EventJoin        = "join"
	EventToggleReady = "toggle_ready"
	EventStartGame   = "start_game"
	EventPlayCard    = "play_card"
	EventFoldCard    = "fold_card"
	EventPass        = "pass"
	EventRematch     = "rematch"
	EventLeaveRoom   = "leave_room"
	EventAddBot      = "add_bot"
	EventPing        = "ping"
	EventRoomState   = "room_state"
	EventPong        = "pong"
	EventError       = "error"
)

// AvatarColors provides high-contrast avatar hex codes mapped to seat indices (0..3).
var AvatarColors = []string{
	"#4F46E5", // Seat 0: Indigo
	"#F59E0B", // Seat 1: Amber
	"#A855F7", // Seat 2: Purple
	"#00D084", // Seat 3: Mint
}

// WSMessage represents incoming and outgoing WebSocket raw message envelopes.
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// WSResponse represents structured outgoing WebSocket responses.
type WSResponse struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

// JoinPayload represents the incoming payload for EventJoin.
type JoinPayload struct {
	RoomID       string `json:"roomId"`
	PlayerID     string `json:"playerId"`
	Name         string `json:"name"`
	SessionToken string `json:"sessionToken"`
}

// ToggleReadyPayload represents the incoming payload for EventToggleReady.
type ToggleReadyPayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId"`
}

// StartGamePayload represents the incoming payload for EventStartGame.
type StartGamePayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId,omitempty"`
}

// PlayCardPayload represents the incoming payload for EventPlayCard.
type PlayCardPayload struct {
	RoomID   string      `json:"roomId"`
	PlayerID string      `json:"playerId"`
	Card     engine.Card `json:"card"`
}

// FoldCardPayload represents the incoming payload for EventFoldCard.
type FoldCardPayload struct {
	RoomID   string      `json:"roomId"`
	PlayerID string      `json:"playerId"`
	Card     engine.Card `json:"card"`
}

// PassPayload represents the incoming payload for EventPass.
type PassPayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId"`
}

// RematchPayload represents the incoming payload for EventRematch.
type RematchPayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId"`
}

// LeaveRoomPayload represents the incoming payload for EventLeaveRoom.
type LeaveRoomPayload struct {
	RoomID   string `json:"roomId"`
	PlayerID string `json:"playerId"`
}

// AddBotPayload represents the incoming payload for EventAddBot.
type AddBotPayload struct {
	RoomID     string               `json:"roomId"`
	Difficulty engine.BotDifficulty `json:"difficulty"`
}

// PingPayload represents the incoming payload for EventPing.
type PingPayload struct {
	Timestamp int64 `json:"timestamp"`
}

// PongPayload represents the outgoing payload for EventPong.
type PongPayload struct {
	Timestamp int64 `json:"timestamp"`
}

// ErrorPayload represents an outgoing error notification for EventError.
type ErrorPayload struct {
	Message string `json:"message"`
}

// SanitizeRoomCode trims whitespace, converts to uppercase, filters strictly
// to A-Z and 0-9 characters, and validates an exact length of 6 characters.
func SanitizeRoomCode(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	upper := strings.ToUpper(trimmed)
	var sb strings.Builder
	for _, r := range upper {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			sb.WriteRune(r)
		}
	}
	code := sb.String()
	if len(code) != RoomCodeLength {
		return "", errors.New("room code must be exactly 6 alphanumeric characters")
	}
	return code, nil
}

// SanitizeNickname strips non-alphanumeric characters and excess whitespace,
// truncates to a maximum of 7 characters, and falls back to a default preset
// nickname ('Sekop07') if empty.
func SanitizeNickname(raw string) string {
	var sb strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			sb.WriteRune(r)
		}
	}
	cleaned := sb.String()
	if len(cleaned) == 0 {
		return "Sekop07"
	}
	runes := []rune(cleaned)
	if len(runes) > MaxNicknameLength {
		runes = runes[:MaxNicknameLength]
	}
	return string(runes)
}

// GenerateInitials generates 2 uppercase characters from the player's name:
// - If the last character is a digit (e.g., 'Sekop07' -> 'S7')
// - If all letters (e.g., 'Ksatria' -> 'KS')
// - If 1 character -> 1 uppercase character.
func GenerateInitials(name string) string {
	clean := strings.TrimSpace(name)
	if len(clean) == 0 {
		return ""
	}
	runes := []rune(clean)
	if len(runes) == 1 {
		return string(unicode.ToUpper(runes[0]))
	}

	// If the last character is a digit (e.g., 'Sekop07' -> 'S7')
	lastRune := runes[len(runes)-1]
	if unicode.IsDigit(lastRune) {
		return string(unicode.ToUpper(runes[0])) + string(lastRune)
	}

	// Multi-part names (e.g., 'Elena_F' -> 'EF', 'Bot Taktis' -> 'BT')
	fields := strings.FieldsFunc(clean, func(r rune) bool {
		return unicode.IsSpace(r) || r == '_' || r == '-'
	})
	if len(fields) >= 2 {
		r1 := []rune(fields[0])
		r2 := []rune(fields[1])
		if len(r1) > 0 && len(r2) > 0 {
			return string(unicode.ToUpper(r1[0])) + string(unicode.ToUpper(r2[0]))
		}
	}

	// All letters / sequential characters (e.g., 'Ksatria' -> 'KS')
	return string(unicode.ToUpper(runes[0])) + string(unicode.ToUpper(runes[1]))
}

// GetAvatarColor returns a deterministic high-contrast avatar color based on seat index (0..3).
func GetAvatarColor(seatIndex int) string {
	if seatIndex < 0 || seatIndex >= len(AvatarColors) {
		seatIndex = ((seatIndex % len(AvatarColors)) + len(AvatarColors)) % len(AvatarColors)
	}
	return AvatarColors[seatIndex]
}

