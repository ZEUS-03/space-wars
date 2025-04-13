import { useState, useEffect, useRef } from "react";
import "../css/RoomForm.css";
import CursorSVG from "./CursorSVG";

const RoomForm = () => {
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const containerRef = useRef(null);
  const cursorRef = useRef(null);

  // Custom cursor movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const handleMouseDown = () => {
      setIsFiring(true);
      setTimeout(() => setIsFiring(false), 300);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    // Hide the default cursor
    document.body.style.cursor = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      document.body.style.cursor = "auto";
    };
  }, []);

  // Generate stars
  useEffect(() => {
    if (!containerRef.current) return;

    // Create stars
    const starCount = 150;
    const starElements = [];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "star";

      // Random position
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      // Random size
      const size = 0.5 + Math.random() * 2;

      // Random glow intensity
      const glow = 2 + Math.random() * 5;

      // Random animation delay and duration
      const animDelay = Math.random() * 10;
      const animDuration = 2 + Math.random() * 4;

      // Apply styles
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.boxShadow = `0 0 ${glow}px ${glow / 2}px rgba(255, 255, 255, 0.8)`;
      star.style.animationDelay = `${animDelay}s`;
      star.style.animationDuration = `${animDuration}s`;

      starElements.push(star);
      containerRef.current.appendChild(star);
    }

    return () => {
      // Clean up
      starElements.forEach((star) => {
        if (containerRef.current && star.parentNode === containerRef.current) {
          containerRef.current.removeChild(star);
        }
      });
    };
  }, []);

  const handleJoin = () => {
    if (!roomId.trim()) return alert("Enter a valid Room ID");
    setIsJoining(true);
    setTimeout(() => {
      window.location.href = `/src/game/index.html?roomId=${roomId}`;
    }, 800); // Short delay for animation
  };

  const handleCreateRoom = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newRoomId = Math.random().toString(36).substr(2, 6);
      window.location.href = `/src/game/index.html?roomId=${newRoomId}`;
    }, 800); // Short delay for animation
  };

  return (
    <div className="room-form-container" ref={containerRef}>
      {/* Custom fighter plane cursor */}
      <div
        ref={cursorRef}
        className={`fighter-cursor ${isFiring ? "firing" : ""}`}
      >
        <CursorSVG />
        {/* {isFiring && <div className="laser-beam"></div>} */}
      </div>

      <div className="room-form-card">
        <div className="glow-effect"></div>
        <div className="logo">
          <span className="logo-text">
            SPACE <span className="logo-highlight">WARS</span>
          </span>
        </div>
        <h1>Join or Create a Room</h1>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isJoining || isCreating}
          />
        </div>
        <div className="button-group">
          <button
            className={`join-button ${isJoining ? "loading" : ""}`}
            onClick={handleJoin}
            disabled={isJoining || isCreating}
          >
            {isJoining ? "Joining..." : "Join Room"}
          </button>
          <span className="or-divider">OR</span>
          <button
            className={`create-button ${isCreating ? "loading" : ""}`}
            onClick={handleCreateRoom}
            disabled={isJoining || isCreating}
          >
            {isCreating ? "Creating..." : "Create New Room"}
          </button>
        </div>
        <div className="info-text">
          Create a room and share the ID with friends to play together!
        </div>
      </div>
    </div>
  );
};

export default RoomForm;
