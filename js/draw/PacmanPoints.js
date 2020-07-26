/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class PacmanPoints extends Sprite {
    /**
     * 
     * @param {*} scene 
     * @param {*} item thing that was eaten (fruit or ghost)
     * @param {*} score if fruit, the actual score, if ghost, the number of ghosts eaten 
     *                  during energized/fright period
     */
    constructor (scene, item, score) {
        super(scene, item.x, item.y, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 456, y: 144};
        //keep on the board for 2 seconds
        this.ticksToLive = 80; 
        this.score = score;  
        this.item = item;      
    }

    /**
     * if eaten, just set ticksToLive to zero so it doesn't draw, and then
     * gets deleted from the maze in the next tick
     */
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

    /**
     * find the points value sprite on the sprite sheet. some score sprites
     * are wider than 16 pixels, so take that into account
     */
    get textureOffsets() {
        switch(this.score) {
            //fruit
            case 100:
                return {x: 0, y: 0, w: 16};
            case 300:
                return {x: 16, y: 0, w: 16};
            case 500:
                return {x: 32, y: 0, w: 16};
            case 700:
                return {x: 48, y: 0, w: 16};
            case 1000:
                return {x: 64, y: 0, w: 18};
            case 2000:
                return {x: 60, y: 16, w: 24};
            case 3000:
                return {x: 60, y: 32, w: 24};
            case 5000:
                return {x: 60, y: 48, w: 24};
            default:
                //ghosts 1,2,3, or 4
                return {x: 16 * this.score, y: -16, w: 16};
        }
    }

    /**
     * as long as this sprite has ticksToLive, draw it
     */
    draw() {
        if (this.ticksToLive > 0) {
            //do x/y offset based on board.level
            var offset = this.textureOffsets;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, offset.w, 16,
                this.x - ((offset.w - 16) / 2), this.y, offset.w, 16  
            );
        }
    }
}