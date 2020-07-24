/**
 * Ms Pac-man's class. See Pacman.js
 */
class MsPacman extends Pacman {
    constructor(scene, x, y) {
        super(scene, x, y, 16, 16);
        this.animations = [
            //normal
            { frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 },
            //die
            { frames: 11, ticksPerFrame: 8, curFrame: 0, curFrameTicks: 0, textureX: 472, textureY: 48 },
            //giant 32 x 32 --pacman only
            { },
            //slo-mo - same as normal but don't chomp so fast
            { frames: 4, ticksPerFrame: 4, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
        ];
    }

    /**
     * ms pacman starts die animation pointing down
     */
    die() {
        Pacman.prototype.die.call(this);
        this.animation.curFrameTicks = 0;
        this.animation.curFrame = 1;
        this.direction = Vector.DOWN;
        this.nextDirection = Vector.DOWN;
    }

    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.context,
            animation = this.animation;

        if (this.isAlive) {
            //chomping animation
            context.drawImage(RESOURCE.mspacman,
                animation.textureX + (this.frameOffsetX * 16), this.directionalOffsetY, 16, 16,
                this.x, this.y, 16, 16
            );
        } else {
            //dying animation- should spin, down,left,up,right, down,left,up,right, down,left,up
            this.direction = Actor.TURN_PREFERENCE[animation.curFrame % 4];
            context.drawImage(RESOURCE.mspacman,
                animation.textureX, this.directionalOffsetY, 16, 16,
                this.x, this.y, 16, 16
            );
            if (animation.curFrame == 9) {
                //dead - stop animating
                this.freeze();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }
}