import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const PhaserGame = ({ players, localPlayerId, sendMessage }) => {
  const phaserContainer = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: phaserContainer.current,
      width: 600,
      height: 400,
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
      scene: {
        preload,
        create,
        update,
      },
    };

    const game = new Phaser.Game(config);
    let playerSprites = {}; // Stores all player sprites by their IDs
    let cursors;

    function preload() {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x00ff00, 1);
      graphics.fillCircle(20, 20, 20); // Creates a green circle texture
      graphics.generateTexture("player", 40, 40);
      graphics.destroy();
    }

    function create() {
      // Add players from props
      players.forEach((player) => {
        const { x, y } = player;
        addPlayer(this, player.id, x, y);
      });

      // Set up keyboard input
      cursors = this.input.keyboard.createCursorKeys();
    }

    function update() {
      const player = playerSprites[localPlayerId];
      if (player && cursors) {
        let moved = false;

        if (cursors.up.isDown) {
          player.y -= 2;
          moved = true;
        } else if (cursors.down.isDown) {
          player.y += 2;
          moved = true;
        }

        if (cursors.left.isDown) {
          player.x -= 2;
          moved = true;
        } else if (cursors.right.isDown) {
          player.x += 2;
          moved = true;
        }

        if (moved) {
          player.label.setPosition(player.x, player.y - 25);

          if (!this.lastSentTime || Date.now() - this.lastSentTime > 1000) {
            this.lastSentTime = Date.now();
            sendMessage({
              type: "update_position",
              id: localPlayerId,
              x: player.x,
              y: player.y,
            });
          }
        }
      }

      // Update positions for all other players
      players.forEach((player) => {
        const playerId = player.id;
        if (playerId !== localPlayerId && playerSprites[playerId]) {
          const { x, y } = player;
          playerSprites[playerId].setPosition(x, y);
          playerSprites[playerId].label.setPosition(x, y - 25);
        }
      });
    }

    function addPlayer(scene, id, x, y) {
      if (!playerSprites[id]) {
        const sprite = scene.physics.add.sprite(x, y, "player");
        const label = scene.add.text(x, y - 25, id.slice(-4), {
          font: "12px Arial",
          fill: "#ffffff",
        });

        sprite.label = label;
        playerSprites[id] = sprite;
      }
    }

    // Clean up Phaser instance on unmount
    return () => {
      game.destroy(true, false);
    };
  }, [players, localPlayerId]);

  return (
    <div ref={phaserContainer} style={{ width: "100%", height: "100%" }} />
  );
};

export default PhaserGame;
