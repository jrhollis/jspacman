/*
the row of (ms) pacmans that appear below the maze indicating 
how many tries the player has remaining
*/

class LivesSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.resource = GAME_MODE == GAME_PACMAN?RESOURCE.pacman:RESOURCE.mspacman;
        this.textureOffset = {x: 472, y: 0};
        this.width = 16;
        this.height = 16;
    }

    draw() {
        var context = this.scene.context;
        if (this.scene.pacman.lives > 0) {
            for (var i = 0; i < Math.min(this.scene.pacman.lives, 5); i++) {
                context.drawImage(this.resource,
                    this.textureOffset.x, this.textureOffset.y, this.width, this.height,
                    (i+1) * 16, 272, this.width, this.height  
                );
            }
        }
    }
}