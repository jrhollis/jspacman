/*
the row of fruit that appears below the maze indicating which level
the player is on
*/

class PacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene, 0, 0, 16, 16);
        this.textureOffset = {x: 488, y: 48};
    }

    draw() {
        var fruits = [],
            level = Math.max(this.scene.level, 1);
        // pacman differs from ms pacman here. it pushes earlier fruit off the screen
        for (var i = level; i >= level-6; i--) {
            if (i < 1) break;
            fruits.unshift(PacmanFruit.getFruitIndex(i));
        }
        for (var i = 0; i < fruits.length; i++) {
            var offsetX = fruits[i] * 16,
                dstX = (24 - (2*i)) * 8;
            this.context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, this.width, this.height,
                dstX, 272, this.width, this.height  
            );
        }
    }
}