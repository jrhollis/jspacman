/**
 * The big pellet. Energizes pacman and frightens/reverses the ghost when eaten
 */
class Energizer extends Pellet {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.animations = [
            //on texture coords. this will just be a flashing circle
            {frames: 2, ticksPerFrame: 10, curFrame: 0, curFrameTicks: 0}
        ];
        this.points = 50;
        this.pellet = false;
        this.energizer = true;
    }

    draw() {
        if (this.hidden) return;
        //animate this thing
        Sprite.prototype.draw.call(this);
        //since energizers flash, only draw when animation frame is 0
        //there is no sprite sheet / texture involved here
        if (this.animation.curFrame == 0) {
            //draw energizer on the canvas
            var context = this.context;
            context.fillStyle = this.pelletColor;
            // drawing a circle anti-aliases on canvas. doesn't fit aesthetic.. use rectangles
            context.fillRect(this.x + 1, this.y + 1, 6, 6);
            context.fillRect(this.x, this.y + 2, 8, 4);
            context.fillRect(this.x + 2, this.y, 4, 8);
            context.fill();
        }
    }
}