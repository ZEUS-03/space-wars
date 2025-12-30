export function showGameOverModal(self, winnerId) {
  const isLoser = self.localPlayerId === winnerId;
  let modalContainer = self.add.container(
    self.cameras.main.width / 2,
    self.cameras.main.height / 2
  );

  // Dark overlay background (covers entire screen)
  let overlay = self.add
    .rectangle(
      0,
      0,
      self.cameras.main.width,
      self.cameras.main.height,
      0x000000,
      0.85
    )
    .setOrigin(0.5);

  // Main modal background with border
  let modalBg = self.add
    .rectangle(0, 0, 500, 300, 0x0a0a1a, 1)
    .setOrigin(0.5)
    .setStrokeStyle(3, isLoser ? 0xff4444 : 0x00ff88);

  // Inner glow effect
  let innerGlow = self.add
    .rectangle(0, 0, 490, 290, isLoser ? 0xff4444 : 0x00ff88, 0.1)
    .setOrigin(0.5);

  // Title text with glow
  let title = self.add
    .text(0, -80, isLoser ? "DEFEAT" : "VICTORY!", {
      fontSize: "48px",
      fill: isLoser ? "#ff4444" : "#00ff88",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
      stroke: isLoser ? "#ff4444" : "#00ff88",
      strokeThickness: 2,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: isLoser ? "#ff4444" : "#00ff88",
        blur: 10,
        fill: true,
      },
    })
    .setOrigin(0.5);

  // Subtitle text
  let subtitle = self.add
    .text(
      0,
      -20,
      isLoser ? "Your ship was destroyed" : "You are the last ship standing!",
      {
        fontSize: "18px",
        fill: "#aaaaaa",
        fontFamily: "Arial, sans-serif",
      }
    )
    .setOrigin(0.5);

  // Decorative lines
  let topLine = self.add
    .rectangle(0, -50, 300, 2, isLoser ? 0xff4444 : 0x00ff88, 0.5)
    .setOrigin(0.5);

  let bottomLine = self.add
    .rectangle(0, 10, 300, 2, isLoser ? 0xff4444 : 0x00ff88, 0.5)
    .setOrigin(0.5);

  let buttonBg = self.add
    .rectangle(0, 80, 200, 50, 0x1a1a2e, 1)
    .setOrigin(0.5)
    .setStrokeStyle(2, 0x00ff88)
    .setInteractive({ useHandCursor: true });

  // Button hover effect
  buttonBg.on("pointerover", () => {
    buttonBg.setFillStyle(0x00ff88, 0.2);
    buttonBg.setStrokeStyle(3, 0x00ff88);
    buttonText.setColor("#00ff88");
  });

  buttonBg.on("pointerout", () => {
    buttonBg.setFillStyle(0x1a1a2e, 1);
    buttonBg.setStrokeStyle(2, 0x00ff88);
    buttonText.setColor("#ffffff");
  });

  buttonBg.on("pointerdown", () => {
    // Button press animation
    self.tweens.add({
      targets: buttonBg,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        location.reload();
      },
    });
  });

  // Restart button text
  let buttonText = self.add
    .text(0, 80, "RESTART", {
      fontSize: "24px",
      fill: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  // Make button text also trigger hover
  buttonText.setInteractive({ useHandCursor: true });
  buttonText.on("pointerover", () => buttonBg.emit("pointerover"));
  buttonText.on("pointerout", () => buttonBg.emit("pointerout"));
  buttonText.on("pointerdown", () => buttonBg.emit("pointerdown"));

  // Add all elements to container
  modalContainer.add([
    overlay,
    modalBg,
    innerGlow,
    topLine,
    bottomLine,
    title,
    subtitle,
    buttonBg,
    buttonText,
  ]);

  modalContainer.setDepth(1000);

  // Entrance animation
  modalContainer.setAlpha(0);
  modalContainer.setScale(0.8);

  self.tweens.add({
    targets: modalContainer,
    alpha: 1,
    scale: 1,
    duration: 400,
    ease: "Back.easeOut",
  });

  // Title pulse animation
  self.tweens.add({
    targets: title,
    scale: { from: 1, to: 1.1 },
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}

// TODO: waiting fot other player functionality
// TODO: Room capacity should be 2 players only //
