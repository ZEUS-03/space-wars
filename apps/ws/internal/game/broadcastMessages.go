package game

import (
	"fmt"
	"ws/internal/domain"
)

func BroadcastToPlayers(players map[string]*domain.Player, message map[string]interface{}) {
	for _, player := range players {
		err := player.Ws.WriteJSON(message)
		if err != nil {
			fmt.Println("Error broadcasting message:", err)
		}
	}
}
