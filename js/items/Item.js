/**
 * items are power ups that pac-man can safely eat. They are worth points.
 * Unlike Entities, they don't move but can be animated
 */
class Item extends Sprite {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.width = 8;
        this.height = 8;
    }
    get hitBox() {
        return {x: this.position.x + 3, y: this.position.y + 3, w: 2, h: 2}
    }
}