/*
the row of fruit that appears below the maze indicating which level
the player is on
*/

class PacmanLevelSprite extends Sprite {
    constructor(scene) {
        super(scene);
        this.textureOffset = {x: 488, y: 48};
        this.width = 16;
        this.height = 16;
    }

    draw() {
        var context = this.scene.context,
            fruits = [],
            level = Math.max(this.scene.level, 1);
        for (var i = level; i >= level-6; i--) {
            if (i < 1) break;
            var fruitIdx = PacmanFruit.getFruitIndex(i);
            fruits.unshift(fruitIdx);
        }
        for (var i = 0; i < fruits.length; i++) {
            var offsetX = fruits[i] * 16,
                dstX = (24 - (2*i)) * 8;
            context.drawImage(RESOURCE.pacman,
                this.textureOffset.x + offsetX, this.textureOffset.y, this.width, this.height,
                dstX, 272, this.width, this.height  
            );
        }
    }
}