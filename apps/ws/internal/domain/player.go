package domain

import (
	"sync"
	"github.com/gorilla/websocket"
)

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Rotation float64 `json:"rotation"`
}

type Player struct {
    ID       string                  `json:"id"`
    Position Position                `json:"position"`
    Health   int                     `json:"health"`
    Score    int                     `json:"score"`
    Lifes    int                     `json:"lifes"`
    Ws       *websocket.Conn            `json:"-"` // Exclude from JSON
    Send     chan map[string]interface{} `json:"-"` // Exclude from JSON
    WriteMu  sync.Mutex                 `json:"-"` // Exclude from JSON
}

