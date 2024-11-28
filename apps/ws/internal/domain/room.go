package domain

type Room struct {
	Players map[string]*Player
}

func NewRoom() *Room{
	return &Room{Players: make(map[string]*Player)}
}