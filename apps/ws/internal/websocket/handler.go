package websocket

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"

	"ws/internal/domain"
	"ws/internal/game"
	"ws/internal/utils"
)

var rooms = make(map[string]*domain.Room)

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial HTTP connection to a WebSocket
	ws, err := utils.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading to WebSocket:", err)
		return
	}
	// fmt.Println("Response generated %s/n", r)
	defer ws.Close()

	fmt.Println("Client connected")

	roomId := r.URL.Query().Get("room_id");
	if roomId == "" {
		roomId = "default"
	}

	// Creating new room
	room := game.CreateRoom(rooms, roomId)

	// Generating random player ID
	playerID := uuid.New().String()

	// Creating new player in the room
	game.AddPlayerToRoom(room, roomId, playerID, ws)

	locations := game.GetPlayerLocations(rooms, roomId);

	var newLocations = make(map[string]interface{})

	newLocations["type"] = "all_players_position"
	newLocations["data"] = locations	

	// game.BroadcastToPlayers(room.Players, newLocations)

	if err := ws.WriteJSON(newLocations); err != nil {
		fmt.Println("Error sending player ID:", err)
		return
	}

	fmt.Printf("Player %s connected to room %s\n", playerID, roomId)

	playerInitMessage := map[string]interface{}{
		"type":      "player_id_assigned",
		"player_id": playerID,
	}

	if err := ws.WriteJSON(playerInitMessage); err != nil {
		fmt.Println("Error sending player ID:", err)
		return
	}

	// var connectedPlayer = make(map[string]interface{})
	// connectedPlayer["type"] = "player_connected"
	// connectedPlayer["player_id"] = playerID
	// connectedPlayer["x"] = room.Players[playerID].Position.X
	// connectedPlayer["y"] = room.Players[playerID].Position.Y

	// game.BroadcastToPlayers(room.Players, connectedPlayer)

	for _, player := range rooms[roomId].Players {
		if player.ID != playerID {
			// fmt.Printf("Sending player %s", player.ID)
			player.Ws.WriteJSON(map[string]interface{}{
					"type": "player_connected",
					"player_id": playerID,
					"x": rooms[roomId].Players[playerID].Position.X,
					"y": rooms[roomId].Players[playerID].Position.Y,
			})
		}
	}	

	// Handle communication
	for {
		// Read message from the client
		
		_, msg, err := ws.ReadMessage()
		if err != nil {
			fmt.Println("Error reading message:", err)
			delete(rooms[roomId].Players, playerID)
			
			break
		}
		var wsMsg map[string]interface{}
		err = json.Unmarshal(msg, &wsMsg)
		if err != nil {
			fmt.Println("Error unmarshalling message:", err)
			continue
		}

		fmt.Printf("Received: %v\n", wsMsg["x"])
		if wsMsg["type"] == "update_position" {
			x := wsMsg["x"].(float64)
			y := wsMsg["y"].(float64)
			rooms[roomId].Players[playerID].Position = domain.Position{X: x, Y: y}
			// if time.Since(lastBroadcastTime) > 100 * time.Millisecond {
    	// 	lastBroadcastTime = time.Now()
				
				for _, p := range rooms[roomId].Players {
					err := p.Ws.WriteJSON(map[string]interface{}{
							"type":    "update_single_player_position",
							"player_id": playerID,
							"x":       x,
							"y":       y,
					})
					if err != nil {
							fmt.Println("Error broadcasting position:", err)
					}
				}
			}
		// }
		fmt.Printf("rooms %v", rooms[roomId].Players); 
		for _, player := range rooms[roomId].Players {
			ws.WriteJSON(player)
		}
	}
	
}
