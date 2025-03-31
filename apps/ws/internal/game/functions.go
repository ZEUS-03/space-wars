package game

import (
	"fmt"
	"math"
	"math/rand"
	"ws/internal/domain"
	"github.com/gorilla/websocket"
)

// ToDo: Add rotations when a new player joins the room

func GetPlayerLocations(rooms map[string]*domain.Room, roomID string) []map[string]interface{} {
	locations := []map[string]interface{}{}
	if room, exists := rooms[roomID]; exists {
		for _, player := range room.Players {
			locations = append(locations, map[string]interface{}{
				"player_id":  player.ID,
				"x":   player.Position.X,
				"y":   player.Position.Y,
				"rotation": player.Position.Rotation,
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
	room.Mutex.Lock()
	defer room.Mutex.Unlock()
	x, y := generateSpawnPlayerPosition(room.Asteroids)
	fmt.Printf("Player %s spawned at %f, %f\n", playerId, x, y)
	room.Players[playerId] = 
		&domain.Player{
			ID: playerId, 
			Health: 100, 
			Score: 0, 
			Lifes: 3,
			Position: domain.Position{X: float64(x), 
				Y: float64(y), 
				Rotation: 0,
				}, 
			Ws: ws,
		}
}

func generateSpawnPlayerPosition(asteroids []*domain.Asteroid)(float64, float64) {
	var x, y float64
	isValidPosition := false

	for !isValidPosition {
		x = float64(rand.Intn(domain.MaxX) + 25)
		y = float64(rand.Intn(domain.MaxY) + 25)

		isValidPosition = true
		for _, asteroid := range asteroids {
			distance := math.Sqrt(math.Pow(asteroid.X-x, 2) + math.Pow(asteroid.Y-y, 2))
			if distance < domain.MinPlayerDistance {
				isValidPosition = false
				break
			}
		}
	}
	return x, y
}

func AddAsteroids(room *domain.Room) {
	room.Mutex.Lock()
	defer room.Mutex.Unlock()
	if len(room.Asteroids) == 0 {
		room.Asteroids = generateAsteroids(20)
	}
}

func generateAsteroids(count int) []*domain.Asteroid {
	asteroids := []*domain.Asteroid{}
	minDistance := float64(rand.Intn(40) + 60)
	for len(asteroids) < count {
		x := float64(rand.Intn(950) + 25)
		y := float64(rand.Intn(750) + 25)

		// Check if the new asteroid is too close to an existing one
		tooClose := false
		for _, a := range asteroids {
			distance := math.Sqrt(math.Pow(a.X-x, 2) + math.Pow(a.Y-y, 2))
			if distance < minDistance {
				tooClose = true
				break
			}
		}

		// maintains proper spacing and clustering of astroids 
		if (!tooClose || (len(asteroids) > 3 && rand.Float64() < 0.15)) { 
			asteroids = append(asteroids, &domain.Asteroid{X: x, Y: y})
		}
	}

	return asteroids
}

func ReSpawnPlayer(player *domain.Player, room *domain.Room) { 
	if player.Lifes > 0 {
		x, y := generateSpawnPlayerPosition(room.Asteroids)
		player.Health = 100
		player.Position.X = x
		player.Position.Y = y
		player.Position.Rotation = 0
		BroadcastToPlayers(room.Players, map[string]interface{}{
			"type": "player_spawned",
			"player": player,
		})
	} else {
		BroadcastToPlayers(room.Players, map[string]interface{}{
			"type": "game-over",
			"playerId": player.ID,
		})
	}
}

