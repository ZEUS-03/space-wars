import {
  updateScore,
  updateLifes,
  destroyPlayer,
  spawnPlayer,
  updateContainerPosition,
  sendMessage,
} from "../utils/utils.js";
import { createAsteroids } from "../ui/asteroids.js";
import { addOtherPlayers, addPlayer, updateHealthBar } from "../ui/player.js";
import { renderBullet, shootBullet } from "../ui/bullet.js";
import { BASE_PATH, METEOR_PATH, UI_PATH } from "../utils/constants.js";
import { showGameOverModal } from "../ui/common.js";
import { baseURL } from "../../constants.js";

const PLAY_AREA = {
  x: 20, // Left boundary
  y: 20, // Top boundary
  width: 980, // Updated play area width
  height: 730, // Updated play area height
};

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1000,
  height: 750,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId") || "";
let loadingInterval = null;

var game = new Phaser.Game(config);
function preload() {
  this.load.image("background", `${BASE_PATH}images/black.png`);
  this.load.image("ship", `${BASE_PATH}playerShip3_blue.png`);
  this.load.image("otherPlayer", `${BASE_PATH}enemyBlack3.png`);
  this.load.image("bullet", `${BASE_PATH}bullet.png`);

  // Loading player life images

  this.load.image("localPlayerLife", `${UI_PATH}playerLife3_blue.png`);
  this.load.image("otherPlayerLife", `${UI_PATH}playerLife1_red.png`);
  this.load.image("crossImage", `${UI_PATH}numeralX.png`);
  this.load.image("numeral0", `${UI_PATH}numeral0.png`);
  this.load.image("numeral1", `${UI_PATH}numeral1.png`);
  this.load.image("numeral2", `${UI_PATH}numeral2.png`);
  this.load.image("numeral3", `${UI_PATH}numeral3.png`);

  // Loading planet images
  this.load.image("planet1", `${METEOR_PATH}planet1.png`);
  this.load.image("planet2", `${METEOR_PATH}planet2.png`);

  this.load.image("planet3", `${METEOR_PATH}planet6.png`);
  this.load.image("planet4", `${METEOR_PATH}planet4.png`);
  this.load.image("planet5", `${METEOR_PATH}planet5.png`);

  // Loading asteroids
  this.load.image("asteroid1", `${METEOR_PATH}meteorBrown_big3.png`);

  this.load.image("asteroid2", `${METEOR_PATH}meteorBrown_big4.png`);

  this.load.image("asteroid3", `${METEOR_PATH}meteorBrown_med1.png`);
  this.load.image("asteroid4", `${METEOR_PATH}meteorBrown_med3.png`);
  this.load.image("asteroid5", `${METEOR_PATH}meteorBrown_small1.png`);
  this.load.image("asteroid6", `${METEOR_PATH}meteorBrown_small2.png`);
  this.load.image("asteroid7", `${METEOR_PATH}meteorBrown_tiny1.png`);
  this.load.image("asteroid8", `${METEOR_PATH}meteorBrown_tiny2.png`);
}
function create() {
  var self = this;
  this.add.image(400, 300, "background").setDisplaySize(1300, 1000);
  this.playersGroup = this.physics.add.group();
  this.otherPlayers = this.physics.add.group();
  this.bullet = this.physics.add.group();
  this.socket = new WebSocket(
    `${baseURL}ws?room_id=${roomId}`
    // `ws://localhost:8080/ws?room_id=${roomId}`
  );
  this.socket.onopen = () => {
    console.log("WebSocket connection established");
    this.socket.send("Hello, server!");
  };

  this.socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleEvent(self, data);
  };
  this.socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
  this.socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
      clearTimeout(loadingTimeout);
    }
    document.getElementById("error-container").style.display = "flex";
  };

  this.cursors = this.input.keyboard.createCursorKeys();
  this.spacebar = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SPACE
  );

  // Removing the bullet when it goes out of the world bounds
  self.physics.world.on("worldbounds", (body) => {
    if (
      body.gameObject &&
      body.gameObject.texture &&
      body.gameObject.texture.key === "bullet"
    ) {
      if (body.gameObject.active) {
        body.gameObject.destroy(); // Remove the bullet
      }
    }
  });

  document.getElementById("ready-btn").addEventListener("click", () => {
    sendMessage(this, {
      type: "player-ready",
      playerId: self.localPlayerId,
    });

    // Disable button to prevent multiple clicks
    document.getElementById("ready-btn").disabled = true;
    document.getElementById("ready-btn").style.display = "none";
  });

  document.getElementById("go-back-btn").addEventListener("click", () => {
    window.location.href = "/";
  });

  // Uncomment to show physics debug
  // this.physics.world.createDebugGraphic();
}
function update() {
  if (!this.ship || !this.ship.active || !this.playerCanMove) return;
  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        100,
        this.ship.body.acceleration
      );
    } else {
      this.ship.setAcceleration(0);
    }

    this.ship.x = Phaser.Math.Clamp(
      this.ship.x,
      PLAY_AREA.x,
      PLAY_AREA.x + PLAY_AREA.width
    );
    this.ship.y = Phaser.Math.Clamp(
      this.ship.y,
      PLAY_AREA.y,
      PLAY_AREA.y + PLAY_AREA.height
    );

    // Shoot bullet when spacebar is pressed
    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      shootBullet(this);
    }

    updateContainerPosition(
      this.ship,
      this.ship.x,
      this.ship.y,
      this.ship.rotation
    );

    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (
      this.ship.oldPosition &&
      (x !== this.ship.oldPosition.x ||
        y !== this.ship.oldPosition.y ||
        r !== this.ship.oldPosition.rotation)
    ) {
      sendMessage(this, {
        type: "update_position",
        id: this.localPlayerId,
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation,
      });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation,
    };
  }
}
function handleEvent(self, data) {
  const otherPlayerGroup = self.otherPlayers.getChildren();
  switch (data.type) {
    case "room_full":
      document.getElementById("waiting-modal").style.display = "none";
      document.getElementById("room-full-modal").style.display = "block";
      break;
    case "player_id_assigned": {
      self.localPlayerId = data.player_id;
      const loadingScreen = document.getElementById("loading-screen");
      const loadingBar = document.querySelector(".loading-bar");
      const loadingProgress = document.querySelector(".loading-progress");
      loadingBar.style.width = 100 + "%";
      loadingProgress.textContent = Math.round(100) + "%";
      if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
        clearTimeout(loadingTimeout);
      }

      setTimeout(() => {
        loadingScreen.classList.add("loaded");
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 1000);
      }, 500);
      break;
    }
    case "all_players_position":
      data?.data?.forEach((player) => {
        if (self.localPlayerId == player.player_id) {
          addPlayer(self, player);
        } else {
          addOtherPlayers(self, player);
        }
      });
      break;
    case "asteroids_position":
      if (!self.asteroids) {
        createAsteroids(self, data?.positions);
      }
      break;
    case "player_connected":
      addOtherPlayers(self, data);
      break;
    case "update_single_player_position":
      otherPlayerGroup.forEach(function (otherPlayer) {
        if (data.player_id === otherPlayer.playerId) {
          otherPlayer.setRotation(data.rotation);
          otherPlayer.setPosition(data.x, data.y);
          updateContainerPosition(otherPlayer, data.x, data.y, data.rotation);
        }
      });
      break;
    case "player_disconnected":
      otherPlayerGroup.forEach(function (otherPlayer) {
        if (data.player_id === otherPlayer.playerId) {
          destroyPlayer(otherPlayer);
        }
      });
      break;
    case "bullet_fired":
      renderBullet(self, data);
      break;
    case "player_hit":
      if (self.localPlayerId === data.target_id) {
        self.bullet.getChildren().forEach((bullet) => {
          if (
            Phaser.Math.Distance.Between(
              bullet.x,
              bullet.y,
              data.bullet_x,
              data.bullet_y
            ) < 10
          ) {
            bullet.destroy();
          }
        });

        self.ship.health = data.health;
        updateHealthBar(self.player1HealthBar, data.health);
        if (self.ship.lifes != data.lifes) {
          self.ship.lifes = data.lifes;
          updateLifes(self, self.ship, data.lifes, self.player1LifesContainer);
        }
      } else {
        otherPlayerGroup.forEach((otherPlayer) => {
          if (data.target_id === otherPlayer.playerId) {
            otherPlayer.health = data.health;
            updateHealthBar(self.player2HealthBar, data.health);
            if (otherPlayer.lifes != data.lifes) {
              otherPlayer.lifes = data.lifes;
              updateLifes(
                self,
                otherPlayer,
                data.lifes,
                self.player2LifesContainer
              );
            }
          }
        });
      }
      updateScore(self, data?.shooter_id, data?.score);
      break;

    case "player_spawned":
      if (self.localPlayerId === data.player.id) {
        updateLifes(
          self,
          self.ship,
          data.player.lifes,
          self.player1LifesContainer
        );
        if (data.player.lifes > 0) {
          spawnPlayer(self.ship, data.player, self.player1HealthBar);
        } else {
          destroyPlayer(self.ship);
        }
      } else {
        const otherPlayer = self.otherPlayers
          .getChildren()
          .find((player) => player.playerId === data.player.id);
        updateLifes(
          self,
          otherPlayer,
          data.player.lifes,
          self.player2LifesContainer
        );
        if (data.player.lifes > 0) {
          spawnPlayer(otherPlayer, data.player, self.player2HealthBar);
        } else {
          destroyPlayer(otherPlayer);
        }
      }
      break;

    case "game-over":
      if (self.localPlayerId === data.playerId) {
        destroyPlayer(self.ship);
        updateLifes(self, self.ship, 0, self.player1LifesContainer);
        updateHealthBar(self.player1HealthBar, 0);
      } else {
        otherPlayerGroup.forEach((otherPlayer) => {
          if (data.playerId === otherPlayer.playerId) {
            destroyPlayer(otherPlayer);
            updateLifes(self, otherPlayer, 0, self.player2LifesContainer);
            updateHealthBar(self.player2HealthBar, 0);
            return;
          }
        });
      }
      if (!self.modalShown) {
        showGameOverModal(self, data.playerId);
        self.modalShown = true;
      }
      break;
    case "game-start":
      document.getElementById("waiting-modal").style.display = "none";
      self.playerCanMove = true;
      break;
    case "player_hit_asteroid":
      if (self.localPlayerId === data.playerId) {
        destroyPlayer(self.ship);
        self.ship.health = data.health;
        updateHealthBar(self.player1HealthBar, data.health);
        if (self.ship.lifes != data.lifes) {
          self.ship.lifes = data.lifes;
          updateLifes(self, self.ship, data.lifes, self.player1LifesContainer);
        }
      } else {
        otherPlayerGroup.forEach((otherPlayer) => {
          if (data.playerId === otherPlayer.playerId) {
            destroyPlayer(otherPlayer);
            otherPlayer.health = data.health;
            updateHealthBar(self.player2HealthBar, data.health);
            if (otherPlayer.lifes != data.lifes) {
              otherPlayer.lifes = data.lifes;
              updateLifes(
                self,
                otherPlayer,
                data.lifes,
                self.player2LifesContainer
              );
            }
          }
        });
      }
  }
}
function createStars(count = 100) {
  const starfield = document.getElementById("starfield");
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    starfield.appendChild(star);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  createStars(150);
  loadingInterval;
});
const loadingBar = document.querySelector(".loading-bar");
const loadingProgress = document.querySelector(".loading-progress");
let progress = 0;
loadingInterval = setInterval(() => {
  let randomNumber = Math.random() * 5;
  if (progress + randomNumber < 99) {
    progress += randomNumber;
  } else {
    progress = 99;
    document.getElementById("loading-text").innerText =
      "Waking up the server. This may take a minute...";
    clearInterval(loadingInterval);
  }
  loadingBar.style.width = progress + "%";
  loadingProgress.textContent = Math.round(progress) + "%";
}, 200);
const MAX_LOADING_TIME = 60000; // 60 seconds

const loadingTimeout = setTimeout(() => {
  if (loadingInterval) {
    clearInterval(loadingInterval);
  }
  document.getElementById("loading-text").innerText =
    "Connection timeout. Please refresh the page.";

  // Optionally add a retry button
  const retryBtn = document.createElement("button");
  retryBtn.textContent = "Retry";
  retryBtn.onclick = () => window.location.reload();
  document.querySelector(".loading-screen").appendChild(retryBtn);
}, MAX_LOADING_TIME);
