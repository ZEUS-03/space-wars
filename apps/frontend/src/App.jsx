import React, { useState, useEffect } from "react";
import PhaserGame from "./phaser/PhaserGame";

const App = () => {
  const [ws, setWs] = useState(null);
  const [players, setPlayers] = useState([]);
  const [localPlayerId, setLocalPlayerId] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws?room_id=room123");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleServerMessage = (data) => {
    console.log("Message from server:", data);
    switch (data.type) {
      case "update_single_player_position": {
        console.log("players--", players);
        const updatedPlayers = players.map(
          (player) =>
            player.id === data.player_id
              ? { ...player, x: data.x, y: data.y } // Update player position
              : player // Keep the existing player
        );
        console.log("updatedPlayers--", updatedPlayers);
        setPlayers([...updatedPlayers]); // Set the new players array
        break;
      }

      case "player_connected":
        if (!localPlayerId) {
          console.log("localPlayerId", data.player_id);
          setLocalPlayerId(data.player_id);
        }
        // addPlayer(data.player_id, data.x, data.y);
        break;

      case "all_players_position":
        console.log("isCulprit");
        setPlayers(data.data);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  console.log("players", players);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <PhaserGame players={players} />
    </div>
  );
};

export default App;
