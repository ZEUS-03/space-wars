package domain

import "sync"

type Room struct {
	Mutex        sync.Mutex
	Players   map[string]*Player
	Asteroids []*Asteroid
}

func NewRoom() *Room {
	return &Room{Players: make(map[string]*Player), Asteroids: []*Asteroid{}}
}