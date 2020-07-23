/*
the row of (ms) pacmans that appear below the maze indicating 
how many tries the player has remaining
*/

class LivesSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.resource = Game.GAME_MODE == Game.GAME_PACMAN?RESOURCE.pacman:RESOURCE.mspacman;
        if (Game.GAME_MODE == Game.GAME_PACMAN) {
            this.textureOffset = {x: 587, y: 16};
        } else {
            this.textureOffset = {x: 472, y: 0}
        }
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