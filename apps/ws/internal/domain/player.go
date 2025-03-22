package domain

import "github.com/gorilla/websocket"

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Rotation float64 `json:"rotation"`
}

type Player struct {
	ID string `json:"id"`
	Position Position `json:"position"`
	Health int `json:"health"`
	Score int `json:"score"`
	Lifes int `json:"lifes"`
	Ws *websocket.Conn
}

