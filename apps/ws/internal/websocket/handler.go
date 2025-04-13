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
var readyPlayers = make(map[string]bool)

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial HTTP connection to a WebSocket
	ws, err := utils.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading to WebSocket:", err)
		return
	}
	defer ws.Close()

	fmt.Println("Client connected")
	fmt.Println(r.URL.Query())
	roomId := r.URL.Query().Get("room_id");
	if roomId == "" {
		roomId = "default"
	}

	// Creating new room
	room := game.CreateRoom(rooms, roomId)
	game.AddAsteroids(room)

	// Generating random player ID
	playerID := uuid.New().String()

	// Creating new player in the room(2 players only limit)
	fmt.Println("Players in room: ", len(room.Players))
	if len(room.Players) < domain.MAX_PLAYERS {
		game.AddPlayerToRoom(room, roomId, playerID, ws)
	}else{
		message := map[string]string{
			"type": "room_full",
			"message": "Room is full",
		}
		ws.WriteJSON(message)
		ws.Close()
	}

	rooms[roomId].Players[playerID].Ws.WriteJSON(map[string]interface{}{
		"type": "asteroids_position",
		"positions": rooms[roomId].Asteroids,
	})
	
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
		"type": "player_id_assigned",
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
					"lifes": rooms[roomId].Players[playerID].Lifes,
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
			player1:= wsMsg["player1"].(string)
			player2:= wsMsg["player2"].(string)
		
			if player_1, exists := rooms[roomId].Players[player1]; exists{
				player_1.Lifes -= 1
				game.ReSpawnPlayer(player_1, rooms[roomId])
			}
			if player_2, exists := rooms[roomId].Players[player2]; exists{
				player_2.Lifes -= 1
				game.ReSpawnPlayer(player_2, rooms[roomId])
			}
		}

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
				player.Health -= damage
				var shooterScore int
				if player.Health <= 0 {
					if shooter, shooterExists:= rooms[roomId].Players[shooterId]; shooterExists{
						shooter.Score += 10
						shooterScore = shooter.Score
					}
					if(player.Lifes > 1){
						player.Health = 100
					}else{
						player.Health = 0
					}
					player.Lifes -= 1
					game.ReSpawnPlayer(player, rooms[roomId])
				} else {
					if shooter, shooterExists:= rooms[roomId].Players[shooterId]; shooterExists{
						shooter.Score += 5
						shooterScore = shooter.Score
					}
					response := map[string]interface{}{
						"type": "player_hit",
						"target_id": targetId,
						"health": player.Health,
						"bullet_x": bullet_x,
						"bullet_y": bullet_y,
						"shooter_id": shooterId,
						"score": shooterScore,
						"lifes": player.Lifes,
					}
					game.BroadcastToPlayers(rooms[roomId].Players, response)
				}
			}
		}
		if wsMsg["type"] == "player_hit_asteroid" {
			playerId := wsMsg["playerId"].(string)
			if player, exists := rooms[roomId].Players[playerId]; exists{
				player.Lifes--
				game.ReSpawnPlayer(player, rooms[roomId])
			}
		} // Track who clicked restart

		if wsMsg["type"] == "player-ready" { 
			playerId := wsMsg["playerId"].(string)

			readyPlayers[playerId] = true // Mark player as ready
			fmt.Println("Players ready: ", readyPlayers)

			// Check if both players in the room are ready
			if len(readyPlayers) >= 2 {
				response := map[string]interface{}{
					"type": "game-start",
				}
				game.BroadcastToPlayers(rooms[roomId].Players, response) 
				readyPlayers = make(map[string]bool) 
			}
		}
	}
	
}

// TODO: Server connections to be stored in .env
