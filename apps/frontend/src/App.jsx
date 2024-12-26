import React, { useState, useEffect } from "react";
import PhaserGame from "./phaser/PhaserGame";

const App = () => {
  const [ws, setWs] = useState(null);
  const [players, setPlayers] = useState([]);
  const [localPlayerId, setLocalPlayerId] = useState("");

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
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === data.player_id
              ? { ...player, x: data.x, y: data.y } // Update only the specific player
              : player
          )
        );
        break;
      }

      case "player_connected":
        setPlayers((prevPlayers) => {
          if (!prevPlayers.some((player) => player.id === data.player_id)) {
            return [
              ...prevPlayers,
              { id: data.player_id, x: data.x, y: data.y },
            ];
          }
          return prevPlayers; // No changes if the player is already in the state
        });
        break;

      // Storing local player id in state variable.
      case "player_id_assigned":
        if (!localPlayerId) {
          setLocalPlayerId(data.player_id);
        }
        break;

      // updating all player position when new player joins
      case "all_players_position":
        setPlayers(data.data);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };
  console.log("final players", players);
  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  // console.log("players", players);
  // console.log("localPlayerId2", localPlayerId);
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <PhaserGame
        players={players}
        localPlayerId={localPlayerId}
        sendMessage={sendMessage}
      />
    </div>
  );
};

export default App;
