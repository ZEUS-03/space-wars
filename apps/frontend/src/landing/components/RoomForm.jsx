import { useState } from "react";

const RoomForm = () => {
  const [roomId, setRoomId] = useState("");

  const handleJoin = () => {
    if (!roomId.trim()) return alert("Enter a valid Room ID");
    window.location.href = `/src/game/index.html?roomId=${roomId}`;
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 6); // Generate Random Room ID
    window.location.href = `/src/game/index.html?roomId=${newRoomId}`;
  };

  return (
    <div className="room-form">
      <h1>Join or Create a Room</h1>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoin}>Join Room</button>
      <button onClick={handleCreateRoom}>Create New Room</button>
    </div>
  );
};

export default RoomForm;
