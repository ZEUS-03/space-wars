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
var game = new Phaser.Game(config);
function preload() {
  this.load.image(
    "background",
    "/apps/frontend/public/assets/images/black.png"
  );
  this.load.image("ship", "/apps/frontend/public/assets/playerShip3_blue.png");
  this.load.image(
    "otherPlayer",
    "/apps/frontend/public/assets/enemyBlack3.png"
  );
  this.load.image("bullet", "/apps/frontend/public/assets/bullet.png");

  // Loading player life images

  this.load.image(
    "localPlayerLife",
    "/apps/frontend/public/assets/PNG/UI/playerLife3_blue.png"
  );
  this.load.image(
    "otherPlayerLife",
    "/apps/frontend/public/assets/PNG/UI/playerLife1_red.png"
  );
  this.load.image(
    "crossImage",
    "/apps/frontend/public/assets/PNG/UI/numeralX.png"
  );
  this.load.image(
    "numeral0",
    "/apps/frontend/public/assets/PNG/UI/numeral0.png"
  );
  this.load.image(
    "numeral1",
    "/apps/frontend/public/assets/PNG/UI/numeral1.png"
  );
  this.load.image(
    "numeral2",
    "/apps/frontend/public/assets/PNG/UI/numeral2.png"
  );
  this.load.image(
    "numeral3",
    "/apps/frontend/public/assets/PNG/UI/numeral3.png"
  );

  // Loading planet images
  this.load.image(
    "planet1",
    "/apps/frontend/public/assets/PNG/Meteors/planet1.png"
  );
  this.load.image(
    "planet2",
    "/apps/frontend/public/assets/PNG/Meteors/planet2.png"
  );

  this.load.image(
    "planet3",
    "/apps/frontend/public/assets/PNG/Meteors/planet6.png"
  );
  this.load.image(
    "planet4",
    "/apps/frontend/public/assets/PNG/Meteors/planet4.png"
  );
  this.load.image(
    "planet5",
    "/apps/frontend/public/assets/PNG/Meteors/planet5.png"
  );

  // Loading asteroids
  this.load.image(
    "asteroid1",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_big3.png"
  );

  this.load.image(
    "asteroid2",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_big4.png"
  );

  this.load.image(
    "asteroid3",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_med1.png"
  );
  this.load.image(
    "asteroid4",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_med3.png"
  );
  this.load.image(
    "asteroid5",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_small1.png"
  );
  this.load.image(
    "asteroid6",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_small2.png"
  );
  this.load.image(
    "asteroid7",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_tiny1.png"
  );
  this.load.image(
    "asteroid8",
    "/apps/frontend/public/assets/PNG/Meteors/meteorBrown_tiny2.png"
  );
}
function create() {
  var self = this;
  this.add.image(400, 300, "background").setDisplaySize(1300, 1000);
  this.playersGroup = this.physics.add.group();
  this.otherPlayers = this.physics.add.group();
  this.bullet = this.physics.add.group();
  this.socket = new WebSocket(
    "https://space-war.onrender.com/ws?room_id=room123"
    // "ws://localhost:8081/ws?room_id=room123"
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

  this.physics.world.createDebugGraphic();
}
function update() {
  if (!this.ship || !this.ship.active) return;
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
        50,
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
  switch (data.type) {
    case "player_id_assigned":
      self.localPlayerId = data.player_id;
      break;
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
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (data.player_id === otherPlayer.playerId) {
          otherPlayer.setRotation(data.rotation);
          otherPlayer.setPosition(data.x, data.y);
          updateContainerPosition(otherPlayer, data.x, data.y, data.rotation);
        }
      });
      break;
    case "player_disconnected":
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
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
        self.otherPlayers.getChildren().forEach((otherPlayer) => {
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
        self.otherPlayers.getChildren().forEach((otherPlayer) => {
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

// TODO: add collision detection b/w bullets and asteroids
