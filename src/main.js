import Phaser from './lib/phaser.js';
import Game from './scenes/Game.js';
import GameOver from './scenes/GameOver.js';

// phaser.AUTO means that it will decide to use Canvas or WebGL mode depending on the browser and device.
// Canvas and WebGL are two different ways Phaser can render game in a browser.
export default new Phaser.Game({
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    scene: [Game, GameOver],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 200,
            },
            // debug: true,
        },
    },
});

// Create Phaser Game
