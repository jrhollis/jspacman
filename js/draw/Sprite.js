/**
 * base class for just about anything drawn on the canvas- except the maze backgrounds
 */
class Sprite {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.context = scene.context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        /**
         * an animation is a json object containing up to 6 values:
         * i.e.{ frames: 4, ticksPerFrame: 2, curFrame: 0, curFrameTicks: 0, textureX: 488, textureY: 0 }
         * 
         * frames           - total number of frames that make up this animation
         * ticksPerFrame    - number of ticks to display a single from of the animation before moving on to the next frame
         * curFrame         - the frame that this animation is currently on
         * curFrameTicks    - counter for the number ticks of the current animation frame
         * textureX         - X texture coordinate on the sprite sheet resource of the first frame of this animation
         * textureY         - Y texture coordinate on the sprite sheet resource of the first frame of this animation
         * 
         * textures for each frame are assumed to be horizontally lined up on the sprite sheet with each frame
         * being the same width (this.width). If the there is no texture (like with the Energizer pellets), the texture
         * coordinates can be omitted
         * 
         */
        this.animations = [];
        //the pointer to the current animation in the this.animations array
        this.currentAnimation = 0;
    }

    //return pixel position on the screen
    get position() {
        return {x: this.x, y: this.y};
    }
    //set x and y in one go
    set position(position) {
        this.x = position.x;
        this.y = position.y;
    }
    //mid point of the sprite rectangle
    get centerPixel() {
        return {x: this.position.x + (this.width/2), y: this.position.y + (this.height/2)}; 
    }
    //determine which tile this actor occupies. look at their center pixel coordinate
    get tile() {
        var center = this.centerPixel;
        return {x: Math.floor((center.x) / 8), y: Math.floor((center.y) / 8)};
    }

    //don't draw this sprite
    hide() {
        this.hidden = true;
    }
    //draw it
    show() {
        this.hidden = false;
    }

    //stop this sprite from animating
    freeze() {
        this.frozen = true;
    }
    //resume animation
    unfreeze() {
        this.frozen = false;
    }

    //actors collide if they occupy the same tile
    collide(actor) {
        return (this.tile.x == actor.tile.x && this.tile.y == actor.tile.y)
    }


    //set a new current animation and reset animation counters
    set animation(index) {
        this.currentAnimation = index;
        //reset animation info
        this.animation.curFrame = 0;
        this.animation.curFrameTicks = 0;
    }
    //gets the current animation
    get animation() {
        return this.animations[this.currentAnimation];
    }


    /**
     * nothing is really drawn here, but the current animation (if there is one) has its
     * counter updated.
     */
    draw() {
        //don't animate if hidden or frozen
        if (this.hidden || this.frozen) return;
        // update animation counters if there this is animated
        if (this.animations.length) {
            var currentAnimation = this.animations[this.currentAnimation];
            //if animating
            if (currentAnimation.ticksPerFrame > 0 && currentAnimation.frames > 1) {
                //increment time spent on the current frame (milliseconds)
                currentAnimation.curFrameTicks++;
                //convert secPerFrame to milliseconds for comparison
                //is the time on the current frame more than secPerFrame? if so, time to move on to next frame
                if (currentAnimation.curFrameTicks >= currentAnimation.ticksPerFrame) {
                    //go to the next frame in the animation
                    currentAnimation.curFrame = (currentAnimation.curFrame + 1) % currentAnimation.frames;
                    currentAnimation.curFrameTicks = 0;
                }
            }
        }
    }
}