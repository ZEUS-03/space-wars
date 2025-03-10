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

	defer func() {
		// Remove the player from the room
		delete(room.Players, playerID)

		// Notify remaining players
		for _, p := range room.Players {
			err := p.Ws.WriteJSON(map[string]interface{}{
				"type":      "player_disconnected",
				"player_id": playerID,
			})
			if err != nil {
				fmt.Println("Error notifying players of disconnection:", err)
			}
		}

		// If the room is empty, delete it
		if len(room.Players) == 0 {
			delete(rooms, roomId)
		}
	}()
	
	playerInitMessage := map[string]interface{}{
		"type":      "player_id_assigned",
		"player_id": playerID,
	}

	if err := ws.WriteJSON(playerInitMessage); err != nil {
		fmt.Println("Error sending player ID:", err)
		return
	}

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

	for _, player := range rooms[roomId].Players {
		if player.ID != playerID {
			// fmt.Printf("Sending player %s", player.ID)
			player.Ws.WriteJSON(map[string]interface{}{
					"type": "player_connected",
					"player_id": playerID,
					"x": rooms[roomId].Players[playerID].Position.X,
					"y": rooms[roomId].Players[playerID].Position.Y,
					"rotation": rooms[roomId].Players[playerID].Position.Rotation,
					"health": rooms[roomId].Players[playerID].Health,
					"score": rooms[roomId].Players[playerID].Score,
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

		if wsMsg["type"] == "collision_detected" {
			player1:= wsMsg["localPlayerId"].(string)
			player2:= wsMsg["OtherPlayerId"].(string)

			response:= map[string]interface{}{
				"type": "collion_detected",
				"player1": player1,
				"health": 0,
				"player2": player2,
			}
			game.BroadcastToPlayers(rooms[roomId].Players, response)
		}

		// fmt.Printf("Received: ", wsMsg["type"])
		if wsMsg["type"] == "update_position" {
			x := wsMsg["x"].(float64)
			y := wsMsg["y"].(float64)
			rotation := wsMsg["rotation"].(float64)
			rooms[roomId].Players[playerID].Position = domain.Position{X: x, Y: y, Rotation: rotation}
			for _, p := range rooms[roomId].Players {
				err := p.Ws.WriteJSON(map[string]interface{}{
						"type":    "update_single_player_position",
						"player_id": playerID,
						"x":       x,
						"y":       y,
						"rotation": rotation,
				})
				if err != nil {
						fmt.Println("Error broadcasting position:", err)
				}
			}
		}

		if wsMsg["type"] == "bullet_fired" {
			x:= wsMsg["x"].(float64)
			y:= wsMsg["y"].(float64)
			playerID := wsMsg["id"].(string)
			rotation := wsMsg["rotation"].(float64)

			for _, player := range rooms[roomId].Players {
				if player.ID != playerID {
					player.Ws.WriteJSON(map[string]interface{}{
							"type": "bullet_fired",
							"player_id": playerID,
							"x": x,
							"y": y,
							"rotation": rotation,
					})
				}
			}	
		}
		if wsMsg["type"] == "player_hit" {
			shooterId := wsMsg["shooter_id"].(string)
			targetId := wsMsg["target_id"].(string)
			damage := 20
			bullet_x := wsMsg["bullet_x"].(float64)
			bullet_y := wsMsg["bullet_y"].(float64)
			
			if player, exists := rooms[roomId].Players[targetId]; exists{
				var response map[string]interface{}
				player.Health -= damage
				var shooterScore int
				if player.Health <= 0{
					if shooter, shooterExists:= rooms[roomId].Players[shooterId]; shooterExists{
						shooter.Score += 10
						shooterScore = shooter.Score
					}
					player.Health = 0
					response= map[string]interface{}{
						"type": "player_hit",
						"target_id": targetId,
						"bullet_x": bullet_x,
						"bullet_y": bullet_y,
						"shooter_id": shooterId,
						"health": player.Health,
						"score": shooterScore,
					}
				}else{
					if shooter, shooterExists:= rooms[roomId].Players[shooterId]; shooterExists{
						shooter.Score += 5
						shooterScore = shooter.Score
					}
					response= map[string]interface{}{
						"type": "player_hit",
						"target_id": targetId,
						"health": player.Health,
						"bullet_x": bullet_x,
						"bullet_y": bullet_y,
						"shooter_id": shooterId,
						"score": shooterScore,
					}
				}
				game.BroadcastToPlayers(rooms[roomId].Players, response)
			}
		}
		// fmt.Printf("rooms %v", rooms[roomId].Players); 
		// for _, player := range rooms[roomId].Players {
		// 	ws.WriteJSON(player)
		// }
	}
	
}
