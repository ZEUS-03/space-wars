import { PLAYER_HEALTH, PLAYER_LIFES } from "../utils/constants.js";
import { destroyPlayer, sendMessage } from "../utils/utils.js";

export function createHealthBar(self, x, y, isRightAligned = false) {
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

export function updateHealthBar(blocks, health) {
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

export function createUIForLocalPlayer(self) {
  // Player 1 UI (Top-left)
  self.player1ScoreText = self.add.text(20, 20, "Score: 0", {
    font: "20px kenvector_future",
    fill: "#0ff",
  });
  let player1Health = createHealthBar(self, 20, 60);
  const player1LifesContainer = createLifeCounter(
    self,
    40,
    95,
    "localPlayerLife"
  );
  player1LifesContainer.setDepth(1);
  player1Health.container.setDepth(1);
  self.player1ScoreText.setDepth(1);
  self.player1LifesContainer = player1LifesContainer;
  self.player1HealthBar = player1Health.blocks;
}

export function createUIForOtherPlayer(self) {
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
  let player2Health = createHealthBar(self, 1100, 60, true);
  const player2LifesContainer = createLifeCounter(
    self,
    self.sys.game.config.width - 120,
    95,
    "otherPlayerLife"
  );
  player2LifesContainer.setDepth(1);
  player2Health.container.setDepth(1);
  self.player2ScoreText.setDepth(1);
  self.player2LifesContainer = player2LifesContainer;
  self.player2HealthBar = player2Health.blocks;
}

export function createLifeCounter(self, x, y, lifeImage) {
  let lifeCounterContainer = self.add.container(x, y);
  lifeCounterContainer.add(self.add.image(0, 0, lifeImage));
  lifeCounterContainer.add(self.add.image(30, 0, "crossImage"));
  lifeCounterContainer.add(self.add.image(60, 0, "numeral3"));

  return lifeCounterContainer;
}

export function addTextID(self, container, playerInfo) {
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

export function addPlayer(self, playerInfo) {
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  self.ship.body.setSize(80, 70, true);
  self.ship.health = PLAYER_HEALTH;
  self.ship.lifes = PLAYER_LIFES;
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
          player2: otherPlayer.playerId || "",
          player1: self.localPlayerId || "",
        });
      }
    );
    self.physics.add.collider(self.ship, self.asteroids, (player, asteroid) => {
      // Example: Reduce health on collision
      player.health -= 50;

      sendMessage(self, {
        type: "player_hit_asteroid",
        playerId: playerInfo.player_id,
        health: player.health,
      });
      self.ship.setActive(false).setVisible(false);
    });
  }
}

export function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add
    .image(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  otherPlayer.body.setSize(70, 70, true);
  otherPlayer.health = PLAYER_HEALTH;
  otherPlayer.lifes = PLAYER_LIFES;
  otherPlayer.healthBar = self.add.graphics();
  otherPlayer.container = self.add.container(playerInfo.x, playerInfo.y);
  otherPlayer.container.add(otherPlayer.healthBar);
  createUIForOtherPlayer(self);
  otherPlayer.score = 0;
  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.setBounce(0);
  otherPlayer.setMass(5);
  otherPlayer.setDrag(200);
  otherPlayer.setAngularDrag(150);
  otherPlayer.setMaxVelocity(200);
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
        player2: otherPlayer.playerId || "",
        player1: self.localPlayerId || "",
      });
    }
  );
}

// For more than two players.

// function updateHealthBar(self, player, player_id) {
//   player.healthBar.clear();
//   if (self.localPlayerId === player_id) {
//     player.healthBar.fillStyle(0x0000ff, 1);
//   } else {
//     player.healthBar.fillStyle(0xff0000, 1);
//   }
//   player.healthBar.fillRect(-25, -40, player.health / 2, 5);
// }
