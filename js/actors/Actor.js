/**
 * base class for pacmans, ghosts, and ms pacman fruit. actor is
 * a base class for anything that moves around a scene
 */
class Actor extends Sprite {

    //turn preferences priority list- used by ghosts and ms pacman fruit.
    //if there's a tie for which valid turns to make at a decision point, choose the first 
    //one of the matches in this list
    static TURN_PREFERENCE = [Vector.LEFT, Vector.UP, Vector.RIGHT, Vector.DOWN];

    constructor(scene, x, y, width, height) {
        super(scene, x, y, width, height);
        this.startPosition = { x: x, y: y };
        //frame counter keeps track of which value to select from speedControl string
        //this gets incremented twice per tick and loops back to zero after 31
        this.frameCtr = 0;
    }

    /**
     * return the actor to it's starting place
     */
    reset() {
        this.show();
        this.freeze();
        this.position = Vector.clone(this.startPosition);
        this.direction = Vector.clone(this.startDirection);
        this.frameCtr = 0;
    }

    /**
     * look at a tile on the map and determine what the ghost's (ms pacman fruit) next move should be 
     * if/when it reaches that tile
     * @param {*} atTile  the tile at which to base the calculation
     */
    calculateNextInstruction(atTile) {
        var choice = -1,
            closest = Infinity,
            validChoices = [];    //keep track of non-wall hitting moves for random selection (i.e. frightened mode)
        //cycle through the turn preferences list: UP, LEFT, DOWN, RIGHT
        for (var i = 0; i < Actor.TURN_PREFERENCE.length; i++) {
            var testDirection = Actor.TURN_PREFERENCE[i];
            // can't reverse go back the way we just came
            if (!Vector.equals(Vector.inverse(this.direction), testDirection)) {
                //calculate distance from testTile to targetTile and check if it's the closest
                var testTile = Vector.add(atTile, testDirection),
                    distance = Vector.distance(testTile, this.targetTile);
                if (this.scene.mazeClass.isWalkableTile(testTile)) {
                    //this is a valid turn to make
                    validChoices.push(i);
                    if (distance < closest) {
                        //this choice gets the ghost the closest so far
                        choice = i;
                        closest = distance;
                    }
                }
            }
        }
        // when ghost is frightened override turn choice with random selection from validChoices
        if (!this.isEaten && (this.isFrightened || this.randomScatter)) {
            choice = validChoices[Math.floor(Math.random() * validChoices.length)];
        }
        //set next direction to be the choice the ghost just made
        return Actor.TURN_PREFERENCE[choice];
    }
    
    //is this actor centered on a tile?
    get isTileCenter() {
        return this.tile.x*8 == this.x+4 && this.tile.y*8 == this.y+4;
    }

    //start and stop movement (but not animation)
    stop() {
        this.stopped = true;
    }
    start() {
        this.stopped = false;
    }

    /**
     * this gets called twice per frame.
     */
    tick() {
        if (!this.stopped) {
            //update position of actor
            this.x += (this.speed * this.direction.x);
            this.y += (this.speed * this.direction.y);

            //counter used for speed control
            this.frameCtr = (this.frameCtr+1) % 32;

            //warp tunnel wrap-around- if actor goes through tunnel, 
            // make them loop out from the other side
            if (this.tile.x == 30 && this.direction.x == 1) {
                this.x = (-3 * 8)+2;
            } else if (this.tile.x == -2 && this.direction.x == -1) {
                this.x = (30 * 8)-2;
            }
        }
    }

    /**
     * get the value at index:frameCtr from the speedControl string. this will be how
     * many pixels the actor should move next half tick
     */
    get speed() {
        try {
            return parseInt(this.speedControl[this.frameCtr]);
        } catch(ex) {
            return 0;
        }
    }
}