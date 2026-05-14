// main.js - Entry Point, wires everything together
window.addEventListener('DOMContentLoaded', () => {
  // Button handlers
  document.getElementById('btn-new-game').addEventListener('click', () => {
    Sound.resume();
    Game.startNewGame();
  });

  document.getElementById('btn-load-game').addEventListener('click', () => {
    Sound.resume();
    if (SaveSystem.hasSave()) {
      Game.continueGame();
    } else {
      Game.startNewGame();
    }
  });

  document.getElementById('btn-respawn').addEventListener('click', () => {
    Game.respawn();
  });

  // Shop E key near shop tiles
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE' && Game.state === 'playing' && !Shop.isOpen) {
      const tile = MAP.tileAt(Player.x, Player.y);
      if (tile === MAP.T.SHOP) {
        Shop.open();
      }
    }
  });

  // Init game engine (shows loading screen)
  Game.init();
});
