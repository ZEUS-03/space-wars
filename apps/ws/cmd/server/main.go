package main

import (
	"fmt"
	"net/http"
	"ws/internal/websocket"
)

func main() {
	http.HandleFunc("/ws", websocket.HandleConnections)
	port := "8081"
	fmt.Printf("Server started on http://localhost:%s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
