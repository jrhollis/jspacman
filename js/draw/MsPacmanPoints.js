/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class MsPacmanPoints extends Sprite {
    static TYPE_FRUIT = 0;
    static TYPE_GHOST = 1;
    constructor (scene, x, y, score, type) {
        super(scene, x, y); //always appear below ghost house
        this.textureOffset = {x: 504, y: 16};
        this.type = type;
        this.width = 16;
        this.height = 16;
        this.ticksToLive = 60; //TODO: what should this value be?
        this.score = score;        
    }

    eaten() {
        this.ticksToLive = 0;
    }

    tick() {
        this.ticksToLive--;
        if (this.ticksToLive < 0) {
            //pull self from the scene
            delete this.scene.pointSprite;
        }
    }

    get textureOffsets() {
        if (this.type == MsPacmanPoints.TYPE_FRUIT) {
            switch(this.score) {
                //fruit
                case 100:
                    return {x: 0, y: 0};
                case 200:
                    return {x: 16, y: 0};
                case 500:
                    return {x: 32, y: 0};
                case 700:
                    return {x: 48, y: 0};
                case 1000:
                    return {x: 64, y: 0};
                case 2000:
                    return {x: 80, y: 0};
                case 5000:
                    return {x: 96, y: 0};
            }
        } else {
            //ghost scores
            return {x: -16 * (3-this.score), y: 112};
        }
    }

    draw() {
        if (this.ticksToLive > 0) {
            var context = this.scene.context;
            //do x/y offset based on scene.level
            var offset = this.textureOffsets;
            context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, 16, 16,
                this.position.x, this.position.y, 16, 16  
            );
        }
    }
}