/**
 * after level 2
 * Blinky chases pacman from right to left off the screen. blinky comes back
 * left to right, frightened. pacman appears chasing him and is giant sized
 */
class PacmanCutScene1 extends ScriptScene {
    constructor(context) {
        super(context, {
            1: () => {
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
                Sound.playOnce('intermission')

                this.pacman.show();
                this.pacman.start();
                this.pacman.unfreeze();

                this.blinky.show();
                this.blinky.start();
                this.blinky.unfreeze();
            },
            310: () => {
                this.pacman.stop();
                this.pacman.hide();
                this.pacman.animation = Pacman.ANIM_GIANT;
            },
            325: () => {
                this.blinky.stop();
                this.blinky.hide();
            },
            375: () => {
                this.blinky.direction = Vector.RIGHT;
                this.blinky.frighten();
                this.blinky.show();
                this.blinky.start();
            },
            430: () => { Sound.playOnce('intermission'); },
            540: () => {
                this.pacman.direction = Vector.RIGHT;
                this.pacman.y -= 16;
                this.pacman.show();
                this.pacman.start();
            },
            722: () => {
                this.blinky.stop();
                this.blinky.hide();
            },
            751: () => {
                this.pacman.hide();
                this.pacman.stop();
            },
            850: 'end'
        });

        this.pacman = new Pacman(this, 27.75 * 8, 19.5 * 8);
        this.blinky = new Blinky(this, 31 * 8, 19.5 * 8);
        this.levelSprite = new PacmanLevelSprite(this);
        this.drawables = [
            this.pacman, this.blinky, this.levelSprite
        ];
        this.actors = [this.pacman, this.blinky];
        this.level = 2;
        this.pelletsLeft = 1; //engage cruise elroy 2
    }
}