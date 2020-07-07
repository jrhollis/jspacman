//TODO:  on reversal there is a ms pacman patch that makes blinky go after ms pacman to "avoid parking"

class Blinky extends Ghost {
    static ANIM_RIP = 4;
    static ANIM_PATCH = 5;
    static ANIM_NAKED = 6;
    constructor(scene, x, y) {
        super(scene, x, y, 'Blinky');
        this.startPosition = { x: x, y: y };
        this.houseTarget = { x: 13 * 8, y: 16.5 * 8 };
        this.startDirection = Vector.LEFT;
        this.scatterTargetTile = { x: 25, y: 0 };
        this.textureOffsetY = 0;
        //add some extra animations for the pacman cut scenes
        this.animations = this.animations.concat([ 
            //rip sheet animation for cut scene 2
            { frames: 2, ticksPerFrame: 70, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 112 },
            //patched sheet --use direction offset cutscene 3
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 112 },
            //naked cutscene 3
            { frames: 2, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 584, textureY: 128 }
        ]);
        this.reset();
    }

    reset() {
        Ghost.prototype.reset.call(this);
        //blinky starts outside of the house
        this.status = Ghost.STATUS_PATROL;
    }

    get pelletLimit() {
        return 0;
    }


    get randomScatter() {
        return this.scene.scatterChase.randomScatter;
    }

    /**
     * Blinky targets pacman directly
     */
    calculateTargetTile() {
        if (this.isChasing) {
            return Vector.clone(this.scene.pacman.tile);
        } else {
            return Ghost.prototype.calculateTargetTile.call(this);
        }
    }

    tick() {
        //blinky should always leave home immediately
        if (this.isHome) {
            this.leaveHouse()
        }
        Ghost.prototype.tick.call(this)
    }


    draw() {
        if (this.currentAnimation == Blinky.ANIM_NAKED) {
            Actor.prototype.draw.call(this);
            var animation = this.animation;
            context.drawImage(RESOURCE.pacman,
                animation.textureX + (animation.curFrame * 32), animation.textureY, 32, this.height, //clip from source
                this.position.x-16, this.position.y, 32, this.height
            );
        } else {
            Ghost.prototype.draw.call(this);
        }
    }

    /**
     * Blinky has a "cruise elroy state" where his speed increases slightly when 
     * there are few dots left in the maze.
     */
    get elroy() {
        //cruise elroy for Blinky only
        if (this.scene.pelletsLeft > 0) {
            if (this.scene.pelletsLeft <= this.elroy2PelletsLeft) {
                return 2;
            } else if (this.scene.pelletsLeft <= this.elroy1PelletsLeft) {
                return 1;
            }
        }
        return 0;
    }


    get elroy1PelletsLeft() {
        return this.elroy2PelletsLeft * 2;
    }
    get elroy2PelletsLeft() {
        if (this.scene.level == 1) {
            return 10;
        } else if (this.scene.level == 2) {
            return 15;
        } else if (this.scene.level <= 5) {
            return 20;
        } else if (this.scene.level <= 8) {
            return 25;
        } else if (this.scene.level <= 11) {
            return 30;
        } else if (this.scene.level <= 14) {
            return 40;
        } else if (this.scene.level <= 18) {
            return 50;
        } else {
            return 60;
        }
    }
}