package game

import ( 
	"ws/internal/domain"
	"github.com/gorilla/websocket"
	"fmt"
)

func GetPlayerLocations(rooms map[string]*domain.Room, roomID string) []map[string]interface{} {
	locations := []map[string]interface{}{}
	if room, exists := rooms[roomID]; exists {
			for _, player := range room.Players {
					locations = append(locations, map[string]interface{}{
							"id":  player.ID,
							"x":   player.Position.X,
							"y":   player.Position.Y,
					})
			}
	}
	return locations
}

func CreateRoom(rooms map[string]*domain.Room, roomID string) *domain.Room{
	if _, exists := rooms[roomID]; !exists{
		rooms[roomID] = domain.NewRoom()
	}
	return rooms[roomID]
}

func AddPlayerToRoom(room *domain.Room, roomId string, playerId string, ws*websocket.Conn) {
	room.Players[playerId] = &domain.Player{ID: playerId, Position: domain.Position{X: float64(len(room.Players)*10), Y: float64(len(room.Players)*10)}, Ws: ws}
	fmt.Printf("rooms-- %v",room)
}