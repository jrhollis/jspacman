// https://www.youtube.com/watch?v=sQK7PmR8kpQ ms pacman ghost ai
class Ghost extends Actor {
    static MODE_CHASE = 0;
    static MODE_SCATTER = 1;
    static MODE_FRIGHT = 2;
    static MODE_EATEN = 3;

    static STATUS_LEAVE_HOME = 0;
    static STATUS_ENTER_HOME = 1;
    static STATUS_HOME = 2;
    static STATUS_PATROL = 3;

    static ANIM_SCATTER_CHASE = 0;
    static ANIM_FRIGHT = 1;
    static ANIM_FRIGHT_FLASH = 2;
    static ANIM_EATEN = 3;

    //global counters to keep track during one frighten period
    static NUM_EATEN = 0;
    static NUM_FRIGHTENED = 0;

    //entrance and exit to the ghost house
    static HOUSE_DOOR = { x: 13, y: 14 };
    static LEAVE_TARGET = { x: 13 * 8, y: 13.5 * 8 };


    /**
     * total duration of energize/frighten. time is in seconds, flashes are 
     * 28 ticks each-- 4 frames, 7 ticks per frame. on most later levels, ghosts 
     * never frighten and only reverse direction
     * 
     */
    static getFrightenDuration(level) {
        var time = 0,
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

    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        
        //when eaten, ghosts should return to their houseTarget (usually their startPosition, except Blinky)
        this.houseTarget = this.startPosition;
        this.animations = [
            //normal movement
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 456, textureY: 64 },
            //frighten just blue
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 64 },
            //frighten (flash blue / white)
            { frames: 4, ticksPerFrame: 7, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 64 },
            //eaten (eyes)
            { frames: 1, ticksPerFrame: 0, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 80 }
        ];
        this.currentAnimation = 0;
        //pellet counter for release from ghost house
        this.pelletCounter = 0;
    }


    /**
     * return ghosts to their starting positions and states
     */
    reset() {
        Actor.prototype.reset.call(this);
        this.nextInstruction = Vector.clone(this.direction);
        this.status = Ghost.STATUS_HOME; // EXCEPT BLINKY
        this.mode = Ghost.MODE_SCATTER;
        this.animation = Ghost.ANIM_SCATTER_CHASE;
        this.targetTile = this.calculateTargetTile();
        delete this.reverseInstruction;
    }

    /**
     * when not using global pellet count, use this as a personal ghost counter.
     * it is number of pellets that must be eaten before this ghost can leave the house
     * only clyde and inky have values here. see their subclasses
     */
    get pelletLimit() {
        return 0;
    }


    /**
     * check to see if ghost is on a tunnel tile
     */
    get inTunnel() {
        try {
            return this.scene.mazeClass.isTunnelTile(this.tile);
        } catch (ex) {
            return false;
        }
    }

    /**
     * frighten the ghosts if they're not eaten. frightened ghosts
     * get a reverse instruction.
     */
    frighten() {
        //reverse the ghost, even if they're eaten (eyes)
        this.reverse();
        if (!this.isEaten) {
            //eaten ghosts (eyes) can't be frightened
            this.mode = Ghost.MODE_FRIGHT;
            this.animation = Ghost.ANIM_FRIGHT;
            Ghost.NUM_FRIGHTENED++;
        }
    }
    /**
     * start the flashin'
     */
    frightenFlash() {
        this.animation = Ghost.ANIM_FRIGHT_FLASH;
    }
    get isFrightened() {
        return this.mode == Ghost.MODE_FRIGHT;
    }


    /**
     * turn the ghost around at the next tile center, if possible
     */
    reverse() {
        this.reverseInstruction = Vector.inverse(this.direction);;
        //tag as a reverse instruction so we know later when it becomes the next instruction
        this.reverseInstruction.reverse = true;
    }


    /**
     * make the ghost scatter pacman. called by the scatterchase instance
     */
    scatter() {
        if (!this.isEaten) {
            this.reverse();
            this.mode = Ghost.MODE_SCATTER;
            this.animation = Ghost.ANIM_SCATTER_CHASE;
            //point to this ghost's scatter target
            this.targetTile = this.calculateTargetTile();
        }
    }
    get isScattering() {
        return this.mode == Ghost.MODE_SCATTER;
    }



    /**
     * make the ghost chase pacman. called by the scatterchase instance
     * @param {*} noReverse sometimes chase needs to be called without the reverse instruction
     *                      i.e. when frigthen state ends
     */
    chase(noReverse) {
        if (!this.isEaten) {
            if (!noReverse) {
                this.reverse();
            }
            this.mode = Ghost.MODE_CHASE;
            this.animation = Ghost.ANIM_SCATTER_CHASE;
            this.targetTile = this.calculateTargetTile();
        }
    }
    get isChasing() {
        return this.mode == Ghost.MODE_CHASE;
    }


    /**
     * called when pacman eats this ghost
     */
    eaten() {
        //ghost hides for a moment while a score sprite is displayed in its place
        this.hide();
        this.stop();
        this.mode = Ghost.MODE_EATEN;
        this.targetTile = Ghost.HOUSE_DOOR;
        this.animation = Ghost.ANIM_EATEN;
    }
    get isEaten() {
        return this.mode == Ghost.MODE_EATEN;
    }


    /**
     * direct the ghost to leave the house. if they are not already home
     * point the ghost in the direction of the exit point (x axis first)
     * and slowly migrate to the LEAVE_TARGET
     */
    leaveHouse() {
        if (this.isHome) {
            //turn and face exit point immediately
            if (this.position.x > Ghost.LEAVE_TARGET.x) {
                this.direction = Vector.LEFT;
            } else if (this.position.x < Ghost.LEAVE_TARGET.x) {
                this.direction = Vector.RIGHT;
            } else if (this.position.y > Ghost.LEAVE_TARGET.y) {
                this.direction = Vector.UP;
            }
            //ghost's status updated to leaving home
            this.status = Ghost.STATUS_LEAVE_HOME;
        }
    }
    get isReadyToLeaveHouse() {
        return this.isHome && this.pelletCounter >= this.pelletLimit;
    }
    get isHome() {
        return this.status == Ghost.STATUS_HOME;
    }
    get isEnteringHome() {
        return this.status == Ghost.STATUS_ENTER_HOME;
    }
    get isLeavingHome() {
        return this.status == Ghost.STATUS_LEAVE_HOME;
    }



    /**
     * these are the global cases for setting a ghost's target tile. the specific
     * target tile calculations of each respective ghosts are made in their subclass
     */
    calculateTargetTile() {
        if (this.isScattering) {
            return this.scatterTargetTile;
        } else if (this.isFrightened) {
            return this.scatterTargetTile; //this doesn't matter since turns are random, just need a value
        } else if (this.isEaten) {
            return Ghost.HOUSE_DOOR;
        }
    }


    /**
     * one (half) tick of the game. this is where the meat of the ghosts' game mechanics lies. this tells
     * the ghost how to move based on its location, mode, and status. for instance, if the ghost is 
     * leaving home, it's pointed to the LEAVE_TARGET and gradually moves there with each tick of the game.
     */
    tick() {

        if (!this.scene.maze) {
            Actor.prototype.tick.call(this);
            return;
        }
        //update the target tile
        this.targetTile = this.calculateTargetTile();

        if (this.isHome) {
            //ghost is home in the ghost house
            //bounce up and down off walls when stuck in the house
            if (Math.ceil(this.position.y) <= 128) {
                this.direction = Vector.DOWN;
            } else if (Math.floor(this.position.y) >= 136) {
                this.direction = Vector.UP;
            }
        } else if (this.isEnteringHome) {
            //entering house - find this.houseTarget
            //go down and then over (if necessary) in that order
            if (this.position.y < this.houseTarget.y) {
                this.direction = Vector.DOWN;
            } else if (this.position.x < this.houseTarget.x) {
                this.direction = Vector.RIGHT;
            } else if (this.position.x > this.houseTarget.x) {
                this.direction = Vector.LEFT;
            } else {
                //back on the home target- turn back to ghost
                this.status = Ghost.STATUS_HOME;
                this.animation = Ghost.ANIM_SCATTER_CHASE;
                this.direction = Vector.UP;
                this.mode = this.scene.globalChaseMode;
                Ghost.NUM_EATEN--;
            }
        } else if (this.isLeavingHome) {
            if (!this.isEaten) {
                //leaving house - find leave target
                // go left/right first, then up in that order
                if (this.position.x > Ghost.LEAVE_TARGET.x) {
                    this.direction = Vector.LEFT;
                } else if (this.position.x < Ghost.LEAVE_TARGET.x) {
                    this.direction = Vector.RIGHT;
                } else if (this.position.y > Ghost.LEAVE_TARGET.y) {
                    this.direction = Vector.UP;
                } else {
                    //made it out of the house, patrol time
                    this.status = Ghost.STATUS_PATROL;
                    this.direction = Vector.LEFT;
                    this.exitingHouse = true;
                    //if there was a reverse instruction given when in the house, queue it up next
                    if (this.reverseInstruction) {
                        this.nextInstruction = Vector.RIGHT;
                        delete this.reverseInstruction;
                    } else {
                        this.nextInstruction = Vector.LEFT;
                    }
                    if (!this.isFrightened) {
                        //inherit the current scatter/chase mode
                        this.mode = this.scene.globalChaseMode;
                    }
                }
            } else {
                //got eaten on the way out of the house, go back inside
                this.status = Ghost.STATUS_ENTER_HOME;
            }
        } else if (this.isTileCenter && !this.madeInstruction) {
            //hit the center of a tile. time to execute the next turn/instruction
            //made instruction is important here because if a ghost is on center
            //tile for more than one tick, we don't want to re-calc an instruction
            this.madeInstruction = true;    //clear this after leaving tileCenter
            // execute pending instruction
            if (this.reverseInstruction) {
                //check validity of move, if not valid, go back in the previous direction
                var nextTile = Vector.add(this.tile, this.reverseInstruction);
                if (this.scene.mazeClass.isWallTile(nextTile)) {
                    this.nextInstruction = Vector.inverse(this.lastDirection);
                } else {
                    this.nextInstruction = Vector.clone(this.reverseInstruction);
                }
                delete this.reverseInstruction;
            }
            this.lastDirection = Vector.clone(this.direction);
            this.direction = Vector.clone(this.nextInstruction);
            // look ahead to next tile and calculate next instruction from there
            var nextTile = Vector.add(this.tile, this.direction),
                futureTile = Vector.add(nextTile, this.direction);
            if (this.scene.mazeClass.isDecisionTile(nextTile) || this.scene.mazeClass.isWallTile(futureTile)) {
                this.nextInstruction = this.calculateNextInstruction(nextTile);
            }
            if (!this.nextInstruction) {
                //the above did not generate a valid move. could happen due to a reverse instruction at an inopportune time
                //calculate a next move from this tile, or just keep the current direction
                var nextDirection = this.calculateNextInstruction(this.tile) || this.direction;
                this.nextInstruction = Vector.clone(nextDirection);
            }
        } else {
            if (!this.isTileCenter) {
                //off center tile, unset the madeInstruction flag
                this.madeInstruction = false;
            }
            //below is an eaten ghost in search of home
            if (this.isEaten && !this.isEnteringHome) {
                //eaten ghost looking for entrance to house
                if (Vector.equals(this.position, Ghost.LEAVE_TARGET)) {
                    //found entrance, time to go in
                    this.direction = Vector.DOWN;
                    this.status = Ghost.STATUS_ENTER_HOME;
                }
            } else if (this.exitingHouse) {
                //now that the ghost has popped out of the house, make sure its y position is snapped to the maze lane
                this.y = ((this.tile.y - 1) * 8) + 4;
                this.exitingHouse = false;
            }
        }
        Actor.prototype.tick.call(this);

    }


    /**
     * the interesting thing here is that the ghosts telegraph their turn a few pixels
     * before the execute the turn. the draw method takes into account a pending instruction
     * and moves the ghost's eyes in that direction while it is patrolling the maze.
     */
    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        //figure out texture sheet offsets then draw
        var context = this.context, //canvas 2d context for drawing
            animation = this.animation,
            directionalOffsetX = 0, //could potentially share these values with pacman 
            offsetY = 0;
        //non-frighten animations move eyes in the nextDirection. ghosts' eyes move first before they make a turn
        if (!this.isFrightened) {
            offsetY = this.textureOffsetY;
            var eyes;
            if (this.isHome || this.isLeavingHome) {
                //eyes agree with the ghosts direction
                eyes = this.direction;
            } else if (this.madeInstruction || this.nextInstruction.reverse) {
                //eyes should agree with direction
                eyes = this.direction;
            } else {
                //eyes look in the ghost's next move direction
                eyes = this.nextInstruction || this.direction;
            }
            //add an x offset to the textureX to point eyes frames
            if (eyes.x == -1) {
                directionalOffsetX = 32;
            } else if (eyes.y == -1) {
                directionalOffsetX = 64;
            } else if (eyes.y == 1) {
                directionalOffsetX = 96;
            }
            //get the eyes only
            if (this.mode == Ghost.MODE_EATEN) {
                offsetY = 0;
                directionalOffsetX /= 2;
            }
        }
        //draw to canvas
        context.drawImage(RESOURCE.pacman,
            animation.textureX + directionalOffsetX + (animation.curFrame * this.width), 
            animation.textureY + offsetY, this.width, this.height, //clip from source
            this.x, this.y, this.width, this.height
        );
    }

    /**
     * these strings represent the amount of pixels a ghost should move per half tick during
     * a period of 16 ticks (two updates per tick).  this.frameCtr keeps track of the position in the speed control
     * string. this.frameCtr gets incremented in tick() each executed (unfrozen) frame
     * 
     */
    get speedControl() {

        try {
            if (this.isEaten) {
                return '11111111111111111111111111111111';
            } else if (this.isHome||this.isLeavingHome) {
                return '00010001000100010001000100010001';
            } else if (this.inTunnel) {
                //tunnel, home
                if (this.scene.level == 1) {
                    return '00100010001000100010001000100010';
                } else if (this.scene.level <= 4) {
                    return '01001000001001000010001010010001';
                } else {
                    return '10010010001001001001001000100100';
                }
            } else if (this.isFrightened) {
                //frightened
                if (this.scene.level == 1) {
                    return '10010010001001001001001000100100';
                } else if (this.scene.level <= 4) {
                    return '10010010001001000010010101001001;'
                } else if (this.scene.level <= 20) {
                    return '00100101001001010010010100100101';
                } else {
                    //not used, no frigthen state at these levels
                    return '01001000001001000010001010010001';
                }
            } else if (this.elroy == 1) {
                //elroy 1 - Blinky only
                if (this.scene.level == 1) {
                    return '10101010101010101010101010101010';
                } else if (this.scene.level <= 4) {
                    return '11010101011010101101010101101010';
                } else {
                    return '01101101011011010110110101101101';
                }
            } else if (this.elroy == 2) {
                //elroy 2 - Blinky only
                if (this.scene.level == 1) {
                    return '101010100110101001010101110101010';
                } else if (this.scene.level <= 4) {
                    return '101101011001011010101011011011010';
                } else {
                    return '101101100110110101101101110110110';
                }
            }
        } catch (ex) {
            //scene is not part of a maze, is scripted
            console.log(ex)
        }

        //normal patrol
        if (this.scene.level == 1) {
            return '10101010001010100101010101010101';
        } else if (this.scene.level <= 4) {
            return '10101010011010100101010111010101';
        } else if (this.scene.level <= 20) {
            return '11010110010110101010110110110101';
        } else {
            return '11010110010110101010110110110101';
        }
    }
}