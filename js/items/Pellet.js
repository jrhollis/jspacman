class Pellet extends Sprite {
    constructor (scene, x, y) {
        super(scene, x, y, 8, 8);
        this.points = 10;
        this.pellet = true;
    }
    
    get pelletColor() {
        return this.color||(this.scene.maze||{}).pelletColor || "#fcb4aa";
    }

    get hitBox() {
        return {x: this.position.x + 3, y: this.position.y + 3, w: 2, h: 2}
    }

    draw () {
        if (this.hidden) return;
        //doesn't animate, just draw
        var context = this.scene.context;
        context.beginPath();
        context.fillStyle = this.pelletColor;
        context.fillRect(this.position.x + 3, (this.position.y) + 3, 2, 2);
        context.fill();

        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#FF0000";
        // var tile = this.hitBox;
        // context.strokeRect(tile.x, tile.y, tile.w, tile.h);

    }
}