class Pacman extends Actor {
    //STATUS INDICATORS
    //normal movement around maze
    static MODE_PATROL = 0;
    //after eating an energizer
    static MODE_ENERGIZED = 1;
    //in the process of dying where he folds up into nothing
    static MODE_DYING = 2;
    //all done dying
    static MODE_DEAD = 3;

    //ANIMATIONS
    //normal maze chomping
    static ANIM_NORMAL = 0;
    //folding up and disappearing
    static ANIM_DIE = 1;
    //used for cutscene 1 in pacman where he's pacman becomes a giant for some reason
    static ANIM_GIANT = 2;
    //used for menu and cut scene. slows mouth chomping animation to half-speed
    static ANIM_SLOMO = 3;

    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        //always starts facing left
        this.startDirection = Vector.LEFT;
        this.animations = [
            //normal --TODO: it seems chopming animations are dependent on speed control
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 14, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 504, textureY: 0 },
            //giant 32 x 32
            { frames: 4, ticksPerFrame: 3, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 16 },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
        ];
        this.score = 0;
        this.reset();
    }

    reset() {
        Actor.prototype.reset.call(this);
        this.stop();
        this.animation = Pacman.ANIM_NORMAL;
        this.mode = Pacman.MODE_PATROL;
    }


    //despite being a 16x16 sprite, pacman's hitbox (when eating pellets) appears to be adjusted somehow
    get hitBox() {
        return { x: this.centerPixel.x - 7, y: this.centerPixel.y - 7, w: 14, h: 15 }
    }

    get centerPixel() {
        return { x: this.x + 7, y: this.y + 7 };
    }

    /**
     * see if pacman collided with a pellet
     * 
     * @param {*} pellet test hitbox against pacman
     */
    collideItem(pellet) {
        var pelletHitbox = pellet.hitBox;
        return ((pelletHitbox.x > this.hitBox.x && pelletHitbox.x + pelletHitbox.w < this.hitBox.x + this.hitBox.w) &&
            (pelletHitbox.y > this.hitBox.y + 1 && pelletHitbox.y + pelletHitbox.h < this.hitBox.y + this.hitBox.h));
    }

    /**
     * pacman is out in the maze and there is no fright timer.
     */
    patrol() {
        if (this.isAlive) {
            this.animation = Pacman.ANIM_NORMAL;
            this.mode = Pacman.MODE_PATROL;    
        }
    }
    get isPatrolling() {
        return this.mode == Pacman.MODE_PATROL;
    }


    /**
     * pacman eats an item such as a pellet, energizer, or fruit. when eating a pellet, pacman
     * freezes for one frame, and freezes for 3 when eating an energizer. The freeze delay counter
     * is because the freeze happens after one tick.
     * @param {*} item the thing that pacman ate
     */
    eatItem(item) {
        if (item.pellet) {
            this.freezeDelay = 2;
            this.freezeHalfTicks = 2;
            this.atePellet = true;
            Sound.playOnce('munch');
        } else if (item.energizer) {
            this.freezeDelay = 2;
            this.freezeHalfTicks = 6;
            this.mode = Pacman.MODE_ENERGIZED; //speed him up
            this.atePellet = true;
        } else if (item.fruit) {
            item.eaten();
            Sound.playOnce('eat_fruit');
        }
        this.addPoints(item.points);
    }
    get isEnergized() {
        return this.mode == Pacman.MODE_ENERGIZED;
    }


    /**
     * add points to pac-man's score. check for extra life.
     * extra life every 10k points
     * @param {*} points 
     */
    addPoints(points) {
        var prevScore = Math.floor(this.score / 10000);
        this.score += points;
        //award extra life for every 10k increment of points
        var newScore = Math.floor(this.score / 10000);
        if (prevScore != newScore) {
            Sound.playOnce('extra_life');
            this.lives++;
        }
        //set high score
        if (this.score > this.scene.highScore && !Game.PRACTICE_MODE) {
            Game.setHighScore(Game.GAME_MODE, this.score);
        }
    }


    /**
     * kill the pac-man. stores the current maze's pellet arrays
     * to pac-man and then begins die animation
     */
    die() {
        //point up and open mouth to begin die animation
        this.freeze();
        this.animation.curFrame = 2;
        this.direction = Vector.UP;
        //cache the scene's pellets/energizer in side this pacman instance
        this.pellets = Array.from(this.scene.pellets);
        this.energizers = Array.from(this.scene.energizers);
        //after getting caught, the game freezes for 0.5 seconds before starting die animation
        this.scene.freezeTimer.start(30, () => {
            Sound.playOnce('die');
            this.unfreeze();
            this.mode = Pacman.MODE_DYING;
            this.animation = Pacman.ANIM_DIE;
            if (!Game.PRACTICE_MODE) {
                Math.max(--this.lives, -1); //min lives of zero
            }
        });
    }
    get isDying() {
        return this.mode == Pacman.MODE_DYING;
    }
    get isDead() {
        return this.mode == Pacman.MODE_DEAD;
    }
    get isAlive() {
        return !this.isDead && !this.isDying;
    }

    //for pacman cut scene 1
    get isGiant() {
        return this.currentAnimation == Pacman.ANIM_GIANT;
    }


    tick() {
        //pacman freezes when eating pellets (1 tick) and energizers (3 ticks)
        //freeze delay timer is here because the actual freezing is delayed
        //by a frame (2 ticks)
        if (!this.freezeDelay) {
            if (this.freezeHalfTicks) {
                this.freezeHalfTicks--;
                return;
            }
        } else {
            this.freezeDelay--;
        }

        Actor.prototype.tick.call(this);

        //scripting or dead, no maze stuff here
        if (!this.scene.maze || !this.isAlive) return;  

        //get the direction for this frame by reading the input buffer or continue current direction if no input
        var inputDirection = Input.readBuffer() || this.direction;
        //check for wall contact
        //look at 5 pixels over from center point in direction pac-man is moving. if it is a wall tile, then stop
        var centerPoint = this.centerPixel,
            nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 },
            nextTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
        if (!this.scene.mazeClass.isWalkableTile(nextTile)) {
            //this move would hit a wall, try to continue in same direction of travel
            inputDirection = this.direction;
        } else {
            //path is open, start moving again
            this.unfreeze();
            this.start();
        }

        //try again with original direction - if there's a wall here too, stop
        nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 };
        nextTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
        if (!this.scene.mazeClass.isWalkableTile(nextTile)) {
            //this move would hit a wall, try to continue in same direction of travel
            this.freeze();
            this.stop();
            //pac man never stops with his mouth closed. ms pacman does, though
            if (this.animation.curFrame == 0 && Game.GAME_MODE == Game.GAME_PACMAN) {
                this.animation.curFrame = 2;
            }
        }

        var oppositeDirection = Vector.equals(inputDirection, Vector.inverse(this.direction));
        this.direction = inputDirection;

        //make sure to keep pacman centered in the maze path
        if (!this.stopped && !oppositeDirection) {

            //get the coordinate of center lane
            var centerX = (this.tile.x * 8) + 3,
                centerY = (this.tile.y * 8) + 3;

            //keep pac-man in his lane. fudge over to center line depending on direction of travel
            //this code re-aligns pacman to the center of the maze lane after cutting a corner.
            //have to use half pixels (0.5) because of the two updates per tick thing
            if (this.direction.x) {
                if (this.centerPixel.y > centerY) {
                    this.y -= 0.5;
                } else if (this.centerPixel.y < centerY) {
                    this.y += 0.5;
                }
            }
            if (this.direction.y) {
                if (this.centerPixel.x > centerX) {
                    this.x -= 0.5;
                } else if (this.centerPixel.x < centerX) {
                    this.x += 0.5;
                }
            }
        }
    }


    /**
     * offset on sprite sheet according to which direction pac-man
     * is facing
     */
    get directionalOffsetY() {
        //right, left, up, down
        if (this.direction.x >= 1) {
            return 0;
        } else if (this.direction.x <= -1) {
            return 16;
        } else if (this.direction.y <= -1) {
            return 32;
        } else if (this.direction.y >= 1) {
            return 48;
        }
    }


    /**
     * offset on sprite sheet for the frame pac-man is
     * on in his eating animation
     */
    get frameOffsetX() {
        switch(this.animation.curFrame) {
            case 3:
                return -1;
            default:
                return -this.animation.curFrame;
        }
    }


    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.context,
            animation = this.animation;

        if (this.isAlive) {
            //draw chomping animation
            var curFrame = animation.curFrame,
                frameOffsetX = this.frameOffsetX,
                directionalOffsetY = this.directionalOffsetY,
                width = this.width,
                height = this.height;

            if (curFrame == 0) {
                //closed mouth uses only one texture, no matter direction
                directionalOffsetY = 0;
            }

            if (this.isGiant) {
                directionalOffsetY = 16;
                width = 32;
                height = 32;
                frameOffsetX *= -32;
            } else {
                frameOffsetX *= 16;
            }
            //do directional stuff and modular back and forth for animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + frameOffsetX, directionalOffsetY, width, height,
                this.x, this.y, width, height
            );
        } else {
            //dying animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 16), 0, 16, 16,
                this.x, this.y, 16, 16
            );
            if (animation.curFrame == 13) {
                //dead
                this.freeze();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }


    /**
     * these strings indicate how many pixels to move pacman at a given tick. two consecutive digits are applied
     * each tick, allowing for sub tick granularity with respect to movement. 
     * i.e. on level 1 if pacman is patrolling, in one tick he will update his positiong twice moving 0 pixels in the first
     * half tick and 1 pixel in the next, for a total of 1 pixel in the tick. as the game speeds up, this
     * allows for pac-man (and ghosts) to move more than 1 pixel per tick without flying off the rails.
     * 
     * for info on pacman speeds, etc see: https://www.gamasutra.com/db_area/images/feature/3938/tablea1.png
     */
    get speedControl() {
        // TODO: something odd going on when pacman moves up. doesn't follow these patterns. pixel rounding??
        //on average I think it works out, but not pixel perfect
        if (this.stopped || !this.isAlive) {
            return '00000000000000000000000000000000';
        } else if (this.isPatrolling) {
            if (this.scene.level == 1) {
                return '01010101010101010101010101010101'; //16/32 = 60 px/sec
            } else if (this.scene.level <= 4) {
                return '11010101011010101101010101101010'; //18/32 = 67.5 px/sec
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101'; //20/32 = 75
            } else {
                return '11010101011010101101010101101010'; //18/32 = 67.5
            }
        } else if (this.isEnergized) {
            if (this.scene.level == 1) {
                return '11010101011010101101010101101010'; //18/32 = 67.5
            } else if (this.scene.level <= 4) {
                return '11010110010110101010110110110101'; //19/32 = 71.25
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101'; //20/32 = 75
            } else {
                //there is no "energized" state for pacman at this point as the 
                //energizers don't frighten the ghosts- just use patrolling speed
                return '11010101011010101101010101101010'; //not ever used
            }
        }
    }
}