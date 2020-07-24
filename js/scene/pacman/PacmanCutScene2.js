/**
 * after level 5
 * blinky chases pacman right to left. blinky's sheet gets caught on a nail
 * his sheet gets torn
 */
class PacmanCutScene2 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
                this.rip = 0;
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_NORMAL;
                this.pacman.direction = Vector.LEFT;
                this.pacman.position = Vector.clone(this.pacman.startPosition);
                this.pacman.stop();

                this.blinky.hide();
                this.blinky.status = Ghost.STATUS_PATROL;
                this.blinky.mode = Ghost.MODE_CHASE;
                this.blinky.animation = Ghost.ANIM_SCATTER_CHASE;
                this.blinky.direction = Vector.LEFT;
                this.blinky.nextInstruction = Vector.LEFT;
                this.blinky.position = Vector.clone(this.blinky.startPosition);
                this.blinky.stop();

            },
            100: () => {
                Sound.playOnce('intermission');
                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();
            },

            175: () => {
                //here comes blinky
                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },

            290: () => {
                //exit stage: pacman
                this.pacman.stop();
                this.pacman.hide();
            },
            288: () => {
                //slow the ghost
                this.blinky.stop();
            },
            304: () => {
                this.blinky.x -= 1;
                this.rip = 1;
            },
            310: () => {
                this.blinky.x -= 1;
            },
            316: () => {
                this.blinky.x -= 1;
            },
            322: () => {
                this.blinky.x -= 1;
                this.rip = 2;
            },
            328: () => {
                this.blinky.x -= 1;
            },
            334: () => {
                this.blinky.x -= 1;
            },
            340: () => {
                this.blinky.x -= 1;
            },
            346: () => {
                this.blinky.x -= 1;
            },
            352: () => {
                this.blinky.x -= 1;
                this.rip = 3;
                this.blinky.freeze();
            },
            400: () => {
                this.rip = 4;
                this.blinky.x -= 1;
                this.blinky.direction = Vector.RIGHT;
                this.blinky.nextInstruction = Vector.RIGHT;
                this.blinky.animation = Blinky.ANIM_RIP;
                this.blinky.unfreeze();
            },
            430: () => { Sound.playOnce('intermission'); },
            520: () => {
                this.blinky.freeze();
            },
            599: () => {
                Sound.stop('intermission');
            },
            600: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.actors = [this.pacman, this.blinky];
        this.levelSprite = new PacmanLevelSprite(this);
        this.level = 5;
    }

    draw() {
        //don't use drawables because order is important
        ScriptScene.prototype.draw.call(this)
        this.pacman.draw();
        //draw the nail
        this.context.drawImage(RESOURCE.pacman,
            584, 96, 16, 16, 14*8, (19.5*8)-1, 16, 16
        );
        if (this.rip) {
            this.context.drawImage(RESOURCE.pacman,
                600 + ((this.rip-1) * 16), 96, 16, 16, 14*8, (19.5*8)-1, 16, 16
            );    
        }
        this.blinky.draw();
        this.levelSprite.draw();
    }}