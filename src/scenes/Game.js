import Carrot from '../game/Carrot.js';
import Phaser from '../lib/phaser.js';

// preload() and create() are hooks that get called appropriate times by Phaser.
// preload() is called to allow us specify images, audio, or other assets to load before starting a scene.
// create() is called once all the assets for the scene that have been loaded. Only assets that are loaded in scene are used in create().
// if we load an asset that has not been loaded, that will result in an error.

export default class Game extends Phaser.Scene {
    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms;

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player;

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors;

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots;

    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText;

    // platformCount = 0;
    carrotsCollected = -1;

    constructor() {
        super('game');
    }

    init() {
        this.carrotsCollected = -1;
    }

    preload() {
        // environment assets
        this.load.image('background', 'assets/PNG/Background/bg_layer1.png');
        this.load.image('platform', 'assets/PNG/Environment/ground_grass.png');

        //player assets
        this.load.image('player', 'assets/PNG/Players/bunny2_stand.png');
        this.load.image('player-jump', 'assets/PNG/Players/bunny2_jump.png');

        this.load.image('carrot', 'assets/PNG/Items/carrot.png');

        this.load.audio('jump', 'assets/phaseJump1.ogg');

        this.cursors = this.input.keyboard.createCursorKeys();
    }
    create() {
        this.add.image(240, 320, 'background').setScrollFactor(1, 0);

        // the below is an image without physics
        // this.add.image(240, 320, 'platform').setScale(0.5);

        // platform with physics.
        // this.physics.add.image(240, 320, 'platform').setScale(0.5);

        // the platform falls off. but we need platform to stay static. so we can use add.staticImage().
        // we need more than one platform, so we can use add.staticGroup()

        this.platforms = this.physics.add.staticGroup();
        for (let i = 0; i < 5; ++i) {
            const x = Phaser.Math.Between(80, 400);
            const y = 150 * i;

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform');
            platform.setScale(0.5);

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body;
            body.updateFromGameObject();
        }

        // player sprite
        this.player = this.physics.add.sprite(240, 320, 'player').setScale(0.5);
        this.physics.add.collider(this.platforms, this.player);
        this.player.body.checkCollision.up = false;
        this.player.body.checkCollision.left = false;
        this.player.body.checkCollision.right = false;

        this.cameras.main.startFollow(this.player);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setDeadzone(this.scale.width * 1.5);

        // create carrots

        // const carrot = new Carrot(this, 240, 320, 'carrot');
        // this.add.existing(carrot);

        this.carrots = this.physics.add.group({
            classType: Carrot,
        });
        this.carrots.get(240, 320, 'carrot');
        this.physics.add.collider(this.platforms, this.carrots);

        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot,
            undefined,
            this
        );

        const style = { color: '#000', fontSize: 24 };
        this.carrotsCollectedText = this.add
            .text(240, 10, 'Carrots: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0);
    }

    update() {
        this.platforms.children.iterate((child) => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child;
            const scrollY = this.cameras.main.scrollY;
            if (platform.y >= scrollY + 700) {
                // tweeked to 90 because some platforms are too high for the bunny to jump.
                platform.y = scrollY - Phaser.Math.Between(50, 90);
                platform.body.updateFromGameObject();

                this.addCarrotAbove(platform);
            }
        });

        const touchingDown = this.player.body.touching.down;

        if (touchingDown) {
            // this.platformCount += 1;
            this.player.setVelocityY(-300);
            this.player.setTexture('player-jump');
            this.sound.play('jump');
        }

        const vy = this.player.body.velocity.y;
        if (vy > 0 && this.player.texture.key !== 'player') {
            this.player.setTexture('player');
        }

        // if (
        //     this.cursors.space.isDown &&
        //     !touchingDown &&
        //     this.platformCount >= 5
        // ) {
        //     this.platformCount = 0;
        //     this.player.setVelocityY(-1000);
        // }
        else if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        this.horizontalWrap(this.player);

        const bottomPlatform = this.findBottomMostPlatform();
        if (this.player.y > bottomPlatform.y + 200) {
            // console.log('GameOver');
            this.scene.start('game-over');
        }
    }

    // to wrap the player horizontally
    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    horizontalWrap(sprite) {
        const halfWidth = sprite.displayWidth * 0.5;
        const gameWidth = this.scale.width;
        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth;
        } else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = -halfWidth;
        }
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    addCarrotAbove(sprite) {
        const y = sprite.y - sprite.displayHeight;
        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot');

        // to stop collision jump on touching carrots
        carrot.body.checkCollision.up = false;

        carrot.setActive(true);
        carrot.setVisible(true);

        this.add.existing(carrot);

        carrot.body.setSize(carrot.width, carrot.height);
        this.physics.world.enable(carrot);
        return carrot;
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Carrot} carrot
     */
    handleCollectCarrot(player, carrot) {
        this.carrots.killAndHide(carrot);
        this.physics.world.disableBody(carrot.body);
        this.carrotsCollected += 1;

        const value = `Carrots: ${this.carrotsCollected}`;
        this.carrotsCollectedText.text = value;
    }

    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren();
        let bottomPlatform = platforms[0];
        for (let i = 0; i < platforms.length; i++) {
            const platform = platforms[i];
            if (platform.y < bottomPlatform.y) {
                continue;
            }
            bottomPlatform = platform;
        }

        return bottomPlatform;
    }
}
