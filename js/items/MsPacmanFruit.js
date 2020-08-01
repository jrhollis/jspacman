/**
 * Ms Pacman fruit behaves quite differently from Pacman fruit. It enters through
 * a random tunnel, makes its way toward the center of the maze, does one loop
 * around the ghost house and then chooses a random tunnel to exit through.
 */
class MsPacmanFruit extends Actor {
    static MODE_ENTER = 0;
    static MODE_LOOP = 1;
    static MODE_EXIT = 2;

    //this is a point inside the ghost house that causes the fruit to do the lap 
    //around the house when targeted
    static HOUSE_TARGET = { x: 13, y: 18 };

    constructor(scene) {
        super(scene, -16, -16, 16, 16);
        this.fruit = true;
        this.level = this.scene.level;
        if (this.level > 7) {
            //after level 7, randomly choose fruit
            this.level = Math.floor(Math.random() * 7);
        }
        this.textureOffset = { x: 504, y: 0 };
        //the fruit bounces up and down as it moves. this counter keeps track of that bounce
        this.bounceCtr = 0;
        //fruit enters through one of 2 or 4 set paths (depending on maze)
        this.mode = MsPacmanFruit.MODE_ENTER;
        this.enterSequence = this.scene.maze.chooseRandomFruitEntry();
        //place at spawn point
        this.x = this.enterSequence[0].x * 8;
        this.y = this.enterSequence[0].y * 8;
        this.direction = this.x < 1 ? Vector.RIGHT : Vector.LEFT;
        this.x -= this.direction.x * 4; //nudge off the screen
        //skip the first tile in the sequence which is the spawn point (a warp tile)
        this.turn = 1;
        this.targetTile = this.enterSequence[this.turn];
    }

    get speedControl() {
        return '00100010001000100010001000100010';
    }

    get hitBox() {
        return { x: this.x + 4, y: this.y + 4, w: 8, h: 8 }
    }

    get points() {
        return [100,200,500,700,1000,2000,5000][this.level-1];
    }

    eaten() {
        delete this.scene.fruit;
    }

    get isExiting() {
        return this.mode == MsPacmanFruit.MODE_EXIT;
    }
    get isEntering() {
        return this.mode == MsPacmanFruit.MODE_ENTER;
    }
    get isLooping() {
        return this.mode == MsPacmanFruit.MODE_LOOP;
    }
    get isDone() {
        return this.mode == MsPacmanFruit.MODE_DONE;
    }

    tick() {
        Actor.prototype.tick.call(this);        
        if (!this.frozen) {
            this.bounceCtr++;
            //play bounce sound when fruit hits the "floor"
            if (this.bounceCtr%8 == 0) {
                Sound.playOnce('fruit_bounce');
            }
        }
        
        if (this.isTileCenter && !this.madeInstruction) {
            if (this.isEntering && Vector.equals(this.tile, this.enterSequence[this.turn])) {
                if (this.turn < this.enterSequence.length - 1) {
                    this.targetTile = this.enterSequence[++this.turn];
                } else {
                    //mark this- once a full loop is made, choose an exit sequence
                    this.loopTarget = Vector.clone(this.targetTile);
                    //recycle this counter for the exit sequence
                    this.turn = 0;
                    //start looping
                    this.mode = MsPacmanFruit.MODE_LOOP;
                    //target ghost house
                    this.targetTile = MsPacmanFruit.HOUSE_TARGET;
                }
                this.madeInstruction = true;
            } else if (this.isLooping && Vector.equals(this.tile, this.loopTarget)) {
                //completed a lap around the ghost house now
                //randomly choose an exit sequence
                this.exitSequence = this.scene.maze.chooseRandomFruitExit();
                this.mode = MsPacmanFruit.MODE_EXIT;
                this.targetTile = this.exitSequence[this.turn];
                if (Vector.equals(this.targetTile, this.tile)) {
                    //already on the exit point. go to next in sequence
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && Vector.equals(this.tile, this.targetTile)) {
                //made it to the next target of the exit sequence
                if (this.turn < this.exitSequence.length - 1) {
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && (this.tile.x < 0 || this.tile.x > 27)) {
                //fruit has left the building, delete it from the scene
                delete this.scene.fruit;
            }
            //navigate the maze
            var centerPoint = this.centerPixel,
                nextPixel = { x: centerPoint.x + this.direction.x * 5, y: centerPoint.y + this.direction.y * 5 },
                testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };

            //this move would hit a wall, try to continue in same direction of travel
            if (this.scene.mazeClass.isWallTile(testTile) || this.scene.mazeClass.isHouseTile(testTile) || this.scene.mazeClass.isDecisionTile(this.tile)) {
                this.direction = this.calculateNextInstruction(this.tile);
                this.madeInstruction = true;
            }
        } else {
            if (!this.isTileCenter) {
                //off tile center, clear the last instruction
                delete this.madeInstruction;
            }
        }
    }

    draw() {
        Actor.prototype.draw.call(this);
        var offsetX = (this.level - 1) * 16,
            offsetBounce = 1.5 * Math.sin((this.bounceCtr / 16) * Math.PI) - 0.5;  //bounce the fruit up and down
        this.context.drawImage(RESOURCE.mspacman,
            this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
            this.x, this.y + offsetBounce, 16, 16
        );
    }
}