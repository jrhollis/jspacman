/**
 * Blinky is a special ghost. He appears in the pac-man cut scenes with his own
 * animations. he also has a "cruise elroy" state where he speeds up when there
 * are few pellets left on the maze.
 */
class Blinky extends Ghost {
    //extra animations for cut scenes
    static ANIM_RIP = 4;
    static ANIM_PATCH = 5;
    static ANIM_NAKED = 6;
    
    constructor(scene, x, y) {
        super(scene, x, y);
        this.name = 'Blinky';
        //since blinky doesn't start in the house, need to assign him a target inside
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


    /**
     * blinky starts outside of the house on reset
     */
    reset() {
        Ghost.prototype.reset.call(this);
        this.status = Ghost.STATUS_PATROL;
    }


    /**
     * in ms pac-man blinky starts each level in random scatter mode
     */
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


    /**
     * blinky should always leave home immediately
     */
    tick() {
        if (this.isHome) {
            this.leaveHouse()
        }
        Ghost.prototype.tick.call(this)
    }


    draw() {
        if (this.currentAnimation == Blinky.ANIM_NAKED) {
            //this is for the third cutscene of pacman. just update animation without any maze logic
            Sprite.prototype.draw.call(this);
            var animation = this.animation;
            this.context.drawImage(RESOURCE.pacman,
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
     * 
     */
    get elroy() {
        if (this.scene.pelletsLeft > 0) {
            if (this.scene.pelletsLeft <= this.elroy2PelletsLeft) {
                return 2;
            } else if (this.scene.pelletsLeft <= this.elroy1PelletsLeft) {
                return 1;
            }
        }
        return 0;
    }


    /**
     * elroy1 threshold is double elroy2
     */
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