package game

import (
	"fmt"
	"ws/internal/domain"
)

func BroadcastToPlayers(players map[string]*domain.Player, message map[string]interface{}) {
    for _, player := range players {
        select {
        case player.Send <- message:
            // Message sent successfully
        default:
            // Channel is full, skiping this player
            fmt.Println("Warning: player channel full, dropping message")
        }
    }
}
