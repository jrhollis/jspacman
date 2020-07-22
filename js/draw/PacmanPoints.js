/**
 *  points sprite shows up in spot where pacman eats a ghost or fruit
 * */
class PacmanPoints extends Sprite {
    constructor (scene, x, y, score) {
        super(scene, x, y, 16, 16); //always appear below ghost house
        this.textureOffset = {x: 456, y: 144};
        this.ticksToLive = 120; 
        this.score = score;        
    }

    eaten() {
        this.ticksToLive = 0;
    }

    tick() {
        this.ticksToLive--;
        if (this.ticksToLive < 0) {
            //pull self from the scene
            delete this.hide()
        }
    }

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

    draw() {
        if (this.ticksToLive > 0) {
            var context = this.scene.context;
            //do x/y offset based on board.level
            var offset = this.textureOffsets;
            context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offset.x, this.textureOffset.y + offset.y, offset.w, 16,
                this.position.x - ((offset.w - 16) / 2), this.position.y, offset.w, 16  
            );
        }
    }
}