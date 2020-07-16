/*
the row of fruit that appears below the maze indicating which level
the player is on
*/

class MsPacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.textureOffset = {x: 504, y: 0};
        this.width = 16;
        this.height = 16;
    }

    draw() {
        var context = this.scene.context;
        for (var i = 0; i < Math.min(Math.max(this.scene.level,1), 7); i++) {
            context.drawImage(RESOURCE.mspacman,
                this.textureOffset.x + (i * 16), this.textureOffset.y, this.width, this.height,
                196 - (i * 16), 272, this.width, this.height  
            );
        }
    }
}