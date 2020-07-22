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

    die() {
        Pacman.prototype.die.call(this);
        this.animation.curFrame = 1;
        this.direction = Vector.DOWN;
        this.nextDirection = Vector.DOWN;
    }

    draw() {
        if (this.hidden) return;
        Actor.prototype.draw.call(this);
        var context = this.scene.context,
            animation = this.animation,
            directionalOffsetY = 0;

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

        if (!this.isDying) {
            var curFrame = animation.curFrame,
                frameOffsetX = 0;

            if (curFrame == 0) {
                frameOffsetX = 0
            } else if (curFrame == 1) {
                frameOffsetX = -1;
            } else if (curFrame == 2) {
                frameOffsetX = -2;
            } else if (curFrame == 3) {
                frameOffsetX = -1;
            }

            //do directional stuff and modular back and forth for animation
            context.drawImage(RESOURCE.mspacman,
                animation.textureX + (frameOffsetX * 16), directionalOffsetY, 15, 15,
                this.position.x, this.position.y, 15, 15
            );
        } else {
            //dying animation- should spin, down,left,up,right, down,left,up,right, down,left,up
            this.direction = Actor.TURN_PREFERENCE[animation.curFrame % 4];
            context.drawImage(RESOURCE.mspacman,
                animation.textureX, directionalOffsetY, 16, 16,
                this.position.x, this.position.y, 16, 16
            );
            if (animation.curFrame == 9) {
                //dead
                this.stop();
                this.freeze();
                this.mode = Pacman.MODE_DEAD;
            }
        }
    }
}