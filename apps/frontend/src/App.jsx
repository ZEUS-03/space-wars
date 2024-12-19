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
        console.log("data", data);
        console.log("playerid", players);
        const updatedPlayers = players.map(
          (player) =>
            player.id === data.player_id
              ? { ...player, x: data.x, y: data.y } // Update player position
              : player // Keep the existing player
        );
        console.log("updatedPlayers--", updatedPlayers);
        // setPlayers([...updatedPlayers]); // Set the new players array
        break;
      }

      case "player_connected":
        // if (!localPlayerId) {
        //   console.log("localPlayerId", data.player_id);
        //   setLocalPlayerId(data.player_id);
        //   console.log("localPlayerId2", localPlayerId);
        // }
        console.log("data", data);
        // setPlayers([ ...players, {data.player_id: { id: data.player_id, x: data.x, y: data.y }} ]);
        break;

      case "player_id_assigned":
        if (!localPlayerId) {
          console.log("player_id_assigned", data.player_id);
          setLocalPlayerId(data.player_id);
        }
        break;
      case "all_players_position":
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
