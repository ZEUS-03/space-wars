import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const PhaserGame = ({ sendMessage, players, localPlayerId }) => {
  const phaserContainer = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: phaserContainer.current,
      width: 800,
      height: 600,
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
          playerSprites[id] = sprite;

          const text = this.add.text(player.x + 25, player.y + 10, id, {
            font: "12px Arial",
            fill: "#ffffff",
            align: "center",
          });
          text.setOrigin(0.5); // Center the text horizontally
          playerSprites[id].label = text;
        }
      });

      // Keyboard input for local player
      this.input.keyboard.on("keydown", (event) => {
        const localSprite = playerSprites[localPlayerId];
        if (!localSprite) return;
        console.log(playerSprites);
        let x = localSprite.x;
        let y = localSprite.y;

        switch (event.key) {
          case "ArrowUp":
            y -= 10;
            break;
          case "ArrowDown":
            y += 10;
            break;
          case "ArrowLeft":
            x -= 10;
            break;
          case "ArrowRight":
            x += 10;
            break;
          default:
            return;
        }

        // Update local sprite position
        localSprite.setPosition(x, y);

        // Notify the server of the position update
        sendMessage({
          type: "update_position",
          id: localPlayerId,
          x,
          y,
        });
      });
    }

    function update() {
      // Update positions of all sprites based on the `players` state
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
