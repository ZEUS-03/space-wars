export function createAsteroids(self, positions) {
  if (!self.asteroids) self.asteroids = self.physics.add.group();
  const planetSizeMap = [
    { width: 80, height: 80 }, // planet1 (large)
    { width: 100, height: 100 }, // planet2 (large)
    { width: 105, height: 105 }, // planet3 (large)
    { width: 130, height: 130 }, // planet4 (large)
    { width: 90, height: 90 }, // planet5 (large)
  ];
  const sizeMap = [
    { width: 89, height: 82 }, // asteroid1 (large)
    { width: 98, height: 96 }, // asteroid2 (large)
    { width: 43, height: 43 }, // asteroid3 (medium)
    { width: 45, height: 40 }, // asteroid4 (medium)
    { width: 28, height: 28 }, // asteroid5 (small)
    { width: 29, height: 26 }, // asteroid6 (small)
    { width: 18, height: 18 }, // asteroid7 (tiny)
    { width: 16, height: 15 }, // asteroid8 (tiny)
  ];

  positions?.forEach((position, index) => {
    const positionX = position.x;
    const positionY = position.y;
    const spriteIndex = (index - 4) % 10;
    if (index < 5) {
      const size = planetSizeMap[index] || { width: 75, height: 75 };
      const asteroid = self.physics.add
        .image(positionX, positionY, `planet${index + 1}`)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(size.width, size.height);

      const radius = Math.min(size.width, size.height) / 2;

      // Set circular physics body with no offset (centered)
      asteroid.body.setCircle(
        radius, // Use radius that matches the visible size
        0, // No X offset - center the circle
        0 // No Y offset - center the circle
      );
      asteroid.body.moves = false;
      asteroid.setCollideWorldBounds(true);
      self.asteroids.add(asteroid);
    } else {
      if (spriteIndex != 8 && spriteIndex != 9) {
        const size = sizeMap[spriteIndex] || { width: 75, height: 75 };
        const asteroid = self.physics.add
          .image(positionX, positionY, `asteroid${spriteIndex + 1}`)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(size.width, size.height);

        const radius = Math.min(size.width, size.height) / 2;

        // Set circular physics body with no offset (centered)
        asteroid.body.setCircle(
          radius, // Use radius that matches the visible size
          0, // No X offset - center the circle
          0 // No Y offset - center the circle
        );
        asteroid.body.moves = false;
        asteroid.setCollideWorldBounds(true);
        self.asteroids.add(asteroid);
      }
    }
  });
}
