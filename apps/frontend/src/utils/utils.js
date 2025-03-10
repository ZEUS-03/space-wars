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
