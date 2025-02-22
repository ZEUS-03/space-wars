const PLAY_AREA = {
  x: 5, // Left boundary
  y: 5, // Top boundary
  width: 795, // Play area width
  height: 595, // Play area height
};

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 800,
  height: 600,
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
  this.load.image("ship", "/apps/frontend/public/assets/playerShip2_blue.png");
  this.load.image(
    "otherPlayer",
    "/apps/frontend/public/assets/enemyBlack3.png"
  );
}
function create() {
  var self = this;
  this.playersGroup = this.physics.add.group();
  this.otherPlayers = this.add.group();
  this.socket = new WebSocket("ws://localhost:8080/ws?room_id=room123");
  this.socket.onopen = () => {
    console.log("WebSocket connection established");
    // Example: Send a message to the server
    this.socket.send("Hello, server!");
  };
  this.socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleEvent(self, data);
    console.log("Message from server:", event.data);
  };
  this.socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  this.cursors = this.input.keyboard.createCursorKeys();
  // this.physics.add.collider(this.playersGroup, this.playersGroup);
  console.log("this.playersGroup", this.playersGroup);
}
function update() {
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
  console.log("Event data type", data.type);
  switch (data.type) {
    case "player_id_assigned":
      self.localPlayerId = data.player_id;
      break;
    case "all_players_position":
      console.log(self.localPlayerId);
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
        console.log("otherPlayer", otherPlayer);

        if (data.player_id === otherPlayer.playerId) {
          otherPlayer.setRotation(data.rotation);
          otherPlayer.setPosition(data.x, data.y);
        }
      });
      break;
    case "player_disconnected":
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (data.player_id === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
  }
}
function addPlayer(self, playerInfo) {
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);

  self.ship.setCollideWorldBounds(true);
  self.ship.setBounce(0);
  self.ship.setMass(5);
  self.ship.setDrag(200);
  self.ship.setAngularDrag(150);
  self.ship.setMaxVelocity(200);
  // self.ship.setPushable(false);
  self.playersGroup.add(self.ship);

  // if (playerInfo.team === "blue") {
  self.ship.setTint(0x0000ff);
  // } else {
  //   self.ship.setTint(0xff0000);
  // }
  // addTextID(self, playerInfo);
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
  self.physics.add.overlap(
    self.ship,
    self.playersGroup,
    (player, otherPlayer) => {
      console.log("Collision detected!");
      player.setVelocity(0, 0);
      player.setAcceleration(0);
      player.setAngularVelocity(0);

      otherPlayer.setVelocity(0, 0);
      otherPlayer.setAcceleration(0);
      otherPlayer.setAngularVelocity(0);

      sendMessage(this, {
        type: "collision_detected",
        id: this.localPlayerId,
      });
    }
  );
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add
    .image(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);

  otherPlayer.setCollideWorldBounds(true);
  otherPlayer.setBounce(0);
  otherPlayer.setMass(5);
  otherPlayer.setDrag(200);
  otherPlayer.setAngularDrag(150);
  otherPlayer.setMaxVelocity(200);
  // otherPlayer.setPushable(true);
  self.playersGroup.add(otherPlayer); // Add to physics group

  // if (playerInfo.team === "blue") {
  //   otherPlayer.setTint(0x0000ff);
  // } else {
  otherPlayer.setTint(0xff0000);
  // }
  // addTextID(self, playerInfo);
  otherPlayer.playerId = playerInfo.player_id;
  self.otherPlayers.add(otherPlayer);
  self.physics.add.overlap(
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

      sendMessage(this, {
        type: "collision_detected",
        id: otherPlayer,
      });
    }
  );
}

function addTextID(self, playerInfo) {
  self.ship.nameText = self.add
    .text(playerInfo.x, playerInfo.y + 30, playerInfo.id.slice(-4), {
      font: "16px Arial",
      fill: "#ffffff",
    })
    .setOrigin(0.5, 0.5); // Center the text horizontally

  // Sync text position with the ship in the update loop
  self.ship.updateTextPosition = function () {
    self.ship.nameText.setPosition(self.ship.x, self.ship.y + 30);
  };
}

function sendMessage(self, message) {
  if (self.socket && self.socket.readyState === WebSocket.OPEN) {
    self.socket.send(JSON.stringify(message));
  }
}
