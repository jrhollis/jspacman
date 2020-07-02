class Sprite {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.context = scene.context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.animations = [];
        this.currentAnimation = 0;
    }

    get size() {
        return {
            width: this.width,
            height: this.height
        }
    }
    get position() {
        return {x: this.x, y: this.y};
    }
    set position(position) {
        this.x = position.x;
        this.y = position.y;
    }
    get centerPixel() {
        return {x: this.position.x + (this.width/2), y: this.position.y + (this.height/2)}; 
    }
    get tile() {
        var center = this.centerPixel;
        return {x: Math.floor((center.x) / 8), y: Math.floor((center.y) / 8)};
    }

    hide() {
        this.hidden = true;
    }

    show() {
        this.hidden = false;
    }

    freeze() {
        this.frozen = true;
    }

    unfreeze() {
        this.frozen = false;
    }


    collide(entity) {
        return (this.tile.x == entity.tile.x && this.tile.y == entity.tile.y)
    }


    //animation stuff
    set animation(index) {
        this.currentAnimation = index;
        //reset animation info
        this.animation.curFrame = 0;
        this.animation.curFrameTicks = 0;
        this.frameCtr = 0;
    }
    get animation() {
        return this.animations[this.currentAnimation];
    }


    draw() {
        if (this.frozen) return;
        // update animations
        if (this.animations.length) {
            var currentAnimation = this.animations[this.currentAnimation];
            //if animating...
            if (currentAnimation.ticksPerFrame > 0 && currentAnimation.frames > 1) {
                //increment time spent on the current frame (milliseconds)
                currentAnimation.curFrameTicks++;
                //convert secPerFrame to milliseconds for comparison
                //is the time on the current frame more than secPerFrame? if so, time to move on to next frame
                if (currentAnimation.curFrameTicks == currentAnimation.ticksPerFrame) {
                    //go to the next frame in the animation
                    currentAnimation.curFrame = (currentAnimation.curFrame + 1) % currentAnimation.frames;
                    currentAnimation.curFrameTicks = 0;
                }
            }
        }
    }
}