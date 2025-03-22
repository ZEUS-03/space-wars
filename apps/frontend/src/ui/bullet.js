import { sendMessage } from "../utils/utils.js";

export function renderBullet(self, data) {
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

export function shootBullet(self) {
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
