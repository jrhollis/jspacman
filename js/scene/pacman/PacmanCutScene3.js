/**
 * after level 9
 * blinky chases pacman again right to left. he slinks back across
 * the screen naked, pulling his sheet behind him.
 */
class PacmanCutScene3 extends ScriptScene {
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
                this.blinky.animation = Blinky.ANIM_PATCH;
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

            120: () => {
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

            320: () => {
                //exit stage: pacman
                this.blinky.stop();
                this.blinky.hide();
            },

            400: () => {
                this.blinky.animation = Blinky.ANIM_NAKED;
                this.blinky.direction = Vector.RIGHT;
                this.blinky.nextInstruction = Vector.RIGHT;
                this.blinky.show();
                this.blinky.start();
            },
            430: () => { Sound.playOnce('intermission'); },
            590: () => {
                this.blinky.hide();
                this.blinky.stop();
            },
            629: () => { Sound.stop('intermission'); },
            630: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);

        this.drawables = [
            this.pacman, this.blinky, this.levelSprite
        ];
        this.actors = [
            this.pacman, this.blinky
        ];
        this.level = 9;
        this.pelletsLeft = 1;
    }
}