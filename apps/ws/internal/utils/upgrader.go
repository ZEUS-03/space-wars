// Upgrader config to handle WebSocket connections
package utils

import ( 
	"github.com/gorilla/websocket"
	"net/http"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins (you can customize this for security)
		return true
	},
}
