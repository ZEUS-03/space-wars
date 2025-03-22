import { updateHealthBar } from "../ui/player.js";

export function sendMessage(self, message) {
  if (self.socket && self.socket.readyState === WebSocket.OPEN) {
    self.socket.send(JSON.stringify(message));
  }
}

export function updateScore(self, shooterId, score) {
  if (self.localPlayerId === shooterId) {
    self.ship.score = score;
    self.player1ScoreText.setText("Score: " + self.ship.score);
  } else {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (otherPlayer.playerId === shooterId) {
        otherPlayer.score = score;
        self.player2ScoreText.setText("Score: " + otherPlayer.score);
      }
    });
  }
}

export function updateLifes(self, player, lifes, container) {
  const currentLifeImg = container.getAt(2);
  switch (lifes) {
    case 3:
      currentLifeImg.setTexture("numeral3");
      break;
    case 2:
      currentLifeImg.setTexture("numeral2");
      break;
    case 1:
      currentLifeImg.setTexture("numeral1");
      break;
    case 0:
      currentLifeImg.setTexture("numeral0");
      player.destroy();
      player.container.destroy();
      break;
    default:
      break;
  }
}

export function destroyPlayer(player) {
  player.destroy();
  player.container.destroy();
}

export function spawnPlayer(player, playerInfo, playerHealthToUpdate) {
  updateHealthBar(playerHealthToUpdate, 0);
  player.setVelocity(0, 0);
  player.setActive(false).setVisible(false);
  player.container.setActive(false).setVisible(false);
  player.setPosition(playerInfo.position.x, playerInfo.position.y);
  player.container.setPosition(playerInfo.position.x, playerInfo.position.y);
  player.setRotation(playerInfo.position.rotation);
  player.Health = playerInfo.health;
  player.Lifes = playerInfo.lifes;
  player.Score = playerInfo.score;
  setTimeout(() => {
    player.setActive(true).setVisible(true);
    player.container.setActive(true).setVisible(true);
    updateHealthBar(playerHealthToUpdate, playerInfo.health);
  }, 2000);
}

export function updateContainerPosition(player, x, y, rotation) {
  player.container.setPosition(x, y);
  player.container.setRotation(rotation);
}
