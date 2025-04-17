package main

import (
	"fmt"
	"net/http"
	"ws/internal/websocket"
)

func main() {
	http.HandleFunc("/ws", websocket.HandleConnections)
	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "pong")
	})
	port := "8080"
	fmt.Printf("Server started on http://localhost:%s\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
