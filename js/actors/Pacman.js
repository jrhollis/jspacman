class Pacman extends Actor {
    static MODE_PATROL = 0;
    static MODE_ENERGIZED = 1;
    static MODE_DYING = 2;
    static MODE_DEAD = 3;

    static ANIM_NORMAL = 0;
    static ANIM_DIE = 1;
    static ANIM_GIANT = 2;
    static ANIM_SLOMO = 3;

    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        this.startDirection = Vector.LEFT;
        this.startPosition = { x: x, y: y };
        this.animations = [
            //normal
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 14, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 504, textureY: 0 },
            //giant 32 x 32
            { frames: 4, ticksPerFrame: 3, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 16 },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
        ];
        this.score = 0;
        this.energizeTimer = new Timer();
        this.reset();
    }

    reset() {
        this.show();
        this.stop();
        this.position = Vector.clone(this.startPosition);
        this.direction = Vector.clone(this.startDirection);
        this.animation = Pacman.ANIM_NORMAL;
        this.mode = Pacman.MODE_PATROL;
        this.frameCtr = 0;
        this.freeze();
    }


    //despite being a 16x16 sprite, pacman's hitbox (when eating pellets) appears to be adjusted somehow
    get hitBox() {
        return { x: this.centerPixel.x - 7, y: this.centerPixel.y - 7, w: 14, h: 15 }
    }

    get centerPixel() {
        return { x: this.position.x + 7, y: this.position.y + 7 };
    }

    collideItem(pellet) {
        var pelletHitbox = pellet.hitBox;
        if ((pelletHitbox.x > this.hitBox.x && pelletHitbox.x + pelletHitbox.w < this.hitBox.x + this.hitBox.w) &&
            (pelletHitbox.y > this.hitBox.y + 1 && pelletHitbox.y + pelletHitbox.h < this.hitBox.y + this.hitBox.h)) {
            return true;
        }
        return false;
    }

    /**
     * pacman is out in the maze and there is no fright timer.
     */
    patrol() {
        this.animation = Pacman.ANIM_NORMAL;
        this.mode = Pacman.MODE_PATROL;
    }
    get isPatrolling() {
        return this.mode == Pacman.MODE_PATROL;
    }


    /**
     * pacman eats an item such as a pellet, energizer, or fruit. when eating a pellet, pacman
     * freezes for one frame, and freezes for 3 when eating an energizer. The frame delay counter
     * is because the freeze happens after one tick.
     * @param {*} item 
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

    addPoints(points) {
        var prevScore = this.score;
        this.score += points;
        //award extra life for every 10k increment of points
        prevScore = Math.floor(prevScore/10000);
        var newScore = Math.floor(this.score/10000);
        if (prevScore != newScore) {
            Sound.playOnce('extra_life');
            this.lives++;
        }
        //set high score
        if (this.score > this.scene.highScore) {
            localStorage['highscore_' + GAME_MODE] = this.score;
        }
    }


    die() {
        //cache the scene's pellets/energizer
        this.animation.curFrame = 2;
        this.direction = Vector.UP;
        this.pellets = Array.from(this.scene.pellets);
        this.energizers = Array.from(this.scene.energizers);
        this.scene.freezeTimer.start(30, () => {
            Sound.playOnce('die');
            this.unfreeze();
            this.mode = Pacman.MODE_DYING;
            this.animation = Pacman.ANIM_DIE;
            Math.max(--this.lives, -1); //min lives of zero
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
        if (!this.freezeDelay) {
            if (this.freezeHalfTicks) {
                this.freezeHalfTicks--;
                return;
            }
        } else {
            this.freezeDelay--;
        }

        //two updates per tick for a moving Actor
        if (!this.stopped) {
            Actor.prototype.tick.call(this);
        }

        if (!this.scene.maze) return;  //we're scripting, no maze stuff here

        //should only read input on every other "half" frame
        var inputDirection = Input.readBuffer() || this.direction;
        if (!this.isDying) {
            //check for wall contact
            //look at 5 pixels over from center point in direction pac-man is moving. if it is a wall tile, then stop
            var centerPoint = this.centerPixel,
                nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 },
                testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
            //this move would hit a wall, try to continue in same direction of travel
            if (!this.scene.mazeClass.isWalkableTile(testTile)) {
                inputDirection = this.direction;
            } else {
                this.unfreeze();
                this.start();
            }

            //try again with original direction - if there's a wall here too, stop
            nextPixel = { x: centerPoint.x + inputDirection.x * 5, y: centerPoint.y + inputDirection.y * 5 };
            testTile = { x: Math.floor(nextPixel.x / 8), y: Math.floor(nextPixel.y / 8) };
            //this move would hit a wall, try to continue in same direction of travel
            if (!this.scene.mazeClass.isWalkableTile(testTile)) {
                this.freeze();
                this.stop();
                //another interesting fact- pac man never seems to stop with his mouth closed
                if (this.animation.curFrame == 0) {
                    this.animation.curFrame = 2;
                }
            }
        }
        var changeDirection = !Vector.equals(inputDirection, this.direction),
            oppositeDirection = Vector.equals(inputDirection, Vector.inverse(this.direction));
        this.direction = inputDirection;

        //when going up... movement is '01111121'
        if (changeDirection && !oppositeDirection && Vector.equals(this.direction, Vector.DOWN)) {
            this.y++;
        }

        //pause for a frame when changing direction
        if (!this.stopped && !oppositeDirection) {

            var centerX = (this.tile.x * 8) + 3,
                centerY = (this.tile.y * 8) + 3;

            //keep pac-man in his lane. fudge over to center line depending on direction of travel
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

    //clip apart the sprite sheet at res/pacman/pacman.png
    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.scene.context,
            animation = this.animation;

        if (!this.isDying) {
            var curFrame = animation.curFrame,
                frameOffsetX = 0,
                directionalOffsetY = 0,
                width = 15,
                height = 15;
    
            if (curFrame == 0) {
                //closed mouth uses only one texture, no matter direction
                directionalOffsetY = 0;
            } else {
                //right, left, up, down
                if (this.direction.x >= 1) {
                    directionalOffsetY = 0;
                } else if (this.direction.x <= -1) {
                    directionalOffsetY = 16;
                } else if (this.direction.y <= -1) {
                    directionalOffsetY = 32;
                } else if (this.direction.y >= 1) {
                    directionalOffsetY = 48;
                }
            }

            if (curFrame == 0) {
                frameOffsetX = 0
            } else if (curFrame == 1) {
                frameOffsetX = -1;
            } else if (curFrame == 2) {
                frameOffsetX = -2;
            } else if (curFrame == 3) {
                frameOffsetX = -1;
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
                this.position.x, this.position.y, width, height
            );
        } else {
            //dying animation
            context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 16), 0, 16, 16,
                this.position.x, this.position.y, 16, 16
            );
            if (animation.curFrame == 13) {
                //dead
                this.stop();
                this.freeze();
                this.hide();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }


        /**
     * probably should put this chunk of code somewhere more relevant
     * 
     * https://github.com/BleuLlama/GameDocs/blob/master/disassemble/mspac.asm#L2456
     */
    get energizedDuration() {
        var time = 0,
            level = this.scene.level,
            flashes = 0;
        if (level <= 5) {
            time = 7 - level;
            flashes = 5;
        } else if (level == 6 || level == 10) {
            time = 5;
            flashes = 5;
        } else if (level <= 8 || level == 11) {
            time = 2;
            flashes = 5;
        } else if (level == 14) {
            time = 3;
            flashes = 5;
        } else if (level == 17 || level > 18) {
            time = 0;
            flashes = 0;
        } else if (level == 9 || level <= 18) {
            time = 1;
            flashes = 3;
        }
        return {
            ticks: time * 60,
            flashes: flashes
        }
    }

    // for info on pacman speeds, etc see: https://www.gamasutra.com/db_area/images/feature/3938/tablea1.png
    get speedControl() {
        // TODO: something odd going on when pacman moves up. doesn't follow these patterns. pixel rounding??
        //on average I think it works out, but not pixel perfect
        if (this.stopped || this.isDying) {
            return '00000000000000000000000000000000';
        } else if (this.isPatrolling) {
            if (this.scene.level == 1) {
                return '01010101010101010101010101010101';
            } else if (this.scene.level <= 4) {
                return '11010101011010101101010101101010'
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101';
            } else {
                return '11010101011010101101010101101010';
            }
        } else if (this.isEnergized) {
            if (this.scene.level == 1) {
                return '11010101011010101101010101101010';
            } else if (this.scene.level <= 4) {
                return '11010110010110101010110110110101';
            } else if (this.scene.level <= 20) {
                return '01101101011011010110110101101101';
            } else {
                //there is no "energized" state for pacman at this point as the 
                //energizers don't frighten the ghosts- just use patrolling speed
                return '11010101011010101101010101101010';
            }
        }
    }
}