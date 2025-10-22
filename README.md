# 🚀 Space Wars - Real-Time Multiplayer Game

> A fast-paced 2D multiplayer space combat game with real-time synchronization

[🎮 Play Live Demo](https://spacewars-gamma.vercel.app/) | https://www.loom.com/share/0f96f20d7b0841eb9d2021a84b80419c  [🎥 Watch Gameplay]

---

## 🎯 The Challenge

Building real-time multiplayer games requires handling:
- **Low-latency communication** between multiple clients
- **State synchronization** across all players
- **Smooth gameplay** despite network delays
- **Scalable architecture** for multiple concurrent game rooms

I built Space Wars to solve these challenges using WebSockets and optimized game architecture.

---

## ✨ Features

### 🎮 Gameplay
- **Real-time multiplayer combat** with smooth movement and shooting
- **Dynamic room system** - create or join game sessions
- **Player synchronization** - see other players move in real-time
- **Combat mechanics** - health, shooting, respawning
- **Interactive game world** - obstacles, power-ups, and boundaries

### 🛠️ Technical Features
- **WebSocket communication** for instant event propagation
- **Client-side prediction** for responsive controls
- **Server reconciliation** to prevent cheating
- **Optimized network protocol** - minimal bandwidth usage
- **Room-based architecture** - isolated game instances
- **Graceful disconnection handling**

---

## ⚠️ Known Limitations (Free Tier Hosting)

### Cold Start Delay
The backend is hosted on Render's free tier, which spins down after 15 minutes of inactivity.

**What this means:**
- First connection after inactivity takes 30-60 seconds to wake up the server.
- You may see "Loading" screen stuck at 90% - just wait and refresh.
- Players getting disconnected in between games.
- Once active, the game runs smoothly with <50ms latency.

## 🖼️ Screenshots

### Main Menu
<img width="450" height="250" alt="image" src="https://github.com/user-attachments/assets/58223832-4548-4e0a-9db9-83a718e7c09c" />

*Create or join multiplayer rooms*

### Gameplay
<img width="450" height="250" alt="image" src="https://github.com/user-attachments/assets/211c6fba-0a03-4b32-85ae-2c9b2c5ef497" />

*Real-time combat with multiple players*

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                    │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐    │
│  │   React UI   │  │  Phaser.js  │  │   WebSocket  │    │
│  │   (Lobby)    │  │   (Game)    │  │    Client    │    │
│  └──────────────┘  └─────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ WebSocket Connection
                           │ (bidirectional, real-time)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Golang Backend                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │            WebSocket Handler                     │  │
│  │  • Connection management                         │  │
│  │  • Event routing                                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Room Manager                          │  │
│  │  • Dynamic room creation/deletion                │  │
│  │  • Player assignment                             │  │
│  │  • Room state management                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Game Engine                           │  │
│  │  • Player position updates (60 tick/sec)         │  │
│  │  • Collision detection                           │  │
│  │  • Combat resolution                             │  │
│  │  • State broadcasting                            │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Phaser.js](https://img.shields.io/badge/Phaser.js-3.60-8B5FBF?logo=phaser)
![Tailwind](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=tailwind)
![Vite](https://img.shields.io/badge/Vite-4.3-646CFF?logo=vite)

- **React.js** - UI components and routing
- **Phaser.js** - 2D game engine for rendering and physics
- **WebSocket API** - Real-time bidirectional communication
- **Vite** - Fast development and optimized builds

### Backend
![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go)
![Gorilla](https://img.shields.io/badge/Gorilla-WebSocket-00ACD7)

- **Golang** - High-performance concurrent backend
- **Gorilla WebSocket** - WebSocket implementation
- **Concurrent design** - Goroutines for each game room
- **Channels** - Safe communication between goroutines

### Deployment
![Netlify](https://img.shields.io/badge/Netlify-Frontend-00C7B7?logo=netlify)
![Railway](https://img.shields.io/badge/Railway-Backend-0B0D0E?logo=railway)

---



## 🧠 What I Learned

### Technical Skills
- **WebSocket protocol** and real-time communication patterns
- **Game networking** concepts (client prediction, lag compensation)
- **Golang concurrency** with goroutines and channels
- **Phaser.js** game engine and 2D rendering
- **State management** in multiplayer environments

### System Design
- **Scalable architecture** for concurrent game sessions
- **Event-driven design** for decoupled components
- **Network optimization** techniques
- **Graceful error handling** in distributed systems

### Challenges Overcome
1. **Synchronization issues** - Solved with server authority + client prediction
2. **Race conditions** - Fixed with proper mutex usage in Go
3. **Network lag** - Mitigated with interpolation and dead reckoning
4. **Memory leaks** - Implemented proper cleanup for disconnected players

---

## 🚧 Future Enhancements

- [ ] **Matchmaking system** - Auto-pair players by skill level
- [ ] **Power-ups** - Health packs, weapon upgrades, shields
- [ ] **Leaderboard** - Track wins, kills, deaths
- [ ] **Multiple game modes** - Team battles, capture the flag
- [ ] **Mobile support** - Touch controls for mobile devices
- [ ] **Spectator mode** - Watch ongoing games
- [ ] **Replay system** - Record and playback matches
- [ ] **Custom skins** - Player customization

---

## 📝 Technical Decisions

### Why Golang for Backend?
- **Excellent concurrency** with goroutines (perfect for game rooms)
- **High performance** and low latency
- **Simple deployment** - single binary
- **Built-in WebSocket support** via libraries

### Why Phaser.js?
- **Mature 2D game engine** with proven track record
- **Good performance** with WebGL rendering
- **Rich API** for physics, sprites, animations
- **Large community** and documentation

### Why WebSockets over HTTP?
- **Bidirectional** real-time communication
- **Low overhead** compared to HTTP polling
- **Persistent connection** reduces latency
- **Perfect for game state updates**

---

## 👤 Author

**Your Name**
- Portfolio: [portfolio](https://gautamsharma.netlify.app)
- LinkedIn: [@gautam1]((https://www.linkedin.com/in/gautam1/))
- GitHub: [@ZEUS-03](https://github.com/ZEUS-03)
- Email: futuristic.gautam@gmail.com

---

## 📄 License

MIT License - feel free to use this project for learning!

---

## 🙏 Acknowledgments

- **Phaser.js community** for excellent documentation
- **Gorilla WebSocket** for robust WebSocket implementation
- Inspiration from classic multiplayer games like Agar.io and Diep.io

---

<div align="center">

**⭐ Star this repo if you found it interesting!**

Made with ❤️ and lots of ☕

</div>
