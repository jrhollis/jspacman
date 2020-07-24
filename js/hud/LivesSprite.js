/** 
* the row of pacmans or ms pacmans that appear below the maze indicating 
* how many lives the player has remaining. maxes out at 5
*/
class LivesSprite extends Sprite {
    constructor(scene) {
        super(scene, 0, 0, 16, 16);
        if (Game.GAME_MODE == Game.GAME_PACMAN) {
            this.resource = RESOURCE.pacman;
            this.textureOffset = { x: 587, y: 16 };
        } else {
            this.resource = RESOURCE.mspacman;
            this.textureOffset = { x: 472, y: 0 };
        }
    }

    draw() {
        //can only draw a maximum of 5 pacman lives
        for (var i = 0; i < Math.min(this.scene.pacman.lives, 5); i++) {
            this.context.drawImage(this.resource,
                this.textureOffset.x, this.textureOffset.y, this.width, this.height,
                (i + 1) * this.width, 272, this.width, this.height
            );
        }
    }
}