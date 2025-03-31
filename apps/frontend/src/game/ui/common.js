export function showGameOverModal(self) {
  let modalContainer = self.add.container(
    self.cameras.main.width / 2,
    self.cameras.main.height / 2
  );

  let background = self.add
    .rectangle(0, 0, 400, 200, 0x000000, 0.8)
    .setOrigin(0.5);
  let text = self.add
    .text(0, -50, "Game Over", { fontSize: "32px", fill: "#fff" })
    .setOrigin(0.5);
  let restartButton = self.add
    .text(0, 40, "Restart", { fontSize: "24px", fill: "#ff0000" })
    .setOrigin(0.5)
    .setInteractive()
    .on("pointerdown", () => {
      location.reload();
    });

  modalContainer.add([background, text, restartButton]);
  modalContainer.setDepth(10); // Ensure it appears above everything else
}

// TODO: waiting fot other player functionality
// TODO: Room capacity should be 2 players only //
