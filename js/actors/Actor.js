class Actor extends Sprite {

    //turn preferences priority list- used by ghosts and ms pacman fruit.
    //if there's a tie for which valid turns to make at a decision point, choose the first 
    //one of the matches in this list
    static TURN_PREFERENCE = [Vector.LEFT, Vector.UP, Vector.RIGHT, Vector.DOWN];

    constructor(board, x, y, width, height) {
        super(board, x, y, width, height);
        this.frameCtr = 0;
    }

    reset() {
        this.show();
        this.freeze();
        this.position = Vector.clone(this.startPosition);
        this.direction = Vector.clone(this.startDirection);
        this.frameCtr = 0;
    }

    //is this actor centered on a tile?
    get isTileCenter() {
        var tile = this.tile,
            pixel = this.position;
        return tile.x*8 == pixel.x+4 && tile.y*8 == pixel.y+4;
    }

    //start and stop movement (but not animation)
    stop() {
        this.stopped = true;
    }
    start() {
        this.stopped = false;
    }

    tick() {
        if (!this.stopped) {
            //update position of actor
            this.x += (this.speed * this.direction.x);
            this.y += (this.speed * this.direction.y);

            //counter used for speed control
            this.frameCtr = (this.frameCtr+1) % 32;

            //warp tunnel wrap-around- if actor goes through tunnel, make them loop out from the other side
            if (this.tile.x == 29 && this.direction.x == 1) {
                this.x = (-2 * 8);
            } else if (this.tile.x == -2 && this.direction.x == -1) {
                this.x = (29 * 8);
            }
        }
    }

    get speed() {
        try {
            return parseInt(this.speedControl[this.frameCtr]);
        } catch(ex) {
            return 0;
        }
    }
}