/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class MsPacmanPoints extends PacmanPoints {
    //have to tell the difference between ghost points and fruit points
    //because they each have a potential conflicting value of 200
    static TYPE_FRUIT = 0;
    static TYPE_GHOST = 1;

    constructor (scene, x, y, score, type) {
        super(scene, x, y, score); //always appear below ghost house
        this.textureOffset = {x: 504, y: 16};
        //type will be ghost or fruit score
        this.type = type;
    }

    /**
     * find the coordinates of the points value sprite on the sprite sheet.
     */
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

    /**
     * as long as this sprite has ticksToLive, draw it
     */
    draw() {
        if (this.ticksToLive > 0) {
            var offset = this.textureOffsets;
            this.context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, 16, 16,
                this.position.x, this.position.y, 16, 16  
            );
        }
    }
}