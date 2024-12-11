import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const PhaserGame = ({ sendMessage, players, localPlayerId }) => {
  const phaserContainer = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: phaserContainer.current,
      width: 400,
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
    let playerSprites = {}; // Map of player sprites

    function preload() {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x00ff00, 0.8);
      graphics.fillCircle(20, 20, 20); // A basic green circle
      graphics.generateTexture("player", 40, 40);

      // graphics.destroy();
    }

    function create() {
      // Add sprites for all players

      players.forEach((player) => {
        const id = player["id"];

        if (!playerSprites[id]) {
          const sprite = this.physics.add.sprite(player.x, player.y, "player");
          playerSprites[`${id}`] = sprite;
          console.log("id", id);
          const text = this.add.text(player.x + 25, player.y + 10, id, {
            font: "12px Arial",
            fill: "#ffffff",
            align: "center",
          });
          text.setOrigin(0.5); // Center the text horizontally
          playerSprites[id].label = text;
        }
      });

      this.cursors = this.input.keyboard.createCursorKeys();
      console.log(playerSprites);
    }

    function update() {
      // Update positions of all sprites based on the `players` state
      // console.log("players", players);
      // console.log("entered update");
      const localSprite = playerSprites[localPlayerId];
      // console.log("playerSprites", playerSprites);
      if (localSprite && this.cursors) {
        let moved = false; // Track if the player moved

        if (this.cursors.up.isDown) {
          localSprite.y -= 2;
          moved = true;
        } else if (this.cursors.down.isDown) {
          localSprite.y += 2;
          moved = true;
        }
        if (this.cursors.left.isDown) {
          localSprite.x -= 2;
          moved = true;
        } else if (this.cursors.right.isDown) {
          localSprite.x += 2;
          moved = true;
        }
        // Update local sprite position
        localSprite.setPosition(localSprite.x, localSprite.y);

        if (moved) {
          // Notify the server of the new position
          sendMessage({
            type: "update_position",
            id: localPlayerId,
            x: localSprite.x,
            y: localSprite.y,
          });
        }
      }

      Object.keys(players).forEach((id) => {
        if (!playerSprites[id]) {
          // Add new players dynamically
          const player = players[id];
          const sprite = this.physics.add.sprite(player.x, player.y, "player");
          sprite.setCollideWorldBounds(true);
          playerSprites[id] = sprite;
        } else {
          // Update existing players' positions
          const sprite = playerSprites[id];
          sprite.setPosition(players[id].x, players[id].y);
        }
      });

      // Remove sprites for players no longer in the state
      Object.keys(playerSprites).forEach((id) => {
        if (!players[id]) {
          playerSprites[id].destroy();
          delete playerSprites[id];
        }
      });
    }

    // Clean up Phaser instance on unmount
    return () => {
      game.destroy(true);
    };
  }, [players, sendMessage]);

  return (
    <div ref={phaserContainer} style={{ width: "100%", height: "100%" }} />
  );
};

export default PhaserGame;
