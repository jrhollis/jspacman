class MsPacmanFruit extends Actor {
    static MODE_ENTER = 0;
    static MODE_LOOP = 1;
    static MODE_EXIT = 2;

    static TURN_PREFERENCE = [Vector.LEFT, Vector.UP, Vector.RIGHT, Vector.DOWN];

    constructor(scene) {
        super(scene, -16, -16, 16, 16);

        this.level = this.scene.level;
        if (this.level > 7) {
            //after level 7, randomly choose fruit
            this.level = Math.floor(Math.random() * 7) + 1;
        }
        this.textureOffset = { x: 504, y: 0 };
        this.fruit = true;

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
        this.targetTile = this.enterSequence[1];
        this.turn = 1;
    }



    get hitBox() {
        return { x: this.position.x + 4, y: this.position.y + 4, w: 8, h: 8 }
    }

    get points() {
        switch (this.level) {
            case 1:
                return 100;     //cherry
            case 2:
                return 200;     //strawberry
            case 3:
                return 500;     //orange
            case 4:
                return 700;     //pretzel
            case 5:
                return 1000;    //apple
            case 6:
                return 2000;    //pear
            case 7:
                return 5000;    //banana
        }
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

    chooseNextDirection(atTile) {

        var choice = -1,
            closest = Infinity,
            validChoices = [];    //keep track of non-wall hitting moves for random selection (frightened mode)
        //cycle through the turn preferences list: UP, LEFT, DOWN, RIGHT
        for (var i = 0; i < MsPacmanFruit.TURN_PREFERENCE.length; i++) {
            var testDirection = MsPacmanFruit.TURN_PREFERENCE[i];
            // can't reverse go back the way we just came
            if (!Vector.equals(Vector.inverse(this.direction), testDirection)) {
                //calculate distance from testTile to targetTile and check if it's the closest
                var testTile = Vector.add(atTile, testDirection),
                    distance = Vector.distance(testTile, this.targetTile);
                if (!this.scene.mazeClass.isWallTile(testTile)) {
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
        return MsPacmanFruit.TURN_PREFERENCE[choice];
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
                    this.targetTile = { x: 13, y: 18 };
                }
                this.madeInstruction = true;
            } else if (this.isLooping && Vector.equals(this.tile, this.loopTarget)) {
                //randomly choose an exit sequence
                this.exitSequence = this.scene.maze.chooseRandomFruitExit();
                this.mode = MsPacmanFruit.MODE_EXIT;
                this.targetTile = this.exitSequence[this.turn];
                if (Vector.equals(this.targetTile, this.tile)) {
                    //already on the exit point. go to next in sequence
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && Vector.equals(this.tile, this.targetTile)) {
                if (this.turn < this.exitSequence.length - 1) {
                    this.targetTile = this.exitSequence[++this.turn];
                }
            } else if (this.isExiting && (this.tile.x < 0 || this.tile.x > 27)) {
                delete this.scene.fruit;
            }
            var centerPoint = this.centerPixel,
                nextPixel = { x: centerPoint.x + this.direction.x * 5, y: centerPoint.y + this.direction.y * 5 },
                testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };

            //this move would hit a wall, try to continue in same direction of travel
            if (this.scene.mazeClass.isWallTile(testTile) || this.scene.mazeClass.isHouseTile(testTile) || this.scene.mazeClass.isDecisionTile(this.tile)) {
                this.direction = this.chooseNextDirection(this.tile);
                this.madeInstruction = true;
            }
        } else {
            if (!this.isTileCenter) {
                delete this.madeInstruction;
            }
        }
    }

    draw() {
        Actor.prototype.draw.call(this);
        var context = this.scene.context,
            offsetX = (this.level - 1) * 16,
            offsetBounce = 1.5 * Math.sin((this.bounceCtr / 16) * Math.PI) - 0.5;  //bounce the fruit up and down
        context.drawImage(RESOURCE.mspacman,
            this.textureOffset.x + offsetX, this.textureOffset.y, 16, 16,
            this.position.x, this.position.y + offsetBounce, 16, 16
        );


        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#FF0000";
        // var tile = this.targetTile;
        // context.strokeRect(tile.x*8, tile.y*8, 8, 8);

    }

    get speedControl() {
        return '00100010001000100010001000100010'; //level 1
    }
}