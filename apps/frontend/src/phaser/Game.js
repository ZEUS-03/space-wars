import { updateScore } from "../utils/utils.js";

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
}
function create() {
  var self = this;
  this.add.image(400, 300, "background").setDisplaySize(1300, 1000);
  this.playersGroup = this.physics.add.group();
  this.otherPlayers = this.physics.add.group();
  this.bullet = this.physics.add.group();
  this.socket = new WebSocket(
    // "https://space-war.onrender.com/ws?room_id=room123"
    "ws://localhost:8080/ws?room_id=room123"
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
          otherPlayer.destroy();
          otherPlayer.container.destroy();
        }
      });
      break;
    case "bullet_fired":
      renderBullet(self, data);
      break;
    case "player_hit":
      console.log(data);
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
        updateHealthBar(self, "player1", data.health);
        if (self.ship.health <= 0) {
          self.ship.destroy();
          self.ship.container.destroy();
        }
      } else {
        self.otherPlayers.getChildren().forEach((otherPlayer) => {
          if (data.target_id === otherPlayer.playerId) {
            otherPlayer.health = data.health;
            updateHealthBar(self, "player2", data.health);
            if (data.health <= 0) {
              otherPlayer.destroy();
              otherPlayer.container.destroy();
            }
          }
        });
      }
      updateScore(self, data?.shooter_id, data?.score);
      break;
    case "collision_detected":
      if (
        self.localPlayerId === data.player1 ||
        self.localPlayerId === data.player2
      ) {
        self.ship.setVelocity(0, 0);
        self.ship.setAcceleration(0);
        self.ship.setAngularVelocity(0);
        self.ship.health = 0;
        // updateHealthBar(self, self.ship, self.localPlayerId);
      }
  }
}
function addPlayer(self, playerInfo) {
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  self.ship.body.setSize(70, 70, false);
  self.ship.health = 100;
  self.ship.healthBar = self.add.graphics();
  self.ship.container = self.add.container(playerInfo.x, playerInfo.y);
  self.ship.container.add(self.ship.healthBar);
  self.ship.score = 0;
  createUIForLocalPlayer(self);
  // updateHealthBar(self, self.ship, playerInfo.player_id);
  self.ship.setCollideWorldBounds(true);
  self.ship.setBounce(0);
  self.ship.setMass(5);
  self.ship.setDrag(200);
  self.ship.setAngularDrag(150);
  self.ship.setMaxVelocity(200);
  self.playersGroup.add(self.ship);

  addTextID(self, self.ship.container, playerInfo);
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
  if (self.ship) {
    self.physics.add.collider(
      self.ship,
      self.playersGroup,
      (player, otherPlayer) => {
        player.setVelocity(0, 0);
        player.setAcceleration(0);
        player.setAngularVelocity(0);

        otherPlayer.setVelocity(0, 0);
        otherPlayer.setAcceleration(0);
        otherPlayer.setAngularVelocity(0);

        sendMessage(self, {
          type: "collision_detected",
          player2: otherPlayer,
          player1: self.localPlayerId,
        });
      }
    );
  }
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add
    .image(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  otherPlayer.body.setSize(70, 70, false);
  otherPlayer.health = 100;
  otherPlayer.healthBar = self.add.graphics();
  otherPlayer.container = self.add.container(playerInfo.x, playerInfo.y);
  otherPlayer.container.add(otherPlayer.healthBar);
  // updateHealthBar(self, otherPlayer, playerInfo.player_id);
  createUIForOtherPlayer(self);
  otherPlayer.score = 0;
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.setBounce(0);
  otherPlayer.setMass(5);
  otherPlayer.setDrag(200);
  otherPlayer.setAngularDrag(150);
  otherPlayer.setMaxVelocity(200);
  // otherPlayer.setPushable(true);
  self.playersGroup.add(otherPlayer); // Add to physics group

  addTextID(self, otherPlayer.container, playerInfo);
  otherPlayer.playerId = playerInfo.player_id;
  self.otherPlayers.add(otherPlayer);
  self.physics.add.collider(
    otherPlayer,
    self.playersGroup,
    (player, otherPlayer) => {
      // Stop movement when colliding
      player.setVelocity(0, 0);
      player.setAcceleration(0);
      player.setAngularVelocity(0);

      otherPlayer.setVelocity(0, 0);
      otherPlayer.setAcceleration(0);
      otherPlayer.setAngularVelocity(0);

      sendMessage(self, {
        type: "collision_detected",
        player2: otherPlayer,
        player1: self.localPlayerId,
      });
    }
  );
}

function addTextID(self, container, playerInfo) {
  let playerIdText = self.add
    .text(0, -30, playerInfo.player_id.slice(-4), {
      fontSize: "14px",
      fill: "#ffffff",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 3,
    })
    .setOrigin(0.5, 0.5);

  container.add(playerIdText);
}

function shootBullet(self) {
  if (!self.ship) return;
  const bulletSpeed = 400;
  let bullet = self.bullet.create(self.ship.x, self.ship.y, "bullet");
  bullet.setRotation(self.ship.rotation);
  self.physics.velocityFromRotation(
    self.ship.rotation + Math.PI / 2,
    bulletSpeed,
    bullet.body.velocity
  );

  sendMessage(self, {
    type: "bullet_fired",
    id: self.localPlayerId,
    x: self.ship.x,
    y: self.ship.y,
    rotation: self.ship.rotation,
  });

  bullet.setCollideWorldBounds(true);
  self.physics.add.overlap(bullet, self.otherPlayers, (bullet, otherPlayer) => {
    bullet.destroy();

    sendMessage(self, {
      type: "player_hit",
      shooter_id: self.localPlayerId,
      target_id: otherPlayer.playerId,
      bullet_x: bullet.x,
      bullet_y: bullet.y,
    });
  });

  bullet.body.onWorldBounds = true;

  bullet.body.world.on("worldbounds", (body) => {
    if (body === bullet.body) {
      bullet.destroy();
    }
  });
}

function renderBullet(self, data) {
  const bulletSpeed = 400;
  let bullet = self.bullet.create(data.x, data.y, "bullet");
  if (bullet) {
    // bullet.enableBody(true, data.x, data.y, true, true);
    bullet.setRotation(data.rotation);
    self.physics.velocityFromRotation(
      data.rotation + Math.PI / 2,
      bulletSpeed,
      bullet.body.velocity
    );
  }
}

function sendMessage(self, message) {
  if (self.socket && self.socket.readyState === WebSocket.OPEN) {
    self.socket.send(JSON.stringify(message));
  }
}

// For more than single player.

// function updateHealthBar(self, player, player_id) {
//   player.healthBar.clear();
//   if (self.localPlayerId === player_id) {
//     player.healthBar.fillStyle(0x0000ff, 1);
//   } else {
//     player.healthBar.fillStyle(0xff0000, 1);
//   }
//   player.healthBar.fillRect(-25, -40, player.health / 2, 5);
// }

function updateContainerPosition(player, x, y, rotation) {
  player.container.setPosition(x, y);
  player.container.setRotation(rotation);
}

function createUIForLocalPlayer(self) {
  // Player 1 UI (Top-left)
  self.player1ScoreText = self.add.text(20, 20, "Score: 0", {
    font: "20px kenvector_future",
    fill: "#0ff",
  });
  // .setShadow(2, 2, "#00f", 2);
  let player1Health = createHealthBar(self, 20, 60);
  self.player1HealthBar = player1Health.blocks;
}

function createUIForOtherPlayer(self) {
  // Player 2 UI (Top-right)
  self.player2ScoreText = self.add.text(
    self.sys.game.config.width - 150,
    20,
    "Score: 0",
    {
      font: "20px kenvector_future",
      fill: "#f00",
    }
  );
  // .setShadow(2, 2, "#f00", 2);

  let player2Health = createHealthBar(self, 1100, 60, true);
  self.player2HealthBar = player2Health.blocks;
}

function createHealthBar(self, x, y, isRightAligned = false) {
  let healthBarContainer = self.add.container(x, y);
  let blockWidth = 10;
  let gap = 3;
  let totalBlocks = 10;
  let blocks = [];

  let totalWidth = totalBlocks * (blockWidth + gap) - gap;
  let totalHeight = 18; // Slightly larger than blocks for the outline
  // X position adjustments
  let offsetX = isRightAligned ? -2 * totalWidth : 0;

  // Outline rectangle (aligned with blocks)
  let outlineX = totalWidth / 2 + offsetX;
  let outline = self.add
    .rectangle(
      outlineX - 5,
      0,
      totalWidth + 5,
      totalHeight,
      0xffffff,
      0 // Transparent inside
    )
    .setStrokeStyle(2, 0xffffff);
  healthBarContainer.add(outline);

  for (let i = 0; i < totalBlocks; i++) {
    let blockX = (blockWidth + gap) * i + offsetX;
    let block = self.add.rectangle(blockX, 0, blockWidth, 15, 0x00ff00);
    blocks.push(block);
    healthBarContainer.add(block);
  }

  return { container: healthBarContainer, blocks };
}

function updateHealthBar(self, playerKey, health) {
  let blocks =
    playerKey === "player1" ? self.player1HealthBar : self.player2HealthBar;
  let remainingBlocks = Math.ceil((health / 100) * blocks.length);

  blocks.forEach((block, index) => {
    if (index < remainingBlocks) {
      let color =
        remainingBlocks > 6
          ? 0x00ff00
          : remainingBlocks > 3
            ? 0xffa500
            : 0xff0000;
      block.setFillStyle(color);
    } else {
      block.setFillStyle(0x444444); // Dark gray for missing health
    }
  });
}
